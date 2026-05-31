'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, CarFront, AlertTriangle, PhoneCall, PieChart, Server, Settings } from 'lucide-react';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/' },
  { id: 'live', label: 'Live Monitoring', icon: CarFront, href: '/live' },
  { id: 'alerts', label: 'AI Alerts', icon: AlertTriangle, href: '/alerts' },
  { id: 'sos', label: 'Emergency SOS', icon: PhoneCall, href: '/sos' },
  { id: 'analytics', label: 'Analytics', icon: PieChart, href: '/analytics' },
  { id: 'health', label: 'System Health', icon: Server, href: '/health' },
  { id: 'settings', label: 'Settings', icon: Settings, href: '/settings' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-[calc(100vh-73px)] sticky top-[73px] bg-white/40 backdrop-blur-lg border-r border-white/50 hidden lg:flex flex-col py-6 px-4">
      <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4 px-3">
        Menu
      </div>
      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                isActive 
                  ? 'bg-white shadow-sm text-primary-blue font-medium' 
                  : 'text-text-secondary hover:bg-white/50 hover:text-text-primary'
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? 'text-primary-blue' : 'text-text-muted'}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      
      <div className="mt-auto pt-6">
        <div className="soft-card p-4 bg-gradient-to-br from-primary-mint to-white">
          <div className="text-xs font-semibold text-primary-teal mb-1">AI Module</div>
          <div className="text-sm font-medium text-text-primary">Fully Operational</div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-3">
            <div className="bg-primary-teal h-1.5 rounded-full" style={{ width: '100%' }}></div>
          </div>
        </div>
      </div>
    </aside>
  );
}
