import React from 'react';
import { MetricCard, MetricCardProps } from './MetricCard';
import { cn } from '@/lib/cn';

interface MetricsGridProps {
  items: MetricCardProps[];
  className?: string;
  usePillsOnMobile?: boolean;
}

export const MetricsGrid: React.FC<MetricsGridProps> = ({ 
  items, 
  className,
  usePillsOnMobile = true 
}) => {
  return (
    <div className={cn(
      'flex flex-wrap items-center gap-2',
      className
    )}>
      {items.map((item) => (
        <div key={`${item.label}-${item.icon}-${item.variant ?? 'slate'}`} className="shrink-0">
          <div className={cn(usePillsOnMobile ? 'sm:hidden' : 'hidden')}>
            <MetricCard {...item} layout="pill" />
          </div>
          <div className={cn(usePillsOnMobile ? 'hidden sm:block' : 'block')}>
            <MetricCard {...item} />
          </div>
        </div>
      ))}
    </div>
  );
};
