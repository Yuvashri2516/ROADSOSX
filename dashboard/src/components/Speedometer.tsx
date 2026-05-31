'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { getSpeedColor } from '@/utils/helpers';

interface SpeedometerProps {
  speed: number;
  maxSpeed?: number;
}

export default function Speedometer({ speed, maxSpeed = 200 }: SpeedometerProps) {
  const normalizedSpeed = Math.min(speed, maxSpeed);
  const percentage = normalizedSpeed / maxSpeed;

  const arcData = useMemo(() => {
    const startAngle = -220;
    const endAngle = 40;
    const totalArc = endAngle - startAngle; 
    const sweepAngle = startAngle + totalArc * percentage;

    const radius = 85;
    const cx = 100;
    const cy = 100;

    const toRad = (deg: number) => (deg * Math.PI) / 180;

    const bgStartX = cx + radius * Math.cos(toRad(startAngle));
    const bgStartY = cy + radius * Math.sin(toRad(startAngle));
    const bgEndX = cx + radius * Math.cos(toRad(endAngle));
    const bgEndY = cy + radius * Math.sin(toRad(endAngle));

    const activeEndX = cx + radius * Math.cos(toRad(sweepAngle));
    const activeEndY = cy + radius * Math.sin(toRad(sweepAngle));

    const largeArcBg = totalArc > 180 ? 1 : 0;
    const largeArcActive = totalArc * percentage > 180 ? 1 : 0;

    const bgPath = `M ${bgStartX} ${bgStartY} A ${radius} ${radius} 0 ${largeArcBg} 1 ${bgEndX} ${bgEndY}`;
    const activePath = `M ${bgStartX} ${bgStartY} A ${radius} ${radius} 0 ${largeArcActive} 1 ${activeEndX} ${activeEndY}`;

    return { bgPath, activePath };
  }, [percentage]);

  const color = getSpeedColor(speed);

  return (
    <div className="relative flex flex-col items-center">
      <svg viewBox="0 0 200 200" className="w-48 h-48 sm:w-56 sm:h-56">
        {/* Background arc */}
        <path
          d={arcData.bgPath}
          fill="none"
          stroke="#E2E8F0"
          strokeWidth="10"
          strokeLinecap="round"
        />

        {/* Active arc */}
        <motion.path
          d={arcData.activePath}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        />

        {/* Inner subtle ring */}
        <circle cx="100" cy="100" r="65" fill="none" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4 4" />

        {/* Center readout */}
        <text
          x="100"
          y="95"
          textAnchor="middle"
          dominantBaseline="central"
          fill="#0F172A"
          fontSize="48"
          fontFamily="monospace"
          fontWeight="700"
        >
          {Math.round(speed)}
        </text>
        <text
          x="100"
          y="125"
          textAnchor="middle"
          fill="#64748B"
          fontSize="12"
          fontFamily="system-ui, sans-serif"
          fontWeight="600"
          letterSpacing="0.05em"
          className="uppercase"
        >
          km/h
        </text>
      </svg>
    </div>
  );
}
