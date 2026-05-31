"""
RoadSoS X — FastAPI Backend (Member 4: Backend & Cloud Lead)
Updated with Emergency Intelligence integration (Member 5)
Version: 2.0.0
"""

from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import json
import sys
import os

import models, schemas
from database import engine, get_db

# Include emergency-intelligence module path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'emergency-intelligence'))
try:
    from emergency_engine import get_emergency_recommendation
    EMERGENCY_ENGINE_AVAILABLE = True
except ImportError:
    EMERGENCY_ENGINE_AVAILABLE = False
    print("[Backend] Emergency engine not found — install httpx in emergency-intelligence/venv")

# Create DB tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="RoadSoS X Backend API",
    description="Core backend for RoadSoS X intelligent mobility platform",
    version="2.0.0"
)

# CORS configuration for Dashboard & Mobile app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─────────────────────────────────────────────────────────────
#  WebSocket Connection Manager
# ─────────────────────────────────────────────────────────────
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"[WS] New client connected. Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        print(f"[WS] Client disconnected. Total: {len(self.active_connections)}")

    async def broadcast(self, message: str):
        dead = []
        for conn in self.active_connections:
            try:
                await conn.send_text(message)
            except Exception:
                dead.append(conn)
        for conn in dead:
            self.active_connections.remove(conn)

    async def broadcast_json(self, data: dict):
        await self.broadcast(json.dumps(data))

manager = ConnectionManager()


# ─────────────────────────────────────────────────────────────
#  Root
# ─────────────────────────────────────────────────────────────
@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "RoadSoS X Backend",
        "version": "2.0.0",
        "modules": {
            "emergency_engine": EMERGENCY_ENGINE_AVAILABLE,
        }
    }


# ─────────────────────────────────────────────────────────────
#  WebSocket — Live Telemetry Hub
#  Receives from: AI Engine, ESP32 TFT
#  Broadcasts to: React Dashboard, Mobile App
# ─────────────────────────────────────────────────────────────
@app.websocket("/ws/telemetry")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            raw = await websocket.receive_text()
            try:
                data = json.loads(raw)

                # Handle crash/SOS from TFT hardware
                msg_type = data.get("type", "")
                if msg_type in ("SOS_CRASH_DETECTED", "SOS_MANUAL"):
                    print(f"[WS] ⚠️  Emergency from TFT: {msg_type}")
                    await manager.broadcast_json({
                        "type": "EMERGENCY_SOS",
                        "source": msg_type,
                        "lat": data.get("lat"),
                        "lng": data.get("lng"),
                    })
                else:
                    # Regular AI telemetry — broadcast to all connected clients (dashboard)
                    await manager.broadcast(raw)

            except json.JSONDecodeError:
                # Broadcast raw text as-is
                await manager.broadcast(raw)

    except WebSocketDisconnect:
        manager.disconnect(websocket)


# ─────────────────────────────────────────────────────────────
#  User Endpoints
# ─────────────────────────────────────────────────────────────
@app.post("/users/", response_model=schemas.UserResponse)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    new_user = models.User(
        email=user.email,
        hashed_password=user.password + "_hashed"  # Replace with passlib in production
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.get("/users/", response_model=List[schemas.UserResponse])
def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.User).offset(skip).limit(limit).all()


# ─────────────────────────────────────────────────────────────
#  Incident / SOS Endpoints
# ─────────────────────────────────────────────────────────────
@app.post("/incidents/", response_model=schemas.IncidentResponse)
async def create_incident(
    incident: schemas.IncidentCreate,
    background_tasks: BackgroundTasks,
    user_id: int = 1,
    db: Session = Depends(get_db)
):
    new_incident = models.Incident(**incident.model_dump(), owner_id=user_id)
    db.add(new_incident)
    db.commit()
    db.refresh(new_incident)

    # Broadcast SOS emergency to all connected clients (Dashboard + TFT)
    await manager.broadcast_json({
        "type":        "EMERGENCY_SOS",
        "incident_id": new_incident.id,
        "severity":    new_incident.severity,
        "lat":         new_incident.lat,
        "lng":         new_incident.lng,
    })

    # Trigger emergency response lookup in background (non-blocking)
    if EMERGENCY_ENGINE_AVAILABLE:
        background_tasks.add_task(
            run_emergency_lookup,
            new_incident.lat,
            new_incident.lng,
            new_incident.severity
        )

    return new_incident

async def run_emergency_lookup(lat: float, lng: float, severity: str):
    """Background task: find nearby hospitals and broadcast result."""
    try:
        payload = await get_emergency_recommendation(lat, lng, severity)
        await manager.broadcast_json({
            "type": "EMERGENCY_DISPATCH",
            **payload,
        })
    except Exception as e:
        print(f"[Emergency] Lookup failed: {e}")

@app.get("/incidents/", response_model=List[schemas.IncidentResponse])
def read_incidents(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Incident).offset(skip).limit(limit).all()

@app.put("/incidents/{incident_id}/resolve", response_model=schemas.IncidentResponse)
def resolve_incident(incident_id: int, db: Session = Depends(get_db)):
    incident = db.query(models.Incident).filter(models.Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    incident.resolved = True
    db.commit()
    db.refresh(incident)
    return incident


# ─────────────────────────────────────────────────────────────
#  Emergency Intelligence Endpoint (Member 5)
# ─────────────────────────────────────────────────────────────
@app.get("/emergency/nearby")
async def get_emergency_services(lat: float, lng: float, severity: str = "critical"):
    """
    Find nearest hospitals, ambulance services, and police stations
    for a given GPS location and incident severity.
    Uses OpenStreetMap + OSRM routing (no API key required).
    """
    if not EMERGENCY_ENGINE_AVAILABLE:
        raise HTTPException(
            status_code=503,
            detail="Emergency engine not available. Install httpx in emergency-intelligence/"
        )
    result = await get_emergency_recommendation(lat, lng, severity)
    return result
