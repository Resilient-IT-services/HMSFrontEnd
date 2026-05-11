'use client';

import React from 'react';

interface PageHeadingProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export const PageHeading: React.FC<PageHeadingProps> = ({ title, description, children }) => {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
      <div>
        <h2 className="font-manrope text-3xl font-black text-slate-900 tracking-tight uppercase">
          {title}
        </h2>
        {description && (
          <p className="text-slate-500 font-medium mt-1">
            {description}
          </p>
        )}
      </div>
      {children && (
        <div className="flex flex-wrap gap-3">
          {children}
        </div>
      )}
    </div>
  );
};
