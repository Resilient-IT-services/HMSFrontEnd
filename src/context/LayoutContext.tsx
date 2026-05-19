'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface LayoutContextType {
  title: string;
  setTitle: (title: string) => void;
  headerActions: React.ReactNode | null;
  setHeaderActions: (actions: React.ReactNode | null) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
  toggleSidebar: () => void;
  hideGlobalSearch: boolean;
  setHideGlobalSearch: (hide: boolean) => void;
  isCompressed: boolean;
  toggleCompressed: () => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export const LayoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [title, setTitleState] = useState('CareFlow');
  const [headerActions, setHeaderActions] = useState<React.ReactNode | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [hideGlobalSearch, setHideGlobalSearch] = useState(false);
  const [isCompressed, setIsCompressed] = useState(false);

  // Initialize from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('ui_compressed');
    if (saved === 'true') {
      setIsCompressed(true);
      document.documentElement.classList.add('ui-compressed');
    }
  }, []);

  const setTitle = useCallback((newTitle: string) => {
    setTitleState(newTitle);
    if (typeof document !== 'undefined') {
      document.title = `${newTitle} | CareFlow`;
    }
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  const toggleCompressed = useCallback(() => {
    setIsCompressed(prev => {
      const newValue = !prev;
      localStorage.setItem('ui_compressed', String(newValue));
      document.documentElement.classList.toggle('ui-compressed', newValue);
      return newValue;
    });
  }, []);

  return (
    <LayoutContext.Provider value={{ 
      title, 
      setTitle, 
      headerActions, 
      setHeaderActions,
      isSidebarOpen,
      setIsSidebarOpen,
      toggleSidebar,
      hideGlobalSearch,
      setHideGlobalSearch,
      isCompressed,
      toggleCompressed
    }}>
      {children}
    </LayoutContext.Provider>
  );
};

export const useLayout = () => {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
};
