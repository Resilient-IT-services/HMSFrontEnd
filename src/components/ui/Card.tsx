import React from 'react';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ title, children, className = '' }) => {
  return (
    <div className={`card ${className}`}>
      {title && (
        <div className="border-b border-[var(--border)] pb-4 mb-4">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h2>
        </div>
      )}
      <div>{children}</div>
    </div>
  );
};
