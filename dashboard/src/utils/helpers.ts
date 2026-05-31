// ============================================================
// RoadSoS X — Utility Helpers (Light Theme)
// ============================================================

import type { AlertType, AlertSeverity, SensorStatus, HealthStatus } from '@/types';

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatSpeed(speed: number): string {
  return `${Math.round(speed)}`;
}

export function formatRPM(rpm: number): string {
  return rpm >= 1000 ? `${(rpm / 1000).toFixed(1)}k` : `${Math.round(rpm)}`;
}

export function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function getAlertIcon(type: AlertType): string {
  const icons: Record<AlertType, string> = {
    COLLISION_RISK: '⚠️',
    LANE_DEPARTURE: '🛣️',
    DROWSINESS_DETECTED: '☕',
    OVERSPEED: '⏱️',
  };
  return icons[type] || 'ℹ️';
}

export function getAlertBgColor(type: AlertType): string {
  const colors: Record<AlertType, string> = {
    COLLISION_RISK: 'bg-red-50 border-red-100',
    LANE_DEPARTURE: 'bg-orange-50 border-orange-100',
    DROWSINESS_DETECTED: 'bg-blue-50 border-blue-100',
    OVERSPEED: 'bg-amber-50 border-amber-100',
  };
  return colors[type] || 'bg-slate-50 border-slate-100';
}

export function getSeverityColor(severity: AlertSeverity): string {
  const colors: Record<AlertSeverity, string> = {
    low: 'bg-emerald-100 text-emerald-700 font-semibold',
    medium: 'bg-amber-100 text-amber-700 font-semibold',
    high: 'bg-orange-100 text-orange-700 font-semibold',
    critical: 'bg-red-100 text-red-700 font-bold',
  };
  return colors[severity] || 'bg-slate-100 text-slate-600';
}

export function getStatusDotColor(status: SensorStatus | HealthStatus): string {
  const colors: Record<string, string> = {
    online: 'bg-emerald-500',
    degraded: 'bg-amber-400',
    offline: 'bg-red-500',
  };
  return colors[status] || 'bg-slate-300';
}

export function getStatusTextColor(status: SensorStatus | HealthStatus): string {
  const colors: Record<string, string> = {
    online: 'text-emerald-600',
    degraded: 'text-amber-600',
    offline: 'text-red-600',
  };
  return colors[status] || 'text-slate-400';
}

export function getSpeedColor(speed: number): string {
  if (speed < 60) return '#3B82F6';   // accent-blue
  if (speed < 100) return '#F59E0B';  // accent-amber
  return '#EF4444';                   // sos-red
}

export function getRiskColor(score: number): string {
  if (score < 30) return '#10B981';   // emerald
  if (score < 60) return '#F59E0B';   // amber
  if (score < 80) return '#F97316';   // orange
  return '#EF4444';                   // red
}
