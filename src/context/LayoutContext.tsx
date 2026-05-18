'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

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
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export const LayoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [title, setTitleState] = useState('CareFlow');
  const [headerActions, setHeaderActions] = useState<React.ReactNode | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [hideGlobalSearch, setHideGlobalSearch] = useState(false);

  const setTitle = useCallback((newTitle: string) => {
    setTitleState(newTitle);
    // Also update document title
    if (typeof document !== 'undefined') {
      document.title = `${newTitle} | CareFlow`;
    }
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
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
      setHideGlobalSearch
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
