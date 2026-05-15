'use client';

import React from 'react';
import { cn } from '@/lib/cn';

interface Tab {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
  contentClassName?: string;
  children?: React.ReactNode;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className,
  contentClassName,
  children
}) => {
  return (
    <div className={cn('bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm', className)}>
      <div className="flex border-b border-gray-100 bg-gray-50/30 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              'px-4 md:px-8 py-3 md:py-4 font-bold text-xs md:text-sm capitalize border-b-2 transition-colors whitespace-nowrap',
              activeTab === tab.id
                ? 'border-orange-600 text-orange-600 bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className={cn('p-4 md:p-8', contentClassName)}>
        {children}
      </div>
    </div>
  );
};
