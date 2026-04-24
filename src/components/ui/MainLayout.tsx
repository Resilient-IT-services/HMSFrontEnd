'use client';

import React from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

interface MainLayoutProps {
  children: React.ReactNode;
  title: string;
  headerActions?: React.ReactNode;
  hideTitle?: boolean;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, title, headerActions, hideTitle }) => {
  return (
    <div className="min-h-screen bg-surface">
      <Topbar title={title} />
      <div className="flex min-h-[calc(100vh-64px)]">
        <Sidebar />
        <main className="flex-1 p-gutter max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
