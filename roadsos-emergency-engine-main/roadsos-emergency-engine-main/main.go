package main

import (
	"log"
	"roadsos-emergency-engine/config"
	"roadsos-emergency-engine/routes"

	"github.com/gofiber/fiber/v2"
)

func main() {
	cfg := config.Load()

	app := fiber.New()

	// Root endpoint
	app.Get("/", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":  "ok",
			"message": "RoadSoS Emergency Engine Running",
			"version": "2.0.0",
		})
	})

	// Health check endpoint
	app.Get("/api/health", func(c *fiber.Ctx) error {
		mapsStatus := "disconnected"
		if cfg.MapsKey != "" && cfg.MapsKey != "your_key_here" {
			mapsStatus = "connected"
		}
		return c.JSON(fiber.Map{
			"status":       "ok",
			"service":      "RoadSoS",
			"version":      "2.0.0",
			"google_maps":  mapsStatus,
		})
	})

	routes.Setup(app)

	port := cfg.Port
	if port == "" {
		port = "3000"
	}

	log.Println("Server starting on port", port)
	log.Fatal(app.Listen(":" + port))
}