package handlers

import (
	"sync"
	"roadsos-emergency-engine/config"
	"roadsos-emergency-engine/models"
	"roadsos-emergency-engine/services"
	"roadsos-emergency-engine/utils"

	"github.com/gofiber/fiber/v2"
)

func HandleEmergency(c *fiber.Ctx) error {
	req := new(models.EmergencyRequest)

	if err := c.BodyParser(req); err != nil {
		return utils.Error(c, 400, "Invalid request body")
	}

	if req.Latitude == 0 || req.Longitude == 0 {
		return utils.Error(c, 400, "latitude and longitude are required")
	}

	if req.Severity == "" {
		req.Severity = "medium"
	}

	cfg := config.Load()

	// Use WaitGroup to parallelize API calls
	var wg sync.WaitGroup
	var hospitals []models.Hospital
	var police string

	// Parallel call 1: Get hospitals
	wg.Add(1)
	go func() {
		defer wg.Done()
		if cfg.MapsKey != "" && cfg.MapsKey != "your_key_here" {
			hospitals = services.GetRealHospitals(req.Latitude, req.Longitude, cfg.MapsKey)
		} else {
			hospitals = services.GetMockHospitals()
		}
	}()

	// Parallel call 2: Get police station
	wg.Add(1)
	go func() {
		defer wg.Done()
		police = services.GetNearestPoliceStation(req.Severity)
	}()

	wg.Wait()

	best := services.SelectBestHospital(hospitals, req.Severity)
	level := services.GetEmergencyLevel(req.Severity)

	response := models.EmergencyResponse{
		Status:               "success",
		RecommendedHospital:  best,
		AmbulanceAvailable:   true,
		NearestPoliceStation: police,
		EmergencyLevel:       level,
	}

	return utils.Success(c, response)
}