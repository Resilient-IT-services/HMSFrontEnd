'use client';

import React from 'react';
import { Button } from './Button';
import { DEFAULT_PAGE_SIZE } from '@/utils/constants';

interface PaginationProps {
  page: number;
  totalElements: number;
  pageSize?: number;
  onPageChange: (newPage: number) => void;
  onPageSizeChange?: (newSize: number) => void;
  label?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  page,
  totalElements,
  pageSize = DEFAULT_PAGE_SIZE,
  onPageChange,
  onPageSizeChange,
  label = "records"
}) => {
  const start = totalElements === 0 ? 0 : page * pageSize + 1;
  const end = Math.min((page + 1) * pageSize, totalElements);

  return (
    <div className="px-4 py-6 sm:p-6 bg-slate-50/50 border-t border-slate-50 flex flex-col sm:flex-row justify-between items-center gap-6">
      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full sm:w-auto">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center sm:text-left">
          Showing <span className="text-slate-900">{start} to {end}</span> of {totalElements} {label}
        </p>
        
        {onPageSizeChange && (
          <div className="flex items-center justify-center sm:justify-start gap-2 sm:border-l sm:border-slate-200 sm:pl-6 w-full sm:w-auto">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Show</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="bg-transparent text-[10px] font-black text-slate-900 uppercase focus:outline-none cursor-pointer border-b border-slate-200 sm:border-none"
            >
              {[10, 20, 50, 100].map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>
        )}
      </div>
      <div className="flex items-center justify-center gap-2 w-full sm:w-auto">
        <Button
          variant="secondary"
          size="sm"
          icon="chevron_left"
          onClick={() => onPageChange(Math.max(0, page - 1))}
          disabled={page === 0}
          className="h-10 w-10 sm:h-8 sm:w-8 !px-0 flex items-center justify-center rounded-xl"
        />
        <div className="flex items-center justify-center h-10 px-4 sm:h-8 sm:px-3 rounded-xl bg-white text-orange-700 border border-orange-200 text-xs font-black">
          {page + 1}
        </div>
        <Button
          variant="secondary"
          size="sm"
          icon="chevron_right"
          onClick={() => onPageChange(page + 1)}
          disabled={(page + 1) * pageSize >= totalElements}
          className="h-10 w-10 sm:h-8 sm:w-8 !px-0 flex items-center justify-center rounded-xl"
        />
      </div>
    </div>
  );
};
