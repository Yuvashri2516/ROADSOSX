'use client';

import { motion } from 'framer-motion';
import { cn } from '@/utils/helpers';
import { ReactNode } from 'react';

interface SoftCardProps {
  children: ReactNode;
  className?: string;
  id?: string;
}

export default function SoftCard({ children, className, id }: SoftCardProps) {
  return (
    <motion.div
      id={id}
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      whileHover={{ y: -2, boxShadow: '0 8px 30px rgba(0,0,0,0.10)' }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'bg-white rounded-2xl border border-card-border shadow-card overflow-hidden',
        className
      )}
    >
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}
