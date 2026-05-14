'use client';

import React from 'react';
import { cn } from '@/lib/cn';

interface SectionProps {
  title: string;
  icon?: string;
  iconVariant?: 'orange' | 'blue' | 'emerald' | 'purple' | 'slate';
  description?: string;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  grid?: boolean;
  cols?: number;
  error?: boolean;
}

export const Section: React.FC<SectionProps> = ({
  title,
  icon,
  iconVariant = 'orange',
  description,
  children,
  className,
  headerClassName,
  grid = true,
  cols = 2,
  error
}) => {
  const iconVariants = {
    orange: 'bg-orange-50 text-orange-600',
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    purple: 'bg-purple-50 text-purple-600',
    slate: 'bg-slate-50 text-slate-600'
  };

  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
  };

  return (
    <div className={cn(
      "bg-white border border-gray-200 rounded-xl p-8 space-y-6 shadow-sm transition-all",
      error ? "ring-2 ring-red-500/20 border-red-200" : "",
      className
    )}>
      <div className={cn("flex items-center gap-3 border-b border-gray-100 pb-4", headerClassName)}>
        {icon && (
          <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0", iconVariants[iconVariant])}>
            <span className="material-symbols-outlined">{icon}</span>
          </div>
        )}
        <div>
          <h3 className="font-headline-sm text-on-surface uppercase tracking-widest text-xs font-black">{title}</h3>
          {description && <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter mt-0.5">{description}</p>}
        </div>
      </div>
      <div className={cn(
        grid ? "grid gap-x-8 gap-y-6" : "block",
        // @ts-expect-error
        grid && (gridCols[cols] || gridCols[2])
      )}>
        {children}
      </div>
    </div>
  );
};
