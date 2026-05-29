import React from 'react';
import { cn } from '@/lib/cn';

export interface Column<T> {
  header: string;
  /** Simple key for text-based data */
  key?: keyof T;
  /** Key to use for sorting/filtering via API */
  sortKey?: string;
  /** Legacy accessor compatibility */
  accessor?: (row: T) => React.ReactNode;
  /** Custom render function for complex HTML/Components */
  render?: (row: T) => React.ReactNode;
  /** Custom width or alignment */
  className?: string;
  headerClassName?: string;
  /** Sorting capability */
  sortable?: boolean;
  /** Filtering capability */
  filterable?: boolean;
  filterPlaceholder?: string;
  filterType?: 'text' | 'select';
  filterOptions?: { label: string, value: string }[];
  /** Custom filter rendering */
  renderFilter?: (onFilter: (key: string, value: string) => void, activeFilters: Record<string, string>) => React.ReactNode;
  /** 
   * How to treat this column on mobile:
   * - 'title': Primary information, usually top-left.
   * - 'subtitle': Secondary information below title.
   * - 'meta': Extra context like tags/badges, usually next to title or in a meta row.
   * - 'action': Buttons/Actions, usually top-right or at the bottom.
   * - 'body': Default detail area.
   * - 'hidden': Do not show on mobile.
   */
  mobilePosition?: 'title' | 'subtitle' | 'meta' | 'action' | 'body' | 'hidden';
  /** Order in which to display on mobile within its position group. Defaults to column index. */
  mobileOrder?: number;
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
  /** Optional custom rendering for mobile view (cards). If not provided, a default card layout is generated. */
  renderMobileCard?: (row: T) => React.ReactNode;
  /** Whether to hide the table header on mobile */
  hideHeaderOnMobile?: boolean;
  /** Sorting handlers */
  onSort?: (sortKey: string, direction: 'asc' | 'desc' | null) => void;
  activeSort?: { key: string; direction: 'asc' | 'desc' } | null;
  /** Filtering handlers */
  onFilter?: (key: string, value: string) => void;
  activeFilters?: Record<string, string>;
}

