'use client';

import React from 'react';
import PageHeader from './PageHeader';

interface MainLayoutProps {
  children: React.ReactNode;
  title: string;
  headerActions?: React.ReactNode;
  hideTitle?: boolean;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, title, headerActions, hideTitle }) => {
  return (
    <>
      <PageHeader title={title} headerActions={headerActions} />
      {children}
    </>
  );
};

export default MainLayout;
