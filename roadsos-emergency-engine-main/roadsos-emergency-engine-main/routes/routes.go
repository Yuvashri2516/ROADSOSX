package routes

import (
	"roadsos-emergency-engine/handlers"
	"github.com/gofiber/fiber/v2"
)

func Setup(app *fiber.App) {
	api := app.Group("/api")
	emergency := api.Group("/emergency")
	emergency.Post("/find-help", handlers.HandleEmergency)

	// WebSocket endpoint for emergency status updates
	app.Get("/ws/emergency-status", handlers.HandleWebSocket)
}