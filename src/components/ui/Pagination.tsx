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
    <div className="p-6 bg-slate-50/50 border-t border-slate-50 flex justify-between items-center">
      <div className="flex items-center gap-6">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Showing <span className="text-slate-900">{start} to {end}</span> of {totalElements} {label}
        </p>
        
        {onPageSizeChange && (
          <div className="flex items-center gap-2 border-l border-slate-200 pl-6">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Show</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="bg-transparent text-[10px] font-black text-slate-900 uppercase focus:outline-none cursor-pointer"
            >
              {[10, 20, 50, 100].map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          icon="chevron_left"
          onClick={() => onPageChange(Math.max(0, page - 1))}
          disabled={page === 0}
        />
        <Button
          variant="secondary"
          size="sm"
          className="bg-white text-orange-700 border-orange-200"
        >
          {page + 1}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          icon="chevron_right"
          onClick={() => onPageChange(page + 1)}
          disabled={(page + 1) * pageSize >= totalElements}
        />
      </div>
    </div>
  );
};
