'use client';

import React from 'react';
import { cn } from '@/lib/cn';

interface AvatarProps {
  name?: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'orange' | 'blue' | 'emerald' | 'slate' | 'purple';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  name = '?',
  src,
  size = 'md',
  variant = 'orange',
  className = ''
}) => {
  const getInitials = (n: string) => {
    return n
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const sizes = {
    sm: 'h-8 w-8 text-[10px] rounded-lg',
    md: 'h-10 w-10 text-xs rounded-xl',
    lg: 'h-16 w-16 text-xl rounded-2xl border-2',
    xl: 'h-20 w-20 text-2xl rounded-2xl border-4'
  };

  const variants = {
    orange: 'bg-orange-100 text-orange-700 border-orange-50',
    blue: 'bg-blue-100 text-blue-700 border-blue-50',
    emerald: 'bg-emerald-100 text-emerald-700 border-emerald-50',
    slate: 'bg-slate-100 text-slate-700 border-slate-50',
    purple: 'bg-purple-100 text-purple-700 border-purple-50'
  };

  const combinedClasses = cn(
    'flex items-center justify-center font-bold uppercase shrink-0 overflow-hidden',
    variants[variant],
    sizes[size],
    className
  );

  if (src) {
    return (
      <div className={combinedClasses}>
        <img src={src} alt={name} className="h-full w-full object-cover" />
      </div>
    );
  }

  return (
    <div className={combinedClasses}>
      {getInitials(name)}
    </div>
  );
};
