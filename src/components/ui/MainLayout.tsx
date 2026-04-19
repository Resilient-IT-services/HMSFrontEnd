'use client';

import React from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

interface MainLayoutProps {
  children: React.ReactNode;
  title: string;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, title }) => {
  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-[var(--background)]">
      <Topbar title={title} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6 lg:p-10">
          <div className="mb-8">
            <h1 className="text-3xl font-black tracking-tight text-[var(--text-primary)]">{title}</h1>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
