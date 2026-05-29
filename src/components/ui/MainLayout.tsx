'use client';

import React from 'react';
import PageHeader from './PageHeader';

interface MainLayoutProps {
  children: React.ReactNode;
  title: string;
  headerActions?: React.ReactNode;
  hideTitle?: boolean;
  hideGlobalSearch?: boolean;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, title, headerActions, hideGlobalSearch }) => {
  return (
    <>
      <PageHeader title={title} headerActions={headerActions} hideGlobalSearch={hideGlobalSearch} />
      {children}
    </>
  );
};

export default MainLayout;
