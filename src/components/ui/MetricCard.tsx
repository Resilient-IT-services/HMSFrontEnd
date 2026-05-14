import React from 'react';
import { cn } from '@/lib/cn';

export interface MetricCardProps {
  label: string;
  value: React.ReactNode;
  icon: string;
  variant?: 'slate' | 'emerald' | 'blue' | 'orange' | 'purple' | 'indigo' | 'red';
  trend?: string;
  subValue?: string;
  layout?: 'centered' | 'horizontal' | 'compact' | 'pill';
  progressBar?: number; // percentage 0-100
  tag?: string;
  valueTestId?: string;
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps & { pulse?: boolean }> = ({
  label,
  value,
  icon,
  variant = 'slate',
  trend,
  subValue,
  layout = 'centered',
  progressBar,
  tag,
  valueTestId,
  pulse,
  onClick
}) => {
  const variants = {
    slate: { text: 'text-slate-600', bg: 'bg-slate-100', progress: 'bg-slate-600' },
    emerald: { text: 'text-emerald-600', bg: 'bg-emerald-50', progress: 'bg-emerald-600' },
    blue: { text: 'text-blue-600', bg: 'bg-blue-50', progress: 'bg-blue-600' },
    orange: { text: 'text-orange-600', bg: 'bg-orange-50', progress: 'bg-orange-600' },
    purple: { text: 'text-purple-600', bg: 'bg-purple-50', progress: 'bg-purple-600' },
    indigo: { text: 'text-indigo-600', bg: 'bg-indigo-50', progress: 'bg-indigo-600' },
    red: { text: 'text-red-600', bg: 'bg-red-50', progress: 'bg-red-600' }
  };

  const v = variants[variant] || variants.slate;

  const formatValue = (val: React.ReactNode) => {
    if (typeof val === 'number') {
      return val < 10 && val >= 0 ? `0${val}` : val;
    }
    return val;
  };

  const commonProps = {
    onClick,
    className: cn(
      onClick && "cursor-pointer transition-all active:scale-95"
    )
  };

  if (layout === 'pill') {
    return (
      <div 
        {...commonProps}
        className={cn(
          "flex items-center gap-2.5 px-4 py-2 rounded-full border border-slate-200 bg-white hover:border-slate-300 transition-all shadow-sm shrink-0 group",
          v.bg,
          commonProps.className
        )}
      >
        <span className={cn("material-symbols-outlined text-lg transition-transform group-hover:scale-110", v.text)}>{icon}</span>
        <div className="flex items-center gap-2">
          <span className="text-base font-black text-slate-900 leading-none">
            <span data-testid={valueTestId}>{formatValue(value)}</span>
          </span>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">
            {label}
          </span>
        </div>
      </div>
    );
  }

  if (layout === 'compact') {
    return (
      <div 
        {...commonProps}
        className={cn(
          "bg-white p-6 rounded-xl border border-slate-200 hover:shadow-md transition-all",
          commonProps.className
        )}
      >
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">{label}</p>
        <div className="flex items-end justify-between">
          <h3 className="text-2xl font-bold text-slate-900 leading-none">
            <span data-testid={valueTestId}>
              {formatValue(value)}
            </span>
          </h3>
          {trend ? (
            <span className="text-[10px] font-bold px-2 py-1 bg-green-50 text-green-700 rounded-full flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">trending_up</span> {trend}
            </span>
          ) : (
            <span className={`material-symbols-outlined ${v.text} opacity-50`}>{icon}</span>
          )}
        </div>
        {progressBar !== undefined && (
          <div className="mt-4 h-1 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className={`h-full ${v.progress} rounded-full transition-all duration-500`} 
              style={{ width: `${Math.min(100, Math.max(0, progressBar))}%` }} 
            />
          </div>
        )}
      </div>
    );
  }

  if (layout === 'horizontal') {
    return (
      <div 
        {...commonProps}
        className={cn(
          "bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group",
          commonProps.className
        )}
      >
        <div className="flex justify-between items-start mb-4">
          <div className={cn("p-3 rounded-xl transition-transform group-hover:scale-110", v.bg, v.text)}>
            <span className="material-symbols-outlined text-2xl">{icon}</span>
          </div>
          <div className="flex flex-col items-end gap-2">
            {pulse && (
              <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
            )}
            {trend && (
              <span className={cn(
                "flex items-center text-xs font-bold px-2 py-1 rounded",
                trend === 'Stable' ? 'text-slate-400 bg-slate-50' : 'text-emerald-600 bg-emerald-50'
              )}>
                {trend !== 'Stable' && <span className="material-symbols-outlined text-xs mr-1">trending_up</span>}
                {trend}
              </span>
            )}
            {tag && (
              <span className="text-slate-500 bg-slate-50 px-2 py-1 rounded-lg text-[10px] font-black">{tag}</span>
            )}
          </div>
        </div>
        <p className="text-slate-500 text-sm font-medium">{label}</p>
        <h3 className="text-3xl font-extrabold text-slate-900 mt-1">
          <span data-testid={valueTestId}>{formatValue(value)}</span>
        </h3>
      </div>
    );
  }

  // Default Centered Layout
  return (
    <div 
      {...commonProps}
      className={cn(
        "bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center hover:shadow-md transition-shadow",
        commonProps.className
      )}
    >
      <div className={`p-3 ${v.bg} ${v.text} rounded-xl mb-3`}>
        <span className="material-symbols-outlined text-2xl">{icon}</span>
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-2xl font-black text-slate-900 leading-none font-headline-md">
        <span data-testid={valueTestId} className="font-headline-md">
          {formatValue(value)}
        </span>
      </p>
      {trend && (
        <p className="text-[10px] font-bold text-emerald-600 mt-2 flex items-center gap-1">
          <span className="material-symbols-outlined text-xs">trending_up</span>
          {trend}
        </p>
      )}
      {subValue && (
        <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-tighter">{subValue}</p>
      )}
    </div>
  );
};
