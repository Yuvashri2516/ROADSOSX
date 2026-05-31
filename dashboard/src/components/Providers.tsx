'use client';

import React from 'react';
import { SocketProvider } from '@/contexts/SocketContext';
import AppLayout from '@/components/AppLayout';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SocketProvider>
      <AppLayout>
        {children}
      </AppLayout>
    </SocketProvider>
  );
}
