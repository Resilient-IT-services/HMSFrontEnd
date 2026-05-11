'use client';

import React from 'react';
import Link from 'next/link';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  icon?: string;
  isLoading?: boolean;
  href?: string;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  isLoading,
  href,
  fullWidth,
  children,
  className = '',
  ...props
}) => {
  const baseStyles = "inline-flex items-center justify-center gap-2 font-bold transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none rounded-xl";
  
  const variants = {
    primary: "bg-orange-600 text-white shadow-lg shadow-orange-600/20 hover:bg-orange-700",
    secondary: "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm",
    ghost: "bg-transparent text-slate-500 hover:bg-slate-50",
    danger: "bg-red-50 text-red-600 border border-red-100 hover:bg-red-600 hover:text-white"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-[10px] uppercase tracking-tighter",
    md: "px-4 py-2 text-xs uppercase tracking-tight",
    lg: "px-6 py-3 text-sm font-bold",
    xl: "px-8 py-3.5 text-base font-bold"
  };

  const combinedClasses = `${baseStyles} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`;

  const content = (
    <>
      {isLoading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
      ) : icon && (
        <span className="material-symbols-outlined text-[1.2em]">{icon}</span>
      )}
      {children}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={combinedClasses}>
        {content}
      </Link>
    );
  }

  return (
    <button className={combinedClasses} {...props}>
      {content}
    </button>
  );
};