/**
 * A generic, high-performance DataTable component.
 * Decouples table structure from business logic and supports responsive mobile cards.
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
  hideHeaderOnMobile = true,
  onSort,
  activeSort,
  onFilter,
  activeFilters = {}
}: TableProps<T>) => {

  const handleSort = (column: Column<T>) => {
    if (!column.sortable || !onSort) return;
    const key = column.sortKey || (column.key as string);
    if (!key) return;

    const nextDirection: 'asc' | 'desc' | null = activeSort?.key === key 
      ? (activeSort.direction === 'asc' ? 'desc' : null) 
      : 'asc';
      
    onSort(key, nextDirection);
  };

  const renderCellContent = (row: T, column: Column<T>) => {
    if (column.render) return column.render(row);
    if (column.accessor) return column.accessor(row);
    if (column.key) return (row[column.key] as React.ReactNode);
    return null;
  };

  const renderLoading = () => (
    <div className="px-6 py-20 text-center text-slate-400 italic font-medium">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-orange-600 rounded-full animate-spin"></div>
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

  /**
   * Generates a default mobile card layout based on column configurations.
   */
  const DefaultMobileCard = ({ row }: { row: T }) => {
    const groups: Record<string, { col: Column<T>, index: number }[]> = {};

    for (const [index, col] of columns.entries()) {
      let pos = col.mobilePosition;
      
      // Default heuristics if no position is specified
      if (!pos) {
        if (index === 0) pos = 'title';
        else if (index === columns.length - 1 && (col.header.toLowerCase().includes('action') || !col.key)) pos = 'action';
        else if (col.header.toLowerCase().includes('status') || col.header.toLowerCase().includes('role') || col.header.toLowerCase().includes('type')) pos = 'meta';
        else pos = 'body';
      }

      if (pos === 'hidden') continue;
      
      if (!groups[pos]) groups[pos] = [];
      groups[pos].push({ col, index });
    }

    // Sort columns within each group by mobileOrder or original index
    const sortFn = (a: { col: Column<T>, index: number }, b: { col: Column<T>, index: number }) => 
      (a.col.mobileOrder ?? a.index) - (b.col.mobileOrder ?? b.index);

    const titleGroup = (groups.title || []).toSorted(sortFn);
    const subtitleGroup = (groups.subtitle || []).toSorted(sortFn);
    const metaGroup = (groups.meta || []).toSorted(sortFn);
    const bodyGroup = (groups.body || []).toSorted(sortFn);
    const actionGroup = (groups.action || []).toSorted(sortFn);

    const topActions = actionGroup.filter(({ col }) => col.mobileOrder !== undefined && col.mobileOrder < 0);
    const bottomActions = actionGroup.filter(({ col }) => col.mobileOrder === undefined || col.mobileOrder >= 0);

    return (
      <div className="flex flex-col gap-4">
        {/* Top Section: Title, Subtitle, and Quick Actions */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0 flex flex-col gap-1">
            {titleGroup.map(({ col, index }) => (
              <div key={index} className="text-base font-bold text-slate-900 truncate leading-snug">
                {renderCellContent(row, col)}
              </div>
            ))}
            {subtitleGroup.map(({ col, index }) => (
              <div key={index} className="text-sm font-semibold text-slate-500 truncate leading-snug">
                {renderCellContent(row, col)}
              </div>
            ))}
          </div>
          
          {/* Top-Right Actions/Status */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            {topActions.map(({ col, index }) => (
              <div key={index}>{renderCellContent(row, col)}</div>
            ))}
            {metaGroup.map(({ col, index }) => (
              <div key={index}>{renderCellContent(row, col)}</div>
            ))}
          </div>
        </div>

        {/* Body Section: General detail area */}
        {bodyGroup.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 pt-3 border-t border-slate-50">
            {bodyGroup.map(({ col, index }) => (
              <div key={index} className="text-sm text-slate-600 font-medium break-words">
                {renderCellContent(row, col)}
              </div>
            ))}
          </div>
        )}

        {/* Footer Section: Primary Actions */}
        {bottomActions.length > 0 && (
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-50 mt-auto">
            {bottomActions.map(({ col, index }) => (
              <div key={index}>{renderCellContent(row, col)}</div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const rowData = data.map((row) => {
    const customRowClass = typeof rowClassName === 'function' ? rowClassName(row) : rowClassName;
    const isInteractive = onRowClick || onRowDoubleClick;

    return {
      row,
      className: cn(
        "transition-all duration-200",
        isInteractive && "cursor-pointer",
        customRowClass
      ),
      onClick: () => onRowClick?.(row),
      onDoubleClick: () => onRowDoubleClick?.(row)
    };
  });

  return (
    <div className="w-full">
      {/* Mobile Card View (shown below lg breakpoint) */}
      <div className="lg:hidden">
        {isLoading ? renderLoading() : data.length === 0 ? renderEmpty() : (
          <div className="flex flex-col gap-4 p-1">
            {rowData.map((item, i) => (
              <div 
                key={i} 
                onClick={item.onClick}
                onDoubleClick={item.onDoubleClick}
                className={cn(
                  "bg-white rounded-2xl border border-slate-100 p-5 shadow-sm active:scale-[0.98] hover:border-orange-200/50",
                  item.className
                )}
              >
                {renderMobileCard ? renderMobileCard(item.row) : <DefaultMobileCard row={item.row} />}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Desktop Table View (shown at lg breakpoint and above) */}
      <div className="hidden lg:block w-full">
        <table className="w-full text-left border-collapse">
          <thead className="z-20">
            {/* Primary Header Row (Titles & Sorting) */}
            <tr className={cn(
              "bg-white border-b border-slate-100",
              hideHeaderOnMobile ? "hidden lg:table-row" : "table-row"
            )}>
              {columns.map((column, index) => {
                const sortKey = column.sortKey || (column.key as string);
                const isSorted = activeSort?.key === sortKey;

                return (
                  <th
                    key={index}
                    className={cn(
                      "px-6 py-4 font-black text-slate-700 text-[10px] uppercase tracking-widest relative group/header min-w-[120px]",
                      column.sortable && "cursor-pointer hover:bg-slate-50 transition-colors",
                      column.headerClassName
                    )}
                    onClick={() => handleSort(column)}
                  >
                    <div className="flex items-center gap-2 pr-6">
                      {column.header}
                      {column.sortable && (
                        <span className={cn(
                          "material-symbols-outlined text-[16px] transition-all",
                          isSorted ? "text-orange-600" : "text-slate-300 opacity-0 group-hover/header:opacity-100"
                        )}>
                          {isSorted 
                            ? (activeSort.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') 
                            : 'swap_vert'}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>

            {/* Secondary Header Row (Inline Filters) */}
            {columns.some(c => c.filterable) && (
              <tr className="bg-slate-50/50 border-b border-slate-100">
                {columns.map((column, index) => {
                  const sortKey = column.sortKey || (column.key as string);
                  
                  return (
                    <th key={index} className="px-6 py-2">
                      {column.filterable && onFilter && (
                        <div onClick={(e) => e.stopPropagation()}>
                          {column.renderFilter ? (
                             column.renderFilter(onFilter, activeFilters)
                          ) : column.filterType === 'select' ? (
                            <select
                              value={activeFilters[sortKey] || ''}
                              onChange={(e) => onFilter(sortKey, e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-bold text-slate-600 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/50 outline-none cursor-pointer transition-all"
                            >
                              <option value="">All {column.header}</option>
                              {column.filterOptions?.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="text"
                              placeholder={`Filter...`}
                              value={activeFilters[sortKey] || ''}
                              onChange={(e) => onFilter(sortKey, e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-bold placeholder:text-slate-300 text-slate-600 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/50 outline-none transition-all"
                            />
                          )}
                        </div>
                      )}
                    </th>
                  );
                })}
              </tr>
            )}
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
              rowData.map((item, rowIndex) => (
                <tr
                  key={rowIndex}
                  onClick={item.onClick}
                  onDoubleClick={item.onDoubleClick}
                  className={cn("hover:bg-slate-50/80 group", item.className)}
                >
                  {columns.map((column, colIndex) => (
                    <td 
                      key={colIndex} 
                      className={cn("px-6 py-5 text-sm text-slate-600 font-medium", column.className)}
                    >
                      {renderCellContent(item.row, column)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

