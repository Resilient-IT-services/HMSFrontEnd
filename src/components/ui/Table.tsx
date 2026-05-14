import React from 'react';
import { cn } from '@/lib/cn';

export interface Column<T> {
  header: string;
  /** Simple key for text-based data */
  key?: keyof T;
  /** Legacy accessor compatibility */
  accessor?: (row: T) => React.ReactNode;
  /** Custom render function for complex HTML/Components */
  render?: (row: T) => React.ReactNode;
  /** Custom width or alignment */
  className?: string;
  headerClassName?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  onRowDoubleClick?: (row: T) => void;
  isLoading?: boolean;
  emptyMessage?: React.ReactNode;
  loadingMessage?: string;
  rowClassName?: string | ((row: T) => string);
  /** Optional custom rendering for mobile view (cards) */
  renderMobileCard?: (row: T) => React.ReactNode;
  /** Whether to hide the table header on mobile */
  hideHeaderOnMobile?: boolean;
}

/**
 * A generic, high-performance DataTable component.
 * Decouples table structure from business logic.
 */
export const Table = <T,>({ 
  columns, 
  data, 
  onRowClick, 
  onRowDoubleClick, 
  isLoading,
  emptyMessage = "No records found",
  loadingMessage = "Retrieving records...",
  rowClassName = "",
  renderMobileCard,
  hideHeaderOnMobile = true
}: TableProps<T>) => {
  const renderLoading = () => (
    <div className="px-6 py-20 text-center text-slate-400 italic font-medium">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-700 rounded-full animate-spin"></div>
        <span className="sr-only">Loading...</span>
        {loadingMessage}
      </div>
    </div>
  );

  const renderEmpty = () => (
    <div className="px-6 py-20 text-center text-slate-400 italic font-medium">
      {emptyMessage}
    </div>
  );

  return (
    <div className="w-full">
      {/* Mobile Card View */}
      {renderMobileCard && (
        <div className="lg:hidden divide-y divide-slate-100">
          {isLoading ? renderLoading() : data.length === 0 ? renderEmpty() : (
            data.map((row, i) => (
              <div key={i} className="hover:bg-slate-50 transition-colors">
                {renderMobileCard(row)}
              </div>
            ))
          )}
        </div>
      )}

      {/* Desktop Table View */}
      <div className={cn(
        "overflow-x-auto w-full",
        renderMobileCard ? "hidden lg:block" : "block"
      )}>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className={cn(
              "bg-white text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100",
              hideHeaderOnMobile ? "hidden lg:table-row" : "table-row"
            )}>
              {columns.map((column, index) => (
                <th
                  key={index}
                  className={cn("px-6 py-4 font-black", column.headerClassName)}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length}>{renderLoading()}</td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>{renderEmpty()}</td>
              </tr>
            ) : (
              data.map((row, rowIndex) => {
                const customRowClass = typeof rowClassName === 'function' ? rowClassName(row) : rowClassName;
                
                return (
                  <tr
                    key={rowIndex}
                    onClick={() => onRowClick?.(row)}
                    onDoubleClick={() => onRowDoubleClick?.(row)}
                    className={cn(
                      "hover:bg-slate-50/80 transition-colors group",
                      (onRowClick || onRowDoubleClick) && "cursor-pointer",
                      customRowClass
                    )}
                  >
                    {columns.map((column, colIndex) => (
                      <td 
                        key={colIndex} 
                        className={cn("px-6 py-5 text-sm text-slate-600 font-medium", column.className)}
                      >
                        {column.render
                          ? column.render(row)
                          : column.accessor
                            ? column.accessor(row)
                            : (row[column.key!] as React.ReactNode)}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
