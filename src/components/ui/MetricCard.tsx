import React from 'react';
import { cn } from '@/lib/cn';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Legend, 
  Tooltip
} from 'recharts';

export interface MetricCardProps {
  label: string;
  value?: React.ReactNode;
  icon?: string;
  variant?: 'slate' | 'emerald' | 'blue' | 'orange' | 'purple' | 'indigo' | 'red';
  trend?: string;
  subValue?: string;
  layout?: 'centered' | 'horizontal' | 'compact' | 'pill' | 'chart';
  progressBar?: number; // percentage 0-100
  tag?: string;
  valueTestId?: string;
  onClick?: () => void;
  chartData?: Record<string, number>;
}

const CATEGORY_COLORS: Record<string, string> = {
  pending: '#f97316',   // Orange
  waiting: '#f97316',   // Orange
  completed: '#3b82f6', // Blue (per req: Blue/Green)
  dispensed: '#10b981', // Green
  cancelled: '#ef4444', // Red
  active: '#6366f1',    // Indigo
  processing: '#6366f1' // Indigo
};

const DEFAULT_COLOR = '#94a3b8'; // Slate-400

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent < 0.05) return null; // Don't show labels for very small slices

  return (
    <text 
      x={x} 
      y={y} 
      fill="white" 
      textAnchor={x > cx ? 'start' : 'end'} 
      dominantBaseline="central"
      className="text-[10px] font-bold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

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
  onClick,
  chartData
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
      "bg-white rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md",
      onClick && "cursor-pointer active:scale-[0.98]"
    )
  };

  // Chart Layout
  if (layout === 'chart' || chartData) {
    const data = Object.entries(chartData || {}).map(([name, val]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value: val,
      color: CATEGORY_COLORS[name.toLowerCase()] || DEFAULT_COLOR
    })).filter(item => item.value > 0);

    const total = data.reduce((acc, curr) => acc + curr.value, 0);

    return (
      <div {...commonProps} className={cn(commonProps.className, "p-6 flex flex-col h-[300px]")}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">{label}</h3>
          {icon && <span className={cn("material-symbols-outlined", v.text)}>{icon}</span>}
        </div>
        
        <div className="flex-1 min-h-0 relative">
          {total > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={80}
                  innerRadius={40}
                  fill="#8884d8"
                  dataKey="value"
                  animationDuration={1000}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontWeight: 'bold', fontSize: '12px' }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  align="center"
                  formatter={(value) => <span className="text-[10px] font-bold text-slate-500 uppercase">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2">
              <span className="material-symbols-outlined text-4xl opacity-20">pie_chart</span>
              <p className="text-xs font-bold uppercase tracking-widest opacity-40">No Data Available</p>
            </div>
          )}
        </div>
        
        {total > 0 && subValue && (
          <div className="mt-2 pt-2 border-t border-slate-50 text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{subValue}</p>
          </div>
        )}
      </div>
    );
  }

  if (layout === 'pill') {
    return (
      <div 
        {...commonProps}
        tabIndex={0}
        className={cn(
          "relative flex items-center gap-1 px-2.5 py-0.5 rounded-full border transition-all shadow-sm shrink-0 group/pill outline-none focus:ring-1 focus:ring-orange-500/30",
          variant === 'slate' ? "bg-slate-50 border-slate-200" : cn(v.bg, "border-transparent"),
          commonProps.className,
          "bg-transparent border-none shadow-none hover:shadow-none" // Overriding commonProps for pill
        )}
      >
        {/* Tooltip */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-[10px] font-bold rounded shadow-xl opacity-0 group-hover/pill:opacity-100 group-focus/pill:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
          {label}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
        </div>

        <span className={cn("material-symbols-outlined text-[14px] transition-transform group-hover/pill:scale-110", v.text)}>{icon}</span>
        <span className="text-[11px] font-extrabold text-slate-900 leading-none">
          <span data-testid={valueTestId}>{formatValue(value)}</span>
        </span>
      </div>
    );
  }

  if (layout === 'compact') {
    return (
      <div 
        {...commonProps}
        className={cn(
          "p-6",
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
          "p-6 group",
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
        "w-full h-[180px] p-6 flex flex-col items-center justify-center text-center",
        commonProps.className
      )}
    >
      <div className={`p-3 ${v.bg} ${v.text} rounded-xl mb-3 shrink-0`}>
        <span className="material-symbols-outlined text-2xl">{icon}</span>
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 truncate w-full">{label}</p>
      <p className="text-2xl font-black text-slate-900 leading-none font-headline-md truncate w-full">
        <span data-testid={valueTestId} className="font-headline-md">
          {formatValue(value)}
        </span>
      </p>
      {trend && (
        <p className="text-[10px] font-bold text-emerald-600 mt-2 flex items-center gap-1 shrink-0">
          <span className="material-symbols-outlined text-xs">trending_up</span>
          {trend}
        </p>
      )}
      {subValue && (
        <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-tighter shrink-0">{subValue}</p>
      )}
    </div>
  );
};
