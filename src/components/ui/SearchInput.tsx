'use client';

import React from 'react';

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onSearch?: (value: string) => void;
  fullWidth?: boolean;
}

export const SearchInput: React.FC<SearchInputProps> = ({ 
  className = '', 
  fullWidth = true,
  onSearch,
  ...props 
}) => {
  return (
    <div className={`relative ${fullWidth ? 'w-full' : ''}`}>
      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
        search
      </span>
      <input 
        className={`
          w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl 
          focus:ring-2 focus:ring-orange-600/20 transition-all 
          font-bold text-sm outline-none placeholder:text-slate-400
          ${className}
        `} 
        type="text"
        {...props}
      />
    </div>
  );
};
