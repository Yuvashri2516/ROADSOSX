'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Info, AlertTriangle, EyeOff } from 'lucide-react';
import type { AIStatus } from '@/types';

interface Props {
  aiStatus: AIStatus | null;
}

export default function AIAlertsSection({ aiStatus }: Props) {
  if (!aiStatus) return null;

  // Transform raw AI output into friendly alerts
  const alerts = [];

  if (aiStatus.collision_risk === 'HIGH') {
    alerts.push({
      id: 'collision',
      title: 'High Collision Risk Detected',
      description: 'Vehicle approaching dangerously fast.',
      type: 'critical',
      icon: ShieldAlert,
    });
  }

  if (aiStatus.lane_status !== 'LANE STABLE') {
    alerts.push({
      id: 'lane',
      title: 'Lane Tracking Unstable',
      description: 'Vehicle is drifting out of designated lane.',
      type: 'warning',
      icon: AlertTriangle,
    });
  } else {
    alerts.push({
      id: 'lane-stable',
      title: 'Lane Tracking Stable',
      description: 'Vehicle is maintaining correct lane position.',
      type: 'info',
      icon: Info,
    });
  }

  if (aiStatus.driver_status === 'DROWSINESS MODULE DISABLED') {
    alerts.push({
      id: 'driver',
      title: 'Driver Monitoring Offline',
      description: 'Drowsiness detection is currently disabled.',
      type: 'info',
      icon: EyeOff,
    });
  }

  return (
    <div className="soft-card p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-outfit font-semibold text-text-primary">AI Alerts</h3>
        <span className="badge-blue">Live Analysis</span>
      </div>

      <div className="flex-1 overflow-hidden relative">
        <div className="absolute inset-0 overflow-y-auto custom-scrollbar pr-2 space-y-3">
          <AnimatePresence>
            {alerts.map((alert, idx) => {
              const isCritical = alert.type === 'critical';
              const isWarning = alert.type === 'warning';
              
              let bgClass = 'bg-app-bg border-card-border';
              let iconClass = 'text-primary-blue bg-blue-50';
              
              if (isCritical) {
                bgClass = 'bg-sos-red-light border-red-100';
                iconClass = 'text-sos-red bg-red-100';
              } else if (isWarning) {
                bgClass = 'bg-warn-amber-light border-amber-100';
                iconClass = 'text-warn-amber bg-amber-100';
              }

              return (
                <motion.div
                  key={alert.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`p-4 rounded-xl border ${bgClass} transition-colors`}
                >
                  <div className="flex gap-4">
                    <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${iconClass}`}>
                      <alert.icon size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-text-primary">{alert.title}</h4>
                      <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                        {alert.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
