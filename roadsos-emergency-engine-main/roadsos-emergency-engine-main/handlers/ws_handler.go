package handlers

import (
	"fmt"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/websocket/v2"
)

func HandleWebSocket(c *fiber.Ctx) error {
	if websocket.IsWebSocketUpgrade(c) {
		return websocket.New(func(ws *websocket.Conn) {
			fmt.Println("[WebSocket] New emergency status connection established")

			events := []map[string]interface{}{
				{"event": "ambulance_dispatched", "eta_minutes": 6},
				{"event": "ambulance_en_route", "eta_minutes": 4},
				{"event": "ambulance_arrived", "eta_minutes": 0},
			}

			for i, eventData := range events {
				err := ws.WriteJSON(eventData)
				if err != nil {
					fmt.Printf("[WebSocket] Error sending event %d: %v\n", i, err)
					break
				}
				fmt.Printf("[WebSocket] Sent: %v\n", eventData)

				if i < len(events)-1 {
					time.Sleep(3 * time.Second)
				}
			}

			fmt.Println("[WebSocket] Connection closing after all events sent")
			ws.Close()
		})(c)
	}
	return c.Status(400).SendString("WebSocket upgrade required")
}
