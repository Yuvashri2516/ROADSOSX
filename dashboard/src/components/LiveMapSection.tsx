'use client';

import { MapPin, Navigation, Ambulance } from 'lucide-react';
import type { VehicleTelemetry, SOSEvent } from '@/types';

interface Props {
  telemetry: VehicleTelemetry | null;
  sosEvent: SOSEvent | null;
}

export default function LiveMapSection({ telemetry, sosEvent }: Props) {
  // Mock map visualization using CSS
  const isEmergency = sosEvent?.active;

  return (
    <div className="soft-card h-full flex flex-col overflow-hidden relative min-h-[300px]">
      <div className="absolute top-4 left-4 z-10">
        <div className="bg-white/90 backdrop-blur-md shadow-sm border border-card-border rounded-xl px-4 py-2 flex items-center gap-2">
          <Navigation size={16} className="text-primary-blue" />
          <span className="text-sm font-semibold text-text-primary">Live Tracking Route</span>
        </div>
      </div>
      
      {isEmergency && (
        <div className="absolute top-4 right-4 z-10">
          <div className="bg-sos-red/90 backdrop-blur-md shadow-sm border border-red-500 rounded-xl px-4 py-2 flex items-center gap-2 text-white">
            <Ambulance size={16} className="animate-pulse" />
            <span className="text-sm font-semibold">Emergency Route Active (ETA: 5 min)</span>
          </div>
        </div>
      )}

      <div className="flex-1 w-full h-full relative bg-[#E8F0FE]">
        {/* Simulated map background lines */}
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(to right, #D6E4FB 1px, transparent 1px),
            linear-gradient(to bottom, #D6E4FB 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}></div>

        {/* Highlighted Route Path (Simulated) */}
        <div className="absolute top-1/2 left-1/4 w-1/2 h-1 bg-primary-blue/30 rounded-full rotate-12 origin-left"></div>
        <div className="absolute top-1/2 left-1/4 w-1/4 h-1 bg-primary-blue rounded-full rotate-12 origin-left"></div>

        {/* Vehicle Marker */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-primary-blue/20 flex items-center justify-center animate-ping absolute"></div>
          <div className="w-8 h-8 rounded-full bg-white shadow-lg border-2 border-primary-blue flex items-center justify-center relative z-10">
            <div className="w-3 h-3 bg-primary-blue rounded-full"></div>
          </div>
        </div>

        {/* SOS Location Marker */}
        {isEmergency && (
          <div className="absolute top-1/3 left-2/3 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-sos-red/20 flex items-center justify-center animate-ping absolute"></div>
            <div className="w-6 h-6 rounded-full bg-white shadow-lg border-2 border-sos-red flex items-center justify-center relative z-10">
              <MapPin size={12} className="text-sos-red" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
