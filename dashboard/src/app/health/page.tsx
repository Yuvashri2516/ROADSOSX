'use client';

import { useGlobalSocket } from '@/contexts/SocketContext';
import ProcessingHealthSection from '@/components/ProcessingHealthSection';
import { motion } from 'framer-motion';

export default function HealthPage() {
  const { systemHealth, aiStatus } = useGlobalSocket();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-7xl mx-auto h-full flex flex-col"
    >
      <div>
        <h1 className="text-3xl font-outfit font-bold mb-2">System Health</h1>
        <p className="text-text-secondary">Detailed server metrics, latency, and uptime reports.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-full min-h-[300px]">
          <ProcessingHealthSection health={systemHealth} aiStatus={aiStatus} />
        </div>
        
        <div className="soft-card p-6 flex items-center justify-center text-text-secondary h-full min-h-[300px]">
          <div className="text-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4 opacity-50"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line></svg>
            <p>Historical Server Logs</p>
            <p className="text-xs mt-2">Available in production environment.</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
