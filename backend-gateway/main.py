from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect, BackgroundTasks, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import json
import sys
import os
from datetime import timedelta

import models, schemas, auth
from database import engine, get_db
from jose import JWTError, jwt

# Include emergency-intelligence module path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'emergency-engine'))
try:
    from emergency_engine import get_emergency_recommendation
    EMERGENCY_ENGINE_AVAILABLE = True
except ImportError:
    EMERGENCY_ENGINE_AVAILABLE = False
    print("[Backend] Emergency engine not found — install httpx in emergency-engine/venv")

# Create DB tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="RoadSoS X Backend Gateway",
    description="Enterprise Gateway for RoadSoS X intelligent mobility platform",
    version="3.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

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
#  Auth Dependencies
# ─────────────────────────────────────────────────────────────
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        email: str = payload.get("email")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception
    return user


# ─────────────────────────────────────────────────────────────
#  Root
# ─────────────────────────────────────────────────────────────
@app.get("/")
def read_root():
    return {"status": "online", "service": "RoadSoS X Backend Gateway", "version": "3.0.0"}


# ─────────────────────────────────────────────────────────────
#  Authentication Endpoints
# ─────────────────────────────────────────────────────────────
@app.post("/api/auth/register", response_model=schemas.UserResponse)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = auth.get_password_hash(user.password)
    new_user = models.User(email=user.email, hashed_password=hashed_password, full_name=user.full_name)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/api/auth/login", response_model=auth.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    access_token = auth.create_access_token(data={"email": user.email})
    return {"access_token": access_token, "token_type": "bearer"}


# ─────────────────────────────────────────────────────────────
#  WebSocket — Live Telemetry Hub
# ─────────────────────────────────────────────────────────────
@app.websocket("/ws/telemetry")
async def websocket_endpoint(websocket: WebSocket):
    # Note: In a production app, we would extract the Bearer token from WebSocket headers or query params
    # For now, we accept the connection for telemetry broadcasting.
    await manager.connect(websocket)
    try:
        while True:
            raw = await websocket.receive_text()
            try:
                data = json.loads(raw)
                msg_type = data.get("type", "")
                
                # Hardware SOS Trigger
                if msg_type in ("SOS_CRASH_DETECTED", "SOS_MANUAL"):
                    print(f"[WS] ⚠️  Emergency from Hardware: {msg_type}")
                    await manager.broadcast_json({
                        "type": "EMERGENCY_SOS",
                        "source": msg_type,
                        "lat": data.get("lat"),
                        "lng": data.get("lng"),
                    })
                
                # Auto-SOS Trigger (Phase 6 implementation logic)
                elif data.get("collision_risk") == "CRITICAL" or data.get("risk_score", 0) > 85:
                    print(f"[WS] 🚨 Auto-SOS Triggered by AI Engine")
                    await manager.broadcast_json({
                        "type": "EMERGENCY_SOS",
                        "source": "AI_AUTO_SOS",
                        "lat": data.get("lat", 13.0827),
                        "lng": data.get("lng", 80.2707),
                    })
                else:
                    await manager.broadcast(raw)

            except json.JSONDecodeError:
                await manager.broadcast(raw)

    except WebSocketDisconnect:
        manager.disconnect(websocket)


# ─────────────────────────────────────────────────────────────
#  REST APIs (Secured)
# ─────────────────────────────────────────────────────────────
@app.post("/api/location", response_model=schemas.LocationResponse)
def update_location(loc: schemas.LocationCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    new_loc = models.Location(**loc.model_dump())
    db.add(new_loc)
    db.commit()
    db.refresh(new_loc)
    return new_loc

@app.post("/api/risk", response_model=schemas.RiskReportResponse)
def submit_risk_report(report: schemas.RiskReportCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    new_report = models.RiskReport(**report.model_dump())
    db.add(new_report)
    db.commit()
    db.refresh(new_report)
    return new_report

@app.post("/api/sos", response_model=schemas.IncidentResponse)
async def trigger_sos(
    incident: schemas.IncidentCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    new_incident = models.Incident(**incident.model_dump(), owner_id=current_user.id)
    db.add(new_incident)
    db.commit()
    db.refresh(new_incident)

    await manager.broadcast_json({
        "type":        "EMERGENCY_SOS",
        "incident_id": new_incident.id,
        "severity":    new_incident.severity,
        "lat":         new_incident.lat,
        "lng":         new_incident.lng,
    })

    if EMERGENCY_ENGINE_AVAILABLE:
        background_tasks.add_task(run_emergency_lookup, new_incident.lat, new_incident.lng, new_incident.severity)

    return new_incident

async def run_emergency_lookup(lat: float, lng: float, severity: str):
    try:
        payload = await get_emergency_recommendation(lat, lng, severity)
        await manager.broadcast_json({
            "type": "EMERGENCY_DISPATCH",
            **payload,
        })
    except Exception as e:
        print(f"[Emergency] Lookup failed: {e}")

@app.get("/api/incidents", response_model=List[schemas.IncidentResponse])
def get_incidents(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.Incident).filter(models.Incident.owner_id == current_user.id).all()

@app.get("/api/hospitals")
async def get_hospitals(lat: float, lng: float, current_user: models.User = Depends(get_current_user)):
    if not EMERGENCY_ENGINE_AVAILABLE:
        raise HTTPException(status_code=503, detail="Emergency engine unavailable")
    # A dedicated hospitals endpoint using emergency engine
    res = await get_emergency_recommendation(lat, lng, "medium")
    return {"hospitals": res.get("primary_hospital")}

@app.get("/api/police")
async def get_police(lat: float, lng: float, current_user: models.User = Depends(get_current_user)):
    if not EMERGENCY_ENGINE_AVAILABLE:
        raise HTTPException(status_code=503, detail="Emergency engine unavailable")
    res = await get_emergency_recommendation(lat, lng, "critical")
    return {"police": res.get("police_station")}

# Phase 3 Endpoint: AI Video Frame Analysis
@app.post("/api/ai/analyze")
def analyze_frame(payload: dict, current_user: models.User = Depends(get_current_user)):
    """
    Accepts video frame or sensor data and returns risk analysis.
    In a real scenario, this would pass the image bytes to YOLOv8.
    For Phase 3 API structural compliance, it accepts JSON.
    """
    risk_level = "LOW"
    collision_prob = 12.5
    
    # Mock inference logic integration
    if payload.get("speed", 0) > 100:
        risk_level = "HIGH"
        collision_prob = 89.0
        
    return {
        "risk_level": risk_level,
        "collision_probability": collision_prob,
        "objects_detected": ["car", "truck"],
        "driver_status": "AWAKE"
    }
