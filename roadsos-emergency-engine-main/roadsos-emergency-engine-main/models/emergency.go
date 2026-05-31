package models

type EmergencyRequest struct {
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
	Severity  string  `json:"severity"`
}

type Hospital struct {
	Name       string  `json:"name"`
	DistanceKm float64 `json:"distance_km"`
	ETAMinutes int     `json:"eta_minutes"`
	Type       string  `json:"type"`
}

type EmergencyResponse struct {
	Status               string   `json:"status"`
	RecommendedHospital  Hospital `json:"recommended_hospital"`
	AmbulanceAvailable   bool     `json:"ambulance_available"`
	NearestPoliceStation string   `json:"nearest_police_station"`
	EmergencyLevel       string   `json:"emergency_level"`
}