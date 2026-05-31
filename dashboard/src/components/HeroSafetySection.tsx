'use client';

import { motion } from 'framer-motion';
import { ShieldCheck, ShieldAlert, Activity } from 'lucide-react';
import type { AIStatus, VehicleTelemetry } from '@/types';

interface Props {
  aiStatus: AIStatus | null;
  telemetry: VehicleTelemetry | null;
}

export default function HeroSafetySection({ aiStatus, telemetry }: Props) {
  const isHighRisk = aiStatus?.collision_risk === 'HIGH';
  
  return (
    <div className="relative overflow-hidden glass-panel p-8 mb-6">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary-teal/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
      <div className={`absolute bottom-0 left-0 w-64 h-64 ${isHighRisk ? 'bg-sos-red/5' : 'bg-primary-blue/5'} rounded-full blur-3xl translate-y-1/2 -translate-x-1/3`}></div>
      
      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="badge-blue flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-blue animate-pulse"></span>
              AI Monitoring Active
            </span>
            <span className="text-sm font-medium text-text-muted">ID: {telemetry?.vehicle_id || '---'}</span>
          </div>
          
          <h2 className="text-4xl font-outfit font-bold text-text-primary mb-1">
            {isHighRisk ? 'Caution Required' : 'Ride is Secure'}
          </h2>
          <p className="text-text-secondary">
            {isHighRisk 
              ? 'AI has detected elevated risk factors. Please stay alert.' 
              : 'All systems are operating normally. Safe travels.'}
          </p>
        </div>
        
        <div className="flex gap-4">
          <div className="soft-card p-4 flex flex-col items-center justify-center min-w-[120px]">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${isHighRisk ? 'bg-red-50 text-sos-red' : 'bg-emerald-50 text-primary-teal'}`}>
              {isHighRisk ? <ShieldAlert size={24} /> : <ShieldCheck size={24} />}
            </div>
            <div className="text-2xl font-bold font-outfit tabular-nums">{aiStatus?.collision_risk || 'LOW'}</div>
            <div className="text-xs font-medium text-text-muted uppercase tracking-wider">Risk Level</div>
          </div>
          
          <div className="soft-card p-4 flex flex-col items-center justify-center min-w-[120px]">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-primary-blue flex items-center justify-center mb-2">
              <Activity size={24} />
            </div>
            <div className="text-2xl font-bold font-outfit tabular-nums">{aiStatus?.processed_frames || 0}</div>
            <div className="text-xs font-medium text-text-muted uppercase tracking-wider">FPS Processing</div>
          </div>
        </div>
      </div>
    </div>
  );
}
