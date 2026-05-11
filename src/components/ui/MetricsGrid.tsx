import React from 'react';
import { MetricCard, MetricCardProps } from './MetricCard';
import { cn } from '@/lib/cn';

interface MetricsGridProps {
  items: MetricCardProps[];
  className?: string;
}

export const MetricsGrid: React.FC<MetricsGridProps> = ({ items, className }) => {
  return (
    <div className={cn('grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4', className)}>
      {items.map((item) => (
        <MetricCard
          key={`${item.label}-${item.icon}-${item.variant ?? 'slate'}`}
          {...item}
        />
      ))}
    </div>
  );
};
