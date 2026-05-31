'use client';

import { Cpu, Activity, Database, Network } from 'lucide-react';
import type { SystemHealth, AIStatus } from '@/types';

interface Props {
  health: SystemHealth | null;
  aiStatus: AIStatus | null;
}

export default function ProcessingHealthSection({ health, aiStatus }: Props) {
  return (
    <div className="soft-card p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-outfit font-semibold text-text-primary">System Health</h3>
        <span className="badge-green">Operational</span>
      </div>

      <div className="grid grid-cols-2 gap-3 flex-1">
        <div className="bg-app-bg rounded-xl p-3 border border-transparent hover:border-card-border transition-colors">
          <div className="flex items-center gap-2 mb-2 text-text-secondary">
            <Cpu size={16} />
            <span className="text-xs font-medium">Inference Latency</span>
          </div>
          <div className="text-lg font-bold font-outfit text-text-primary">
            {aiStatus?.processing_time?.toFixed(2) || '0.00'} <span className="text-xs font-medium text-text-muted">ms</span>
          </div>
        </div>

        <div className="bg-app-bg rounded-xl p-3 border border-transparent hover:border-card-border transition-colors">
          <div className="flex items-center gap-2 mb-2 text-text-secondary">
            <Activity size={16} />
            <span className="text-xs font-medium">FPS Processed</span>
          </div>
          <div className="text-lg font-bold font-outfit text-text-primary">
            {aiStatus?.processed_frames || 0}
          </div>
        </div>

        <div className="bg-app-bg rounded-xl p-3 border border-transparent hover:border-card-border transition-colors">
          <div className="flex items-center gap-2 mb-2 text-text-secondary">
            <Network size={16} />
            <span className="text-xs font-medium">Network Latency</span>
          </div>
          <div className="text-lg font-bold font-outfit text-text-primary">
            {health?.latency_ms || 0} <span className="text-xs font-medium text-text-muted">ms</span>
          </div>
        </div>

        <div className="bg-app-bg rounded-xl p-3 border border-transparent hover:border-card-border transition-colors">
          <div className="flex items-center gap-2 mb-2 text-text-secondary">
            <Database size={16} />
            <span className="text-xs font-medium">Core Temp</span>
          </div>
          <div className="text-lg font-bold font-outfit text-text-primary">
            {health?.cpu_temp || 0} <span className="text-xs font-medium text-text-muted">°C</span>
          </div>
        </div>
      </div>
    </div>
  );
}
