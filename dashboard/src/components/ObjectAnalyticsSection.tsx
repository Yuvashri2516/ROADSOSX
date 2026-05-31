'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { AIStatus } from '@/types';

interface Props {
  aiStatus: AIStatus | null;
}

const COLORS = ['#4A90E2', '#20C997', '#F6AD55', '#8B5CF6'];

export default function ObjectAnalyticsSection({ aiStatus }: Props) {
  const objects = aiStatus?.detected_objects || { car: 0, truck: 0, bus: 0, person: 0 };
  
  const data = [
    { name: 'Cars', value: objects.car },
    { name: 'Trucks', value: objects.truck },
    { name: 'Buses', value: objects.bus },
    { name: 'People', value: objects.person },
  ].filter(item => item.value > 0);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="soft-card p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-outfit font-semibold text-text-primary">Object Detections</h3>
        <span className="text-sm font-medium text-text-muted">Total: {total}</span>
      </div>

      <div className="flex-1 flex items-center justify-center relative min-h-[200px]">
        {total > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '12px', 
                  border: 'none',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  fontSize: '12px',
                  fontWeight: 500
                }}
                itemStyle={{ color: '#2D3748' }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-sm text-text-muted">No objects detected</div>
        )}
        
        {/* Center Text */}
        {total > 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-bold font-outfit text-text-primary">{total}</span>
            <span className="text-[10px] uppercase tracking-wider text-text-muted">Objects</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 mt-4">
        {data.map((item, index) => (
          <div key={item.name} className="flex items-center gap-2">
            <span 
              className="w-3 h-3 rounded-full flex-shrink-0" 
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <span className="text-xs font-medium text-text-secondary">{item.name}</span>
            <span className="text-xs font-bold text-text-primary ml-auto">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
