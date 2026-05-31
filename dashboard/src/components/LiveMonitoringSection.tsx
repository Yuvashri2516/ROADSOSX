'use client';

import { motion } from 'framer-motion';
import { Gauge, MapPin, Camera, Radio } from 'lucide-react';
import type { VehicleTelemetry } from '@/types';

interface Props {
  telemetry: VehicleTelemetry | null;
}

export default function LiveMonitoringSection({ telemetry }: Props) {
  const speed = Math.round(telemetry?.speed || 0);
  
  return (
    <div className="soft-card p-6 h-full flex flex-col">
      <h3 className="text-lg font-outfit font-semibold text-text-primary mb-4">Live Vehicle Monitoring</h3>
      
      <div className="grid grid-cols-2 gap-4 flex-1">
        <div className="bg-app-bg rounded-xl p-4 flex flex-col justify-between group hover:bg-white transition-colors border border-transparent hover:border-card-border">
          <div className="flex justify-between items-start mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-primary-blue flex items-center justify-center">
              <Gauge size={18} />
            </div>
            <span className="text-xs font-medium text-text-muted">Real-time</span>
          </div>
          <div>
            <div className="text-3xl font-bold font-outfit text-text-primary tabular-nums">
              {speed} <span className="text-sm font-medium text-text-muted">km/h</span>
            </div>
            <div className="text-xs font-medium text-text-secondary mt-1">Vehicle Speed</div>
          </div>
        </div>

        <div className="bg-app-bg rounded-xl p-4 flex flex-col justify-between group hover:bg-white transition-colors border border-transparent hover:border-card-border">
          <div className="flex justify-between items-start mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-primary-teal flex items-center justify-center">
              <MapPin size={18} />
            </div>
            <span className="w-2 h-2 rounded-full bg-primary-teal animate-pulse"></span>
          </div>
          <div>
            <div className="text-sm font-semibold text-text-primary tabular-nums truncate">
              {telemetry?.gps.lat.toFixed(4) || '0.0000'}, {telemetry?.gps.lng.toFixed(4) || '0.0000'}
            </div>
            <div className="text-xs font-medium text-text-secondary mt-1">GPS Connectivity</div>
          </div>
        </div>

        <div className="bg-app-bg rounded-xl p-4 flex flex-col justify-between group hover:bg-white transition-colors border border-transparent hover:border-card-border">
          <div className="flex justify-between items-start mb-2">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-500 flex items-center justify-center">
              <Camera size={18} />
            </div>
            <span className="badge-green">Online</span>
          </div>
          <div>
            <div className="text-sm font-semibold text-text-primary truncate">
              Active tracking
            </div>
            <div className="text-xs font-medium text-text-secondary mt-1">Camera Status</div>
          </div>
        </div>

        <div className="bg-app-bg rounded-xl p-4 flex flex-col justify-between group hover:bg-white transition-colors border border-transparent hover:border-card-border">
          <div className="flex justify-between items-start mb-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-warn-amber flex items-center justify-center">
              <Radio size={18} />
            </div>
            <span className="badge-blue">Syncing</span>
          </div>
          <div>
            <div className="text-sm font-semibold text-text-primary truncate">
              Radar & Lidar
            </div>
            <div className="text-xs font-medium text-text-secondary mt-1">Sensor Status</div>
          </div>
        </div>
      </div>
    </div>
  );
}
