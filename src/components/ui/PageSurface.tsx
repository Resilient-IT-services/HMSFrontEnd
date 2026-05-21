import React from 'react';
import { cn } from '@/lib/cn';

interface PageSurfaceProps {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  backgroundClassName?: string;
  maxWidthClassName?: string;
  paddingClassName?: string;
  fontClassName?: string;
}

export const PageSurface: React.FC<PageSurfaceProps> = ({
  children,
  className,
  contentClassName,
  backgroundClassName = 'bg-surface',
  maxWidthClassName = 'max-w-7xl',
  paddingClassName = 'p-0',
  fontClassName,
}) => {
  return (
    <div
      className={cn(
        paddingClassName,
        maxWidthClassName,
        'mx-auto w-full',
        backgroundClassName,
        fontClassName,
        className,
      )}
    >
      <div className={contentClassName}>{children}</div>
    </div>
  );
};
