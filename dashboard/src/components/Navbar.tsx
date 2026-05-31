'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Bell, User, ShieldAlert, Activity, LogOut, Settings as SettingsIcon } from 'lucide-react';
import { useGlobalSocket } from '@/contexts/SocketContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const { isConnected, alerts } = useGlobalSocket();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfile(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadAlerts = alerts.slice(0, 5);

  return (
    <nav className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/70 border-b border-white/50 shadow-sm px-6 py-4 flex items-center justify-between">
      {/* Left side: Logo */}
      <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-blue to-primary-teal flex items-center justify-center shadow-accent">
          <Activity className="text-white w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-outfit font-bold text-text-primary tracking-tight">RoadSoS X</h1>
          <p className="text-[10px] uppercase font-semibold tracking-wider text-primary-teal">Intelligent Mobility</p>
        </div>
      </Link>

      {/* Right side: Status, Notifications, Profile */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 hidden md:flex">
          <div className="relative flex h-3 w-3">
            {isConnected && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-teal opacity-75"></span>
            )}
            <span className={`relative inline-flex rounded-full h-3 w-3 ${isConnected ? 'bg-primary-teal' : 'bg-red-400'}`}></span>
          </div>
          <span className="text-sm font-medium text-text-secondary">
            {isConnected ? 'Vehicle Online' : 'Connecting...'}
          </span>
        </div>

        <div className="h-6 w-px bg-card-border mx-2"></div>

        {/* SOS Quick Action */}
        <Link 
          href="/sos"
          className="relative p-2 rounded-full hover:bg-sos-red-light transition-colors text-text-secondary group"
          title="Emergency Dispatch"
        >
          <ShieldAlert className="w-5 h-5 text-sos-red group-hover:scale-110 transition-transform" />
        </Link>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfile(false);
            }}
            className="relative p-2 rounded-full hover:bg-black/5 transition-colors text-text-secondary"
          >
            <Bell className="w-5 h-5" />
            {unreadAlerts.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-warn-amber border-2 border-white"></span>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50"
              >
                <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                  <h3 className="font-bold text-text-primary">Recent Alerts</h3>
                  <Link href="/alerts" className="text-xs text-primary-blue hover:underline" onClick={() => setShowNotifications(false)}>
                    View All
                  </Link>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {unreadAlerts.length === 0 ? (
                    <div className="p-6 text-center text-text-secondary text-sm">
                      No recent alerts.
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {unreadAlerts.map(alert => (
                        <div key={alert.id} className="p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex gap-3">
                            <div className="mt-0.5">
                              {alert.type === 'COLLISION_RISK' ? (
                                <ShieldAlert className={`w-4 h-4 ${alert.severity === 'critical' ? 'text-sos-red' : 'text-warn-amber'}`} />
                              ) : (
                                <Activity className="w-4 h-4 text-primary-teal" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-text-primary">{alert.message}</p>
                              <p className="text-xs text-text-secondary mt-1">
                                {new Date(alert.timestamp).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button 
            onClick={() => {
              setShowProfile(!showProfile);
              setShowNotifications(false);
            }}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center border border-card-border hover:shadow-sm transition-shadow overflow-hidden"
          >
            <User className="w-5 h-5 text-text-muted" />
          </button>

          <AnimatePresence>
            {showProfile && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50"
              >
                <div className="p-4 border-b border-gray-50">
                  <p className="font-bold text-text-primary">Fleet Admin</p>
                  <p className="text-xs text-text-secondary">admin@roadsosx.com</p>
                </div>
                <div className="p-2">
                  <Link 
                    href="/settings" 
                    onClick={() => setShowProfile(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-gray-50 hover:text-text-primary rounded-xl transition-colors"
                  >
                    <SettingsIcon className="w-4 h-4" />
                    System Settings
                  </Link>
                  <button 
                    onClick={() => setShowProfile(false)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-sos-red hover:bg-red-50 rounded-xl transition-colors mt-1"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </nav>
  );
}
