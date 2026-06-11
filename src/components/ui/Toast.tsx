'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType) => {
    if (!message) return;
    
    const normalizedNewMessage = message.trim().toLowerCase();

    setToasts((prev) => {
      // Rule 1: Prevent exact identical toast duplicates stacking altogether
      const isDuplicate = prev.some(t => t.message.trim().toLowerCase() === normalizedNewMessage);
      if (isDuplicate) return prev;

      // Rule 2: If a specific business validation error exists, suppress generic technical sub-errors
      const containsGenericKeyword = 
        normalizedNewMessage.includes('failed to start') || 
        normalizedNewMessage.includes('critical error') ||
        normalizedNewMessage.includes('something went wrong');

      if (containsGenericKeyword && prev.length > 0) {
        // Drop the generic notification if a highly explicit validation message is already rendering
        return prev;
      }

      // Rule 3: Inverse checking (If a generic error is on-screen and a specific error arrives, swap them out)
      if (!containsGenericKeyword) {
        const filteredOutGenerics = prev.filter(t => {
          const existingMsg = t.message.toLowerCase();
          return !existingMsg.includes('failed to start') && 
                 !existingMsg.includes('critical error') &&
                 !existingMsg.includes('something went wrong');
        });
        
        const id = Math.random().toString(36).slice(2, 9);
        return [...filteredOutGenerics, { id, message, type }];
      }

      const id = Math.random().toString(36).slice(2, 9);
      return [...prev, { id, message, type }];
    });

    // Auto dismiss dynamic timeline trigger
    const generatedId = Math.random().toString(36).slice(2, 9);
    setTimeout(() => {
      setToasts((currentToasts) => currentToasts.filter((t) => t.message.trim().toLowerCase() !== normalizedNewMessage));
    }, 5000);
  }, []);

  // Listen for global toast events (useful for axios interceptors)
  useEffect(() => {
    const handleGlobalToast = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { message, type } = customEvent.detail;
      showToast(message, type);
    };
    globalThis.addEventListener('show-toast', handleGlobalToast);
    return () => globalThis.removeEventListener('show-toast', handleGlobalToast);
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-2 w-full max-w-[90vw] px-4 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              pointer-events-auto flex items-center gap-3 px-4 py-2.5 rounded-xl shadow-lg 
              animate-in slide-in-from-top-2 fade-in duration-300 border w-auto min-w-[200px] max-w-full
              ${
                toast.type === 'error' ? 'bg-white border-l-4 border-l-red-500 border-red-100' : 
                toast.type === 'success' ? 'bg-white border-l-4 border-l-emerald-500 border-emerald-100' : 
                toast.type === 'warning' ? 'bg-white border-l-4 border-l-orange-500 border-orange-100' :
                'bg-white border-l-4 border-l-slate-500 border-slate-100'
              }
            `}
          >
            <div className={`
              w-6 h-6 rounded-full flex items-center justify-center shrink-0
              ${
                toast.type === 'error' ? 'bg-red-50 text-red-600' : 
                toast.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 
                toast.type === 'warning' ? 'bg-orange-50 text-orange-600' :
                'bg-slate-50 text-slate-600'
              }
            `}>
              <span className="material-symbols-outlined text-base">
                {toast.type === 'error' ? 'error' : (toast.type === 'success' ? 'check_circle' : (toast.type === 'warning' ? 'warning' : 'info'))}
              </span>
            </div>
            <div className="flex-1">
              <p className="font-bold text-[11px] text-slate-700 leading-tight whitespace-normal">
                {toast.message}
              </p>
            </div>
            <button 
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="text-slate-300 hover:text-slate-500 transition-colors pointer-events-auto shrink-0 ml-2"
            >
              <span className="material-symbols-outlined text-xs">close</span>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// Global helper to trigger toasts from non-component files
export const triggerGlobalToast = (message: string, type: ToastType) => {
  if (globalThis.window !== undefined) {
    globalThis.dispatchEvent(new CustomEvent('show-toast', { detail: { message, type } }));
  }
};
