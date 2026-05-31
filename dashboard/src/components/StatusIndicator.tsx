'use client';

import { cn, getStatusDotColor } from '@/utils/helpers';
import type { SensorStatus, HealthStatus } from '@/types';

interface StatusIndicatorProps {
  status: SensorStatus | HealthStatus;
  label: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function StatusIndicator({ status, label, size = 'md' }: StatusIndicatorProps) {
  const dotSizes = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div
          className={cn(
            'rounded-full',
            dotSizes[size],
            getStatusDotColor(status)
          )}
        />
        {status === 'online' && (
          <div
            className={cn(
              'absolute inset-0 rounded-full animate-ping opacity-40',
              getStatusDotColor(status)
            )}
          />
        )}
      </div>
      <span className={cn('text-gray-300 font-medium', textSizes[size])}>
        {label}
      </span>
      <span
        className={cn(
          'font-mono uppercase tracking-wider',
          textSizes[size],
          status === 'online' && 'text-neon-emerald',
          status === 'degraded' && 'text-neon-amber',
          status === 'offline' && 'text-neon-rose'
        )}
      >
        {status}
      </span>
    </div>
  );
}
