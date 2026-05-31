// ============================================================
// RoadSoS X — TypeScript Type Definitions
// Core interfaces for vehicle telemetry, alerts, SOS, health
// ============================================================

export type SensorStatus = 'online' | 'degraded' | 'offline';
export type HealthStatus = 'online' | 'degraded' | 'offline';
export type AlertType = 'COLLISION_RISK' | 'LANE_DEPARTURE' | 'DROWSINESS_DETECTED' | 'OVERSPEED';
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface GPSCoordinates {
  lat: number;
  lng: number;
}

export interface VehicleSensors {
  camera: SensorStatus;
  lidar: SensorStatus;
  radar: SensorStatus;
  ultrasonic: SensorStatus;
}

export interface DetectedObjects {
  bus: number;
  car: number;
  person: number;
  truck: number;
}

export interface AIStatus {
  collision_risk: string;
  lane_status: string;
  driver_status: string;
  alert_required: boolean;
  processed_frames: number;
  processing_time: number;
  detected_objects: DetectedObjects;
}

export interface VehicleTelemetry {
  vehicle_id: string;
  model: string;
  speed: number;
  rpm: number;
  battery: number;
  brake_temp?: number;
  fuel_level?: number;
  gear?: number;
  gps: GPSCoordinates;
  sensors: VehicleSensors;
  timestamp: string;
}

export interface AIAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  vehicle_id?: string;
  risk_score: number;
  timestamp: string;
}

export interface Hospital {
  name: string;
  distance_km: number;
  eta_minutes: number;
  available_beds: number;
}

export interface SOSEvent {
  active: boolean;
  timestamp?: string; // added to match old useSocket
  triggered_at?: string | null;
  vehicle_id?: string | null;
  location: GPSCoordinates | null;
  ambulance_eta: number;
  ambulance_dispatched?: boolean; // added to match old useSocket
  dispatched?: boolean;
  nearby_hospitals?: Hospital[];
  notification_sent?: boolean;
}

export interface SystemHealth {
  api: HealthStatus;
  websocket?: HealthStatus;
  database: HealthStatus;
  uptime: number;
  latency_ms: number;
  connected_vehicles?: number;
  cpu_temp?: number; // added to match old useSocket
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  count?: number;
  error?: string;
}
