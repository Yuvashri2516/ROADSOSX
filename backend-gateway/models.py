from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    incidents = relationship("Incident", back_populates="owner")
    vehicles = relationship("Vehicle", back_populates="owner")
    emergency_contacts = relationship("EmergencyContact", back_populates="user")

class EmergencyContact(Base):
    __tablename__ = "emergency_contacts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String)
    phone_number = Column(String)
    relationship_type = Column(String)
    
    user = relationship("User", back_populates="emergency_contacts")

class Vehicle(Base):
    __tablename__ = "vehicles"
    
    id = Column(Integer, primary_key=True, index=True)
    vin = Column(String, unique=True, index=True)
    model = Column(String)
    owner_id = Column(Integer, ForeignKey("users.id"))
    
    owner = relationship("User", back_populates="vehicles")
    incidents = relationship("Incident", back_populates="vehicle")
    locations = relationship("Location", back_populates="vehicle")
    risk_reports = relationship("RiskReport", back_populates="vehicle")

class Location(Base):
    __tablename__ = "locations"
    
    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"))
    lat = Column(Float)
    lng = Column(Float)
    speed = Column(Float, default=0.0)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    vehicle = relationship("Vehicle", back_populates="locations")

class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(String)
    severity = Column(String) # low, medium, high, critical
    lat = Column(Float)
    lng = Column(Float)
    resolved = Column(Boolean, default=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    owner_id = Column(Integer, ForeignKey("users.id"))
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"))
    
    owner = relationship("User", back_populates="incidents")
    vehicle = relationship("Vehicle", back_populates="incidents")
    logs = relationship("EmergencyLog", back_populates="incident")

class EmergencyLog(Base):
    __tablename__ = "emergency_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id"))
    action_taken = Column(String)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    incident = relationship("Incident", back_populates="logs")

class RiskReport(Base):
    __tablename__ = "risk_reports"
    
    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"))
    risk_level = Column(String) # LOW, MEDIUM, HIGH, CRITICAL
    collision_probability = Column(Float)
    driver_status = Column(String)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    vehicle = relationship("Vehicle", back_populates="risk_reports")
