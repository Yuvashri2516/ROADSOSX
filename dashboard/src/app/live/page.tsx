'use client';

import { useGlobalSocket } from '@/contexts/SocketContext';
import LiveMonitoringSection from '@/components/LiveMonitoringSection';
import LiveMapSection from '@/components/LiveMapSection';
import { motion } from 'framer-motion';

export default function LiveMonitoringPage() {
  const { telemetry, sosEvent } = useGlobalSocket();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-7xl mx-auto h-full flex flex-col"
    >
      <div>
        <h1 className="text-3xl font-outfit font-bold mb-2">Live Monitoring</h1>
        <p className="text-text-secondary">Expanded telemetry and GPS tracking view.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 flex-1 min-h-[600px]">
        <div className="xl:col-span-1 h-full">
          <LiveMonitoringSection telemetry={telemetry} />
        </div>
        <div className="xl:col-span-2 h-full min-h-[500px]">
          <LiveMapSection telemetry={telemetry} sosEvent={sosEvent} />
        </div>
      </div>
    </motion.div>
  );
}
