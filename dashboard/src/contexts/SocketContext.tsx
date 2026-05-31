'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import type {
  VehicleTelemetry,
  AIAlert,
  SOSEvent,
  SystemHealth,
  AIStatus,
} from '@/types';

interface SocketContextValue {
  telemetry: VehicleTelemetry | null;
  aiStatus: AIStatus | null;
  alerts: AIAlert[];
  sosEvent: SOSEvent | null;
  systemHealth: SystemHealth | null;
  isConnected: boolean;
  triggerSOS: () => void;
  resetSOS: () => void;
}

const SocketContext = createContext<SocketContextValue | null>(null);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [telemetry, setTelemetry] = useState<VehicleTelemetry | null>(null);
  const [aiStatus, setAiStatus]   = useState<AIStatus | null>(null);
  const [alerts, setAlerts]       = useState<AIAlert[]>([]);
  const [sosEvent, setSosEvent]   = useState<SOSEvent | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [isConnected, setIsConnected]   = useState(false);

  const gpsRef    = useRef<{ lat: number; lng: number }>({ lat: 13.0827, lng: 80.2707 });
  const wsRef     = useRef<WebSocket | null>(null);
  const alertsRef = useRef<AIAlert[]>([]);

  const addAlert = useCallback((alert: AIAlert) => {
    const updated = [alert, ...alertsRef.current].slice(0, 50);
    alertsRef.current = updated;
    setAlerts(updated);
  }, []);

  useEffect(() => {
    let reconnectTimeout: ReturnType<typeof setTimeout>;

    function connect() {
      try {
        const ws = new WebSocket('ws://localhost:8000/ws/telemetry');
        wsRef.current = ws;

        ws.onopen = () => setIsConnected(true);

        ws.onmessage = (event) => {
          try {
            if (!event.data.startsWith('{')) return;
            const data = JSON.parse(event.data);

            if (data.type === 'EMERGENCY_SOS') {
              setSosEvent({
                active: true,
                timestamp: new Date().toISOString(),
                location: gpsRef.current,
                ambulance_dispatched: true,
                ambulance_eta: 5.5,
              });

            } else if (data.type === 'EMERGENCY_DISPATCH') {
              setSosEvent(prev => prev ? {
                ...prev,
                ambulance_eta: data.primary_hospital?.eta_minutes ?? prev.ambulance_eta,
              } : null);

            } else if (data.collision_risk !== undefined) {
              setAiStatus({
                collision_risk:   data.collision_risk,
                lane_status:      data.lane_status,
                driver_status:    data.driver_status,
                alert_required:   data.alert_required,
                processed_frames: data.processed_frames,
                processing_time:  data.processing_time,
                detected_objects: data.detected_objects ?? {},
              });

              setSystemHealth(prev => ({
                uptime:     prev?.uptime ?? 0,
                latency_ms: Math.round(data.processing_time ?? 0),
                cpu_temp:   prev?.cpu_temp ?? 42,
                api:        'online',
                database:   'online',
              }));

              if (data.alert_required) {
                const risk = data.collision_risk;
                if (risk === 'CRITICAL' || risk === 'HIGH') {
                  addAlert({
                    id:         `alert-${Date.now()}`,
                    timestamp:  new Date().toISOString(),
                    type:       'COLLISION_RISK',
                    severity:   risk === 'CRITICAL' ? 'critical' : 'high',
                    message:    risk === 'CRITICAL'
                                  ? '🚨 CRITICAL Collision Risk Detected!'
                                  : '⚠️ High Collision Risk — Reduce Speed',
                    risk_score: data.risk_score ?? 90,
                  });
                }
                if (data.lane_status && data.lane_status !== 'LANE STABLE' && data.lane_status !== 'NO LANE DETECTED') {
                  addAlert({
                    id:         `alert-lane-${Date.now()}`,
                    timestamp:  new Date().toISOString(),
                    type:       'LANE_DEPARTURE',
                    severity:   'medium',
                    message:    `⚠️ ${data.lane_status} — Correct Steering`,
                    risk_score: 65,
                  });
                }
              }
            }
          } catch (err) {
            console.error('[SocketProvider] Parse error:', err);
          }
        };

        ws.onclose = () => {
          setIsConnected(false);
          wsRef.current = null;
          reconnectTimeout = setTimeout(connect, 4000);
        };

        ws.onerror = () => ws.close();

      } catch (e) {
        console.error('[SocketProvider] Failed to connect:', e);
        reconnectTimeout = setTimeout(connect, 4000);
      }
    }

    connect();

    setTelemetry({
      vehicle_id: 'VH-1024',
      model:      'RoadSoS X Series',
      timestamp:  new Date().toISOString(),
      speed:      0,
      rpm:        0,
      battery:    100,
      gps:        gpsRef.current,
      sensors: {
        camera:    'online',
        radar:     'online',
        lidar:     'online',
        ultrasonic:'online',
      },
    });

    setSystemHealth({
      uptime:     0,
      latency_ms: 0,
      cpu_temp:   42,
      api:        'online',
      database:   'online',
    });

    return () => {
      clearTimeout(reconnectTimeout);
      wsRef.current?.close();
    };
  }, [addAlert]);

  const triggerSOS = useCallback(async () => {
    try {
      await fetch('http://localhost:8000/incidents/', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:       'Manual SOS Trigger',
          description: 'Driver manually triggered SOS via dashboard',
          severity:    'critical',
          lat:         gpsRef.current.lat,
          lng:         gpsRef.current.lng,
          vehicle_id:  1,
        }),
      });
    } catch (err) {
      console.error('[SocketProvider] SOS trigger failed:', err);
      setSosEvent({
        active:               true,
        timestamp:            new Date().toISOString(),
        location:             gpsRef.current,
        ambulance_dispatched: false,
        ambulance_eta:        null,
      });
    }
  }, []);

  const resetSOS = useCallback(() => setSosEvent(null), []);

  const value: SocketContextValue = {
    telemetry, aiStatus, alerts, sosEvent, systemHealth, isConnected, triggerSOS, resetSOS
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

export function useGlobalSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useGlobalSocket must be used within a SocketProvider');
  }
  return context;
}
