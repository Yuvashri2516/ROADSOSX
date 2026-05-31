'use client';

import React from 'react';
import { SocketProvider } from '@/contexts/SocketContext';
import { AuthProvider } from '@/contexts/AuthContext';
import AppLayout from '@/components/AppLayout';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SocketProvider>
        <AppLayout>
          {children}
        </AppLayout>
      </SocketProvider>
    </AuthProvider>
  );
}
