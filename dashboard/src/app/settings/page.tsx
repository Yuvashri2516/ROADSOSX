'use client';

import { motion } from 'framer-motion';

export default function SettingsPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-7xl mx-auto h-full flex flex-col"
    >
      <div>
        <h1 className="text-3xl font-outfit font-bold mb-2">Settings</h1>
        <p className="text-text-secondary">System preferences and hardware configuration.</p>
      </div>

      <div className="flex-1 soft-card flex items-center justify-center p-12 min-h-[500px]">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-20 h-20 bg-text-secondary/10 rounded-full flex items-center justify-center mx-auto text-text-secondary">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
          </div>
          <h2 className="text-2xl font-bold font-outfit">Configuration Locked</h2>
          <p className="text-text-secondary">
            Settings are currently managed remotely by the Fleet Administrator. Hardware telemetry addresses and AI confidence thresholds cannot be modified locally.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
