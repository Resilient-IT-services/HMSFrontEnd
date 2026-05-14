'use client';

import React from 'react';
import { cn } from '@/lib/cn';

interface InfoRowProps {
  label: string;
  value: React.ReactNode;
  icon?: string;
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
}

export const InfoRow: React.FC<InfoRowProps> = ({
  label,
  value,
  icon,
  className,
  labelClassName,
  valueClassName
}) => {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div className="flex items-center gap-1.5">
        {icon && <span className="material-symbols-outlined text-[14px] text-slate-400">{icon}</span>}
        <span className={cn('text-[10px] font-black uppercase tracking-widest text-slate-400', labelClassName)}>
          {label}
        </span>
      </div>
      <div className={cn('text-sm font-bold text-slate-700', valueClassName)}>
        {value || '—'}
      </div>
    </div>
  );
};
