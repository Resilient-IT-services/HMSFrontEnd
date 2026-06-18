'use client';

import { useEffect } from 'react';
import { useLayout } from '@/context/LayoutContext';

interface PageHeaderProps {
  title: string;
  headerActions?: React.ReactNode;
  hideGlobalSearch?: boolean;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, headerActions, hideGlobalSearch = false }) => {
  const { setTitle, setHeaderActions, setHideGlobalSearch } = useLayout();

  useEffect(() => {
    setTitle(title);
    setHeaderActions(headerActions || null);
    setHideGlobalSearch(hideGlobalSearch);
    
    // Cleanup on unmount
    return () => {
      setHeaderActions(null);
      setHideGlobalSearch(false);
    };
  }, [title, headerActions, hideGlobalSearch, setTitle, setHeaderActions, setHideGlobalSearch]);

  return null;
};
