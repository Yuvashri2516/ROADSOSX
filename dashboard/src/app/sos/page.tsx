'use client';

import { useGlobalSocket } from '@/contexts/SocketContext';
import LiveMapSection from '@/components/LiveMapSection';
import { motion } from 'framer-motion';

export default function SOSPage() {
  const { sosEvent, telemetry, triggerSOS, resetSOS } = useGlobalSocket();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-7xl mx-auto h-full flex flex-col"
    >
      <div>
        <h1 className="text-3xl font-outfit font-bold text-sos-red mb-2">Emergency Dispatch Control</h1>
        <p className="text-text-secondary">Dedicated command center for incident response and routing.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-[600px]">
        <div className="lg:col-span-2 h-full min-h-[500px]">
          <LiveMapSection telemetry={telemetry} sosEvent={sosEvent} />
        </div>
        
        <div className="flex flex-col gap-6">
          <div className="soft-card p-6 bg-gradient-to-br from-sos-red-light to-white border-red-100 flex flex-col flex-1">
            <h3 className="text-xl font-bold mb-4">Manual Override</h3>
            
            <div className="space-y-4 mb-auto">
              <div className="p-4 bg-white/60 rounded-xl border border-white">
                <p className="text-sm text-text-secondary">Status</p>
                <p className={`font-bold ${sosEvent?.active ? 'text-sos-red' : 'text-primary-teal'}`}>
                  {sosEvent?.active ? 'EMERGENCY ACTIVE' : 'SYSTEM NORMAL'}
                </p>
              </div>
              
              {sosEvent?.active && (
                <div className="p-4 bg-red-50 rounded-xl border border-red-100 animate-pulse-slow">
                  <p className="text-sm text-red-800">Dispatch ETA</p>
                  <p className="text-2xl font-bold text-sos-red">
                    {sosEvent.ambulance_eta ? `${sosEvent.ambulance_eta} min` : 'Calculating...'}
                  </p>
                </div>
              )}
            </div>

            <button 
              onClick={sosEvent?.active ? resetSOS : triggerSOS}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all mt-6 ${
                sosEvent?.active 
                  ? 'bg-text-primary text-white hover:bg-black/80 shadow-lg' 
                  : 'bg-sos-red text-white hover:bg-red-600 shadow-sos'
              }`}
            >
              {sosEvent?.active ? 'CANCEL EMERGENCY' : 'TRIGGER MANUAL SOS'}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
