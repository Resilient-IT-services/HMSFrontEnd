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
  fullBleed?: boolean;
}

export const PageSurface: React.FC<PageSurfaceProps> = ({
  children,
  className,
  contentClassName,
  backgroundClassName = 'bg-[#f9f9ff]',
  maxWidthClassName = 'max-w-7xl',
  paddingClassName = 'p-8',
  fontClassName,
  fullBleed = true,
}) => {
  return (
    <div
      className={cn(
        paddingClassName,
        maxWidthClassName,
        'mx-auto w-full min-h-screen',
        fullBleed && '-m-8',
        backgroundClassName,
        fontClassName,
        className,
      )}
    >
      <div className={contentClassName}>{children}</div>
    </div>
  );
};
