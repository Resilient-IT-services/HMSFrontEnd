'use client';

import React from 'react';
import Sidebar from '@/components/ui/Sidebar';
import Topbar from '@/components/ui/Topbar';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface">
      <Topbar />
      <div className="flex min-h-[calc(100vh-64px)]">
        <Sidebar />
        <main className="flex-1 p-gutter max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
