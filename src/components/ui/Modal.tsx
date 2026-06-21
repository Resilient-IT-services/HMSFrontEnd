'use client';

import React, { useEffect } from 'react';
import { cn } from '@/lib/cn';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full' | 'auto';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: ModalSize;
  width?: string; // Explicit width (e.g. '500px')
  className?: string;
  hideHeader?: boolean;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-[420px]',
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
                                              className,
                                              hideHeader = false
                                            }) => {
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        {/* Backdrop */}
        <div
            className="absolute inset-0"
            onClick={onClose}
        ></div>

        {/* Modal Container: h-[70vh] ko hatakar h-auto aur max-h-[85vh] kar diya hai */}
        <div
            className={cn(
                "relative bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200/60 transition-all transform animate-in zoom-in-95 duration-200 flex flex-col w-[420px] max-w-[90vw] h-auto max-h-[85vh] p-0",
                sizeClasses[size],
                className
            )}
            style={width ? { width, maxWidth: '100%' } : {}}
        >
          {!hideHeader && (
              <div className="px-6 py-4 border-b border-slate-50 flex justify-between items-center bg-white shrink-0">
                <div className="space-y-0.5">
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">{title}</h3>
                </div>
                <button
                    onClick={onClose}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all group active:scale-90"
                >
                  <span className="material-symbols-outlined text-lg group-hover:rotate-90 transition-transform duration-300">close</span>
                </button>
              </div>
          )}

          {/* min-h-0 lagaya taaki flex-1 content size sahi se handle kare bina stretch hue */}
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-1">
            {children}
          </div>
        </div>
      </div>
  );
};
