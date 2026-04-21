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
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-[var(--background)]">
      <Topbar title={title} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6 lg:p-10">
          {(headerActions || (title && !hideTitle)) && (
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
              {!hideTitle && title && <h1 className="text-3xl font-black tracking-tight text-[var(--text-primary)] uppercase">{title}</h1>}
              {hideTitle && <div />}
              {headerActions && <div>{headerActions}</div>}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
