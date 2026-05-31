from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

# USER SCHEMAS
class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# VEHICLE SCHEMAS
class VehicleBase(BaseModel):
    vin: str
    model: str

class VehicleCreate(VehicleBase):
    pass

class VehicleResponse(VehicleBase):
    id: int
    owner_id: int

    class Config:
        from_attributes = True

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
    id: int
    resolved: bool
    timestamp: datetime
    owner_id: int
    vehicle_id: int

    class Config:
        from_attributes = True
