'use client';

import React from 'react';
import Link from 'next/link';

interface PageHeadingProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
  level?: 1 | 2 | 3;
  backHref?: string;
}

export const PageHeading: React.FC<PageHeadingProps> = ({
  title,
  description,
  children,
  className = '',
  level = 2,
  backHref
}) => {
  const HeadingTag = `h${level}` as keyof React.JSX.IntrinsicElements;

  return (
    <div className={`flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 ${className}`.trim()}>
      <div>
        {backHref && (
          <Link href={backHref} className="inline-flex items-center text-xs font-bold text-slate-500 hover:text-orange-600 mb-2 transition-colors uppercase tracking-widest">
            <span className="material-symbols-outlined text-[14px] mr-1">arrow_back</span>
            Back
          </Link>
        )}
        <HeadingTag className="font-manrope text-xl md:text-3xl font-black text-slate-900 tracking-tight uppercase leading-tight">
          {title}
        </HeadingTag>
        {description && (
          <p className="text-slate-500 font-medium mt-0.5 text-xs md:text-base line-clamp-2 md:line-clamp-none">
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
