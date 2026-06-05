import React from 'react';
import { cn } from '@/lib/cn';

interface ContentPanelProps {
  children: React.ReactNode;
  toolbar?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  contentClassName?: string;
  toolbarClassName?: string;
  footerClassName?: string;
  flush?: boolean;
}

export const ContentPanel: React.FC<ContentPanelProps> = ({
  children,
  toolbar,
  footer,
  className,
  contentClassName,
  toolbarClassName,
  footerClassName,
  flush = true,
}) => {
  return (
    <section className={cn('overflow-visible rounded-2xl border border-slate-200 bg-white shadow-sm', className)}>
      {toolbar && (
        <div className={cn('border-b border-slate-100 bg-slate-50/30 p-4', toolbarClassName)}>
          {toolbar}
        </div>
      )}
      <div className={cn(!flush && 'p-4', contentClassName)}>{children}</div>
      {footer && <div className={cn('border-t border-slate-50 bg-white', footerClassName)}>{footer}</div>}
    </section>
  );
};
