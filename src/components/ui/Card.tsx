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
    <section className={`rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm transition-all hover:border-[var(--primary)]/30 ${noPadding ? '' : 'p-6'} ${className}`}>
      {(title || icon || headerActions) && (
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="rounded-xl bg-[var(--primary-light)] p-2 text-[var(--primary)]">
                <span className="material-symbols-outlined">{icon}</span>
              </div>
            )}
            <div>
              {title && <h2 className="text-xl font-bold text-[var(--text-primary)]">{title}</h2>}
              {subtitle && <p className="text-xs text-[var(--text-secondary)]">{subtitle}</p>}
            </div>
          </div>
          {headerActions && <div>{headerActions}</div>}
        </div>
      )}
      <div>{children}</div>
    </section>
  );
};
