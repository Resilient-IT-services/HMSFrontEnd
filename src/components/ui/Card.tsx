import React from 'react';

interface CardProps {
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
  className?: string;
  icon?: string;
  headerActions?: React.ReactNode;
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  children,
  className = '',
  icon,
  headerActions,
  noPadding = false
}) => {
  return (
    <section className={`rounded-xl md:rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm transition-all hover:border-[var(--primary)]/30 ${noPadding ? '' : 'p-3 md:p-4'} ${className}`}>
      {(title || icon || headerActions) && (
        <div className="mb-3 md:mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            {icon && (
              <div className="rounded-lg md:rounded-xl bg-[var(--primary-light)] p-1.5 md:p-2 text-[var(--primary)] shrink-0">
                <span className="material-symbols-outlined text-lg md:text-2xl">{icon}</span>
              </div>
            )}
            <div className="min-w-0">
              {title && <h2 className="text-base md:text-xl font-bold text-[var(--text-primary)] truncate">{title}</h2>}
              {subtitle && <p className="text-[10px] md:text-xs text-[var(--text-secondary)] truncate uppercase font-medium tracking-wider">{subtitle}</p>}
            </div>
          </div>
          {headerActions && <div className="shrink-0">{headerActions}</div>}
        </div>
      )}
      <div className="text-sm md:text-base">{children}</div>
    </section>
  );
};
