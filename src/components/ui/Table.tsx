import React from 'react';

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
  rowClassName = ""
}: TableProps<T>) => {
  return (
    <div className="overflow-x-auto w-full">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-white text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
            {columns.map((column, index) => (
              <th
                key={index}
                className={`px-6 py-4 font-black ${column.headerClassName || ''}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {isLoading ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-20 text-center text-slate-400 italic font-medium">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-700 rounded-full animate-spin"></div>
                  <span className="sr-only">Loading...</span>
                  {loadingMessage}
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-20 text-center text-slate-400 italic font-medium">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => {
              const customRowClass = typeof rowClassName === 'function' ? rowClassName(row) : rowClassName;
              
              return (
                <tr
                  key={rowIndex}
                  onClick={() => onRowClick?.(row)}
                  onDoubleClick={() => onRowDoubleClick?.(row)}
                  className={`
                    hover:bg-slate-50/80 transition-colors group 
                    ${onRowClick || onRowDoubleClick ? 'cursor-pointer' : ''} 
                    ${customRowClass}
                  `}
                >
                  {columns.map((column, colIndex) => (
                    <td 
                      key={colIndex} 
                      className={`px-6 py-5 text-sm text-slate-600 font-medium ${column.className || ''}`}
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
  );
};
