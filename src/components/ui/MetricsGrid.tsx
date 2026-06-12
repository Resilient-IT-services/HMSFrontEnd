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
      <div
          className={cn(
              'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6',
              className
          )}
      >
        {items.map((item) => (
            <div
                key={`${item.label}-${item.icon}-${item.variant ?? 'slate'}`}
                className="w-full h-full"
            >
              <MetricCard {...item} />
            </div>
        ))}
      </div>
  );
};