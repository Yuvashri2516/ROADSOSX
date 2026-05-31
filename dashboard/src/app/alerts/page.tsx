'use client';

import { useGlobalSocket } from '@/contexts/SocketContext';
import AIAlertsSection from '@/components/AIAlertsSection';
import ObjectAnalyticsSection from '@/components/ObjectAnalyticsSection';
import { motion } from 'framer-motion';

export default function AIAlertsPage() {
  const { aiStatus } = useGlobalSocket();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-7xl mx-auto h-full flex flex-col"
    >
      <div>
        <h1 className="text-3xl font-outfit font-bold mb-2">AI Alerts & Analytics</h1>
        <p className="text-text-secondary">Historical object detection and incident logs.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 flex-1 min-h-[600px]">
        <div className="h-full">
          <AIAlertsSection aiStatus={aiStatus} />
        </div>
        <div className="h-full">
          <ObjectAnalyticsSection aiStatus={aiStatus} />
        </div>
      </div>
    </motion.div>
  );
}
