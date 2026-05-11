'use client';

import React from 'react';
import { Button } from './Button';

interface PaginationProps {
  page: number;
  totalElements: number;
  pageSize?: number;
  onPageChange: (newPage: number) => void;
  label?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  page,
  totalElements,
  pageSize = 20,
  onPageChange,
  label = "records"
}) => {
  const start = page * pageSize + 1;
  const end = Math.min((page + 1) * pageSize, totalElements);

  return (
    <div className="p-6 bg-slate-50/50 border-t border-slate-50 flex justify-between items-center">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
        Showing <span className="text-slate-900">{start}-{end}</span> of {totalElements} {label}
      </p>
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
