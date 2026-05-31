'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { useGlobalSocket } from '@/contexts/SocketContext';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isConnected } = useGlobalSocket();

  return (
    <div className="min-h-screen bg-app-bg text-text-primary flex flex-col relative overflow-hidden">
      {/* Ambient background blob */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-primary-blue/5 rounded-full blur-[100px] pointer-events-none animate-blob"></div>
      <div className="absolute top-1/2 right-1/4 w-[500px] h-[500px] bg-primary-teal/5 rounded-full blur-[100px] pointer-events-none animate-blob" style={{ animationDelay: '2s' }}></div>
      
      <Navbar isConnected={isConnected} />

      <div className="flex flex-1 max-w-[1920px] mx-auto w-full">
        <Sidebar />
        
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto custom-scrollbar relative z-10 perspective-[1000px]">
          {children}
        </main>
      </div>
    </div>
  );
}
