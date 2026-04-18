import React from 'react';

interface CardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  icon?: string;
}

export const Card: React.FC<CardProps> = ({ title, subtitle, children, className = '', icon }) => {
  return (
    <section className={`rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm transition-all hover:border-[var(--primary)]/30 ${className}`}>
      {(title || icon) && (
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
        </div>
      )}
      <div>{children}</div>
    </section>
  );
};
