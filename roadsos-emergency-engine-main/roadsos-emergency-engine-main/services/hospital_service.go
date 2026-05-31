package services

import (
	"encoding/json"
	"fmt"
	"roadsos-emergency-engine/models"

	"github.com/go-resty/resty/v2"
)

type placesResponse struct {
	Status   string `json:"status"`
	ErrorMsg string `json:"error_message"`
	Results  []struct {
		Name     string `json:"name"`
		Geometry struct {
			Location struct {
				Lat float64 `json:"lat"`
				Lng float64 `json:"lng"`
			} `json:"location"`
		} `json:"geometry"`
		Types []string `json:"types"`
	} `json:"results"`
}

type distanceResponse struct {
	Status   string `json:"status"`
	ErrorMsg string `json:"error_message"`
	Rows     []struct {
		Elements []struct {
			Duration struct {
				Value int `json:"value"`
			} `json:"duration"`
			Distance struct {
				Value int `json:"value"`
			} `json:"distance"`
			Status string `json:"status"`
		} `json:"elements"`
	} `json:"rows"`
}

func GetRealHospitals(lat, lng float64, apiKey string) []models.Hospital {
	client := resty.New()

	// ===== DEBUG: Log API Key (first 8 chars only) =====
	apiKeyDebug := apiKey
	if len(apiKey) > 8 {
		apiKeyDebug = apiKey[:8] + "..."
	}
	fmt.Printf("[DEBUG] API Key: %s | Coordinates: lat=%.4f, lng=%.4f\n", apiKeyDebug, lat, lng)

	// ===== Build and Log URL =====
	queryParams := map[string]string{
		"location": fmt.Sprintf("%f,%f", lat, lng),
		"radius":   "5000",
		"type":     "hospital",
		"key":      apiKey,
	}
	
	fullURL := fmt.Sprintf("https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=%s&radius=5000&type=hospital&key=%s",
		fmt.Sprintf("%f,%f", lat, lng),
		apiKeyDebug)
	fmt.Printf("[DEBUG] Full URL (with masked key): %s\n", fullURL)

	// ===== Call Google Places API =====
	resp, err := client.R().
		SetQueryParams(queryParams).
		Get("https://maps.googleapis.com/maps/api/place/nearbysearch/json")

	// ===== DEBUG: Check for network errors =====
	if err != nil {
		fmt.Printf("[ERROR] Network error calling Places API: %v\n", err)
		fmt.Println("[DEBUG] Falling back to mock data")
		return GetMockHospitals()
	}

	// ===== DEBUG: Check HTTP status code =====
	fmt.Printf("[DEBUG] HTTP Status Code: %d\n", resp.StatusCode())

	if resp.StatusCode() != 200 {
		fmt.Printf("[ERROR] Places API returned non-200 status: %d\n", resp.StatusCode())
		fmt.Printf("[DEBUG] Response body: %s\n", string(resp.Body()))
		fmt.Println("[DEBUG] Falling back to mock data")
		return GetMockHospitals()
	}

	// ===== DEBUG: Log raw response body =====
	fmt.Printf("[DEBUG] Raw API Response (first 500 chars): %s\n", 
		truncateString(string(resp.Body()), 500))

	// ===== Parse JSON response =====
	var places placesResponse
	err = json.Unmarshal(resp.Body(), &places)
	if err != nil {
		fmt.Printf("[ERROR] Failed to parse JSON response: %v\n", err)
		fmt.Printf("[DEBUG] Raw body was: %s\n", string(resp.Body()))
		fmt.Println("[DEBUG] Falling back to mock data")
		return GetMockHospitals()
	}

	// ===== DEBUG: Log API Status field =====
	fmt.Printf("[DEBUG] Google Places Status: %s | Results: %d\n", places.Status, len(places.Results))
	if places.ErrorMsg != "" {
		fmt.Printf("[DEBUG] Error Message: %s\n", places.ErrorMsg)
	}

	// ===== Check for specific Google API error statuses =====
	switch places.Status {
	case "REQUEST_DENIED":
		fmt.Println("[ERROR] REQUEST_DENIED - API key is invalid or not linked to this project")
		fmt.Println("[ACTION] Check Google Cloud Console: Enable Places API and verify API key is authorized")
		return GetMockHospitals()
	case "OVER_QUERY_LIMIT":
		fmt.Println("[ERROR] OVER_QUERY_LIMIT - Quota exceeded, likely billing issue")
		fmt.Println("[ACTION] Check Google Cloud Console: Verify billing is enabled and account has sufficient quota")
		return GetMockHospitals()
	case "INVALID_REQUEST":
		fmt.Println("[ERROR] INVALID_REQUEST - Parameters are malformed")
		fmt.Printf("[ACTION] Check: location=%f,%f, radius=5000, type=hospital, key=***\n", lat, lng)
		return GetMockHospitals()
	case "ZERO_RESULTS":
		fmt.Printf("[DEBUG] ZERO_RESULTS - No hospitals found in 5km radius around (%.4f, %.4f)\n", lat, lng)
		fmt.Println("[DEBUG] This is normal for remote areas. Falling back to mock data")
		return GetMockHospitals()
	case "OK":
		fmt.Println("[SUCCESS] Google Places API responded successfully with status OK")
	default:
		fmt.Printf("[WARNING] Unexpected status from Google Places API: %s\n", places.Status)
		if places.Status != "" {
			fmt.Println("[DEBUG] Falling back to mock data")
			return GetMockHospitals()
		}
	}

	// ===== DEBUG: Log number of results =====
	fmt.Printf("[DEBUG] Number of hospitals found: %d\n", len(places.Results))

	if len(places.Results) == 0 {
		fmt.Println("[DEBUG] No hospitals in results, using mock data")
		return GetMockHospitals()
	}

	// ===== DEBUG: Log hospital names found =====
	fmt.Println("[DEBUG] Hospitals found:")
	for i, p := range places.Results {
		fmt.Printf("  [%d] %s (%.4f, %.4f)\n", 
			i+1, p.Name, p.Geometry.Location.Lat, p.Geometry.Location.Lng)
	}

	// Build destinations for Distance Matrix
	destinations := ""
	limit := 4
	if len(places.Results) < limit {
		limit = len(places.Results)
	}

	for i := 0; i < limit; i++ {
		if i > 0 {
			destinations += "|"
		}
		p := places.Results[i]
		destinations += fmt.Sprintf("%f,%f",
			p.Geometry.Location.Lat,
			p.Geometry.Location.Lng)
	}

	fmt.Printf("[DEBUG] Calling Distance Matrix API with %d destinations\n", limit)

	// Call Distance Matrix API
	distResp, err := client.R().
		SetQueryParams(map[string]string{
			"origins":      fmt.Sprintf("%f,%f", lat, lng),
			"destinations": destinations,
			"key":          apiKey,
		}).
		Get("https://maps.googleapis.com/maps/api/distancematrix/json")

	var distData distanceResponse
	if err != nil {
		fmt.Printf("[WARNING] Distance Matrix API error: %v\n", err)
	} else {
		fmt.Printf("[DEBUG] Distance Matrix HTTP Status: %d\n", distResp.StatusCode())
		fmt.Printf("[DEBUG] Distance Matrix API Status: %s\n", distData.Status)
		json.Unmarshal(distResp.Body(), &distData)
	}

	// Build hospital list
	var hospitals []models.Hospital
	for i := 0; i < limit; i++ {
		p := places.Results[i]
		eta := 10
		distKm := 0.0

		if len(distData.Rows) > 0 &&
			len(distData.Rows[0].Elements) > i &&
			distData.Rows[0].Elements[i].Status == "OK" {
			eta = distData.Rows[0].Elements[i].Duration.Value / 60
			distKm = float64(distData.Rows[0].Elements[i].Distance.Value) / 1000
		}

		hType := "general"
		for _, t := range p.Types {
			if t == "hospital" {
				hType = "trauma"
				break
			}
		}

		hospitals = append(hospitals, models.Hospital{
			Name:       p.Name,
			DistanceKm: distKm,
			ETAMinutes: eta,
			Type:       hType,
		})
	}

	fmt.Printf("[SUCCESS] Returning %d hospitals from Google Places API\n", len(hospitals))
	return hospitals
}

// Helper function to truncate long strings for logging
func truncateString(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen] + "..."
}

func GetMockHospitals() []models.Hospital {
	return []models.Hospital{
		{Name: "Apollo Trauma Center", DistanceKm: 2.5, ETAMinutes: 6, Type: "trauma"},
		{Name: "Government Royapettah Hospital", DistanceKm: 3.1, ETAMinutes: 8, Type: "general"},
		{Name: "Vijaya Health Centre", DistanceKm: 1.8, ETAMinutes: 5, Type: "clinic"},
		{Name: "MIOT International", DistanceKm: 4.2, ETAMinutes: 11, Type: "trauma"},
	}
}

func GetNearestPoliceStation(severity string) string {
	if severity == "critical" {
		return "T Nagar Police Station"
	}
	return ""
}