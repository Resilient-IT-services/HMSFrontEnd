'use client';

import React, { useEffect } from 'react';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full' | 'auto';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: ModalSize;
  width?: string; // Explicit width (e.g. '500px')
  hideHeader?: boolean;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  full: 'max-w-[95vw]',
  auto: 'w-auto'
};

export const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md',
  width,
  hideHeader = false
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    globalThis.addEventListener('keydown', handleEsc);
    return () => {
      globalThis.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-10 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity duration-300 animate-in fade-in" 
        onClick={onClose}
      ></div>

      {/* Modal Container */}
      <div 
        className={`relative bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-200/60 transition-all transform animate-in zoom-in-95 duration-200 flex flex-col w-full ${sizeClasses[size]}`}
        style={width ? { width, maxWidth: '100%' } : {}}
      >
        {!hideHeader && (
          <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-white">
            <div className="space-y-0.5">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">{title}</h3>
            </div>
            <button 
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all group active:scale-90"
            >
              <span className="material-symbols-outlined text-xl group-hover:rotate-90 transition-transform duration-300">close</span>
            </button>
          </div>
        )}
        
        <div className="max-h-[85vh] overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};
