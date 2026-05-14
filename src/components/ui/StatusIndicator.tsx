'use client';

import React from 'react';
import { cn } from '@/lib/cn';

export type StatusVariant = 'emerald' | 'red' | 'orange' | 'blue' | 'slate';

interface StatusIndicatorProps {
  status: string;
  variant?: StatusVariant;
  pulse?: boolean;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
  title?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  variant = 'slate',
  pulse,
  className,
  onClick,
  title
}) => {
  const variants = {
    emerald: {
      dot: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]',
      text: 'text-emerald-700',
      pulse: 'bg-emerald-500'
    },
    red: {
      dot: 'bg-red-500',
      text: 'text-red-600',
      pulse: 'bg-red-500'
    },
    orange: {
      dot: 'bg-orange-500',
      text: 'text-orange-700',
      pulse: 'bg-orange-500'
    },
    blue: {
      dot: 'bg-blue-500',
      text: 'text-blue-700',
      pulse: 'bg-blue-500'
    },
    slate: {
      dot: 'bg-slate-400',
      text: 'text-slate-500',
      pulse: 'bg-slate-400'
    }
  };

  const v = variants[variant] || variants.slate;

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-1 py-0.5 rounded-lg transition-colors',
        onClick ? 'cursor-pointer hover:bg-slate-50' : '',
        className
      )}
      onClick={onClick}
      title={title}
    >
      <div className="relative flex h-2 w-2">
        {pulse && (
          <span className={cn('animate-ping absolute inline-flex h-full w-full rounded-full opacity-75', v.pulse)}></span>
        )}
        <div className={cn('relative inline-flex rounded-full h-2 w-2', v.dot)} />
      </div>
      <span className={cn('text-[10px] font-black uppercase tracking-widest', v.text)}>
        {status}
      </span>
    </div>
  );
};
