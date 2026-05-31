from pydantic import BaseModel, EmailStr, ConfigDict
from typing import List, Optional
from datetime import datetime

# USER SCHEMAS
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    is_active: bool
    created_at: datetime

class UserLogin(BaseModel):
    email: EmailStr
    password: str

# EMERGENCY CONTACT SCHEMAS
class EmergencyContactBase(BaseModel):
    name: str
    phone_number: str
    relationship_type: str

class EmergencyContactCreate(EmergencyContactBase):
    pass

class EmergencyContactResponse(EmergencyContactBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int

# VEHICLE SCHEMAS
class VehicleBase(BaseModel):
    vin: str
    model: str

class VehicleCreate(VehicleBase):
    pass

class VehicleResponse(VehicleBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    owner_id: int

# LOCATION SCHEMAS
class LocationBase(BaseModel):
    lat: float
    lng: float
    speed: float = 0.0

class LocationCreate(LocationBase):
    vehicle_id: int

class LocationResponse(LocationBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    vehicle_id: int
    timestamp: datetime

# RISK REPORT SCHEMAS
class RiskReportBase(BaseModel):
    risk_level: str
    collision_probability: float
    driver_status: str

class RiskReportCreate(RiskReportBase):
    vehicle_id: int

class RiskReportResponse(RiskReportBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    vehicle_id: int
    timestamp: datetime

# INCIDENT SCHEMAS
class IncidentBase(BaseModel):
    title: str
    description: Optional[str] = None
    severity: str
    lat: float
    lng: float

class IncidentCreate(IncidentBase):
    vehicle_id: int

class IncidentResponse(IncidentBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    resolved: bool
    timestamp: datetime
    owner_id: int
    vehicle_id: int
