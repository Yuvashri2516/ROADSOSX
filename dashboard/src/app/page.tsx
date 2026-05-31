'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useGlobalSocket } from '@/contexts/SocketContext';

import HeroSafetySection from '@/components/HeroSafetySection';
import LiveMonitoringSection from '@/components/LiveMonitoringSection';
import AIAlertsSection from '@/components/AIAlertsSection';
import ObjectAnalyticsSection from '@/components/ObjectAnalyticsSection';
import ProcessingHealthSection from '@/components/ProcessingHealthSection';
import LiveMapSection from '@/components/LiveMapSection';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.98 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
  },
};

export default function DashboardPage() {
  const { telemetry, aiStatus, sosEvent, systemHealth, triggerSOS, resetSOS } = useGlobalSocket();
  const { scrollY } = useScroll();
  
  const y1 = useTransform(scrollY, [0, 500], [0, -50]);
  const y2 = useTransform(scrollY, [0, 500], [0, -25]);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 max-w-7xl mx-auto"
    >
      <motion.div variants={itemVariants} style={{ y: y2 }}>
        <HeroSafetySection aiStatus={aiStatus} telemetry={telemetry} />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <motion.div variants={itemVariants} className="lg:col-span-8 flex flex-col gap-6" style={{ y: y1 }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-full min-h-[300px]">
              <LiveMonitoringSection telemetry={telemetry} />
            </div>
            <div className="h-full min-h-[300px]">
              <ObjectAnalyticsSection aiStatus={aiStatus} />
            </div>
          </div>

          <div className="h-full min-h-[400px]">
            <LiveMapSection telemetry={telemetry} sosEvent={sosEvent} />
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="lg:col-span-4 flex flex-col gap-6">
          <div className="h-[400px]">
            <AIAlertsSection aiStatus={aiStatus} />
          </div>
          
          <div className="flex-1 min-h-[220px]">
            <ProcessingHealthSection health={systemHealth} aiStatus={aiStatus} />
          </div>
          
          <div className="soft-card p-6 bg-gradient-to-br from-sos-red-light to-white border-red-100 flex flex-col justify-center items-center text-center mt-auto">
            <div className="w-12 h-12 rounded-full bg-red-100 text-sos-red flex items-center justify-center mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
            </div>
            <h4 className="text-lg font-outfit font-bold text-text-primary mb-1">Emergency SOS</h4>
            <p className="text-xs text-text-secondary mb-4">Immediate connection to emergency services</p>
            <button 
              onClick={sosEvent?.active ? resetSOS : triggerSOS}
              className={`w-full py-3 rounded-xl font-bold transition-all ${
                sosEvent?.active 
                  ? 'bg-text-primary text-white hover:bg-black/80 shadow-lg' 
                  : 'bg-sos-red text-white hover:bg-red-600 shadow-sos'
              }`}
            >
              {sosEvent?.active ? 'CANCEL SOS' : 'TRIGGER SOS ALARM'}
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
