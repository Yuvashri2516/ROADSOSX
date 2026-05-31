import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../backend-gateway'))

os.environ["DATABASE_URL"] = "sqlite:///./test.db"

from main import app
from database import Base, get_db

# Use in-memory SQLite for testing to ensure isolation
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

@pytest.fixture(autouse=True)
def run_around_tests():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

def test_read_main():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["service"] == "RoadSoS X Backend Gateway"

def test_user_registration():
    response = client.post(
        "/api/auth/register",
        json={"email": "test@roadsos.ai", "password": "securepassword", "full_name": "Test Driver"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@roadsos.ai"
    assert "id" in data

def test_user_login():
    # Register first
    client.post(
        "/api/auth/register",
        json={"email": "login@roadsos.ai", "password": "securepassword", "full_name": "Login Driver"}
    )
    
    # Then Login
    response = client.post(
        "/api/auth/login",
        data={"username": "login@roadsos.ai", "password": "securepassword"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_secure_sos_endpoint():
    # Attempt SOS without token
    response = client.post(
        "/api/sos",
        json={"title": "Crash", "severity": "HIGH", "lat": 13.0, "lng": 80.0, "vehicle_id": 1}
    )
    assert response.status_code == 401

    # Register & Login
    client.post("/api/auth/register", json={"email": "sos@roadsos.ai", "password": "pass", "full_name": "SOS"})
    login_res = client.post("/api/auth/login", data={"username": "sos@roadsos.ai", "password": "pass"})
    token = login_res.json()["access_token"]

    # Attempt SOS with token
    response = client.post(
        "/api/sos",
        headers={"Authorization": f"Bearer {token}"},
        json={"title": "Crash", "severity": "HIGH", "lat": 13.0, "lng": 80.0, "vehicle_id": 1}
    )
    assert response.status_code == 200
    assert response.json()["title"] == "Crash"
