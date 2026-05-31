'use client';

import { motion } from 'framer-motion';

export default function AnalyticsPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-7xl mx-auto h-full flex flex-col"
    >
      <div>
        <h1 className="text-3xl font-outfit font-bold mb-2">Fleet Analytics</h1>
        <p className="text-text-secondary">Comprehensive reports and AI incident trends.</p>
      </div>

      <div className="flex-1 soft-card flex items-center justify-center p-12 min-h-[500px]">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-20 h-20 bg-primary-blue/10 rounded-full flex items-center justify-center mx-auto text-primary-blue">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>
          </div>
          <h2 className="text-2xl font-bold font-outfit">Coming Soon</h2>
          <p className="text-text-secondary">
            The Fleet Analytics module is scheduled for Phase 7. This will aggregate long-term risk scores and driver behavior across multiple vehicles.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
