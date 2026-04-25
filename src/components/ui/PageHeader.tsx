'use client';

import { useEffect } from 'react';
import { useLayout } from '@/context/LayoutContext';

interface PageHeaderProps {
  title: string;
  headerActions?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, headerActions }) => {
  const { setTitle, setHeaderActions } = useLayout();

  useEffect(() => {
    setTitle(title);
    setHeaderActions(headerActions || null);
    
    // Cleanup on unmount
    return () => {
      setHeaderActions(null);
    };
  }, [title, headerActions, setTitle, setHeaderActions]);

  return null;
};

export default PageHeader;
