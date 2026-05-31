"""
RoadSoS X — Telemetry WebSocket Client (Member 1 ↔ Member 4)
Streams the AI risk payload to the FastAPI backend in real-time.

This is the integration bridge between:
  Phase 2 (AI Engine) → Phase 1 (Backend) → Phase 6 (Dashboard)

Sends JSON over ws://localhost:8000/ws/telemetry
"""

import asyncio
import json
import websockets
import logging

logger = logging.getLogger(__name__)


class TelemetryClient:
    def __init__(self, uri: str = "ws://localhost:8000/ws/telemetry"):
        self.uri = uri
        self.websocket = None
        self.connected = False
        print(f"[TelemetryClient] Configured to stream to: {uri}")

    async def connect(self):
        """Establish a persistent WebSocket connection to the backend."""
        while True:
            try:
                self.websocket = await websockets.connect(self.uri)
                self.connected = True
                print(f"[TelemetryClient] ✅ Connected to backend: {self.uri}")
                return
            except Exception as e:
                self.connected = False
                print(f"[TelemetryClient] ⚠️  Connection failed ({e}). Retrying in 3s...")
                await asyncio.sleep(3)

    async def send(self, payload: dict):
        """Send a telemetry payload to the backend."""
        if not self.connected or self.websocket is None:
            return

        try:
            message = json.dumps(payload)
            await self.websocket.send(message)
        except websockets.exceptions.ConnectionClosed:
            print("[TelemetryClient] Connection lost. Reconnecting...")
            self.connected = False
            await self.connect()
        except Exception as e:
            logger.error(f"[TelemetryClient] Send error: {e}")

    async def close(self):
        """Gracefully close the WebSocket connection."""
        if self.websocket:
            await self.websocket.close()
            self.connected = False
            print("[TelemetryClient] Connection closed.")
