// ============================================================
// RoadSoS X — API Service Layer
// Fetch wrapper for all REST API communications
// ============================================================

import type {
  VehicleTelemetry,
  AIAlert,
  SystemHealth,
  SOSEvent,
  ApiResponse,
} from '@/types';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    throw new Error(`API Error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export async function fetchVehicles(): Promise<ApiResponse<VehicleTelemetry[]>> {
  return apiFetch<ApiResponse<VehicleTelemetry[]>>('/vehicles');
}

export async function fetchVehicle(id: string): Promise<ApiResponse<VehicleTelemetry>> {
  return apiFetch<ApiResponse<VehicleTelemetry>>(`/vehicles/${id}`);
}

export async function fetchAlerts(): Promise<ApiResponse<AIAlert[]>> {
  return apiFetch<ApiResponse<AIAlert[]>>('/alerts');
}

export async function fetchSystemHealth(): Promise<ApiResponse<SystemHealth>> {
  return apiFetch<ApiResponse<SystemHealth>>('/system-health');
}

export async function triggerSOS(vehicleId?: string): Promise<ApiResponse<SOSEvent>> {
  return apiFetch<ApiResponse<SOSEvent>>('/sos/trigger', {
    method: 'POST',
    body: JSON.stringify({ vehicle_id: vehicleId }),
  });
}

export async function resetSOS(): Promise<ApiResponse<SOSEvent>> {
  return apiFetch<ApiResponse<SOSEvent>>('/sos/reset', {
    method: 'POST',
  });
}

export async function fetchHealth(): Promise<{ status: string; uptime: number }> {
  return apiFetch('/health');
}
