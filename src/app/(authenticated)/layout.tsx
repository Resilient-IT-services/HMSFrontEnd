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
    <div className="min-h-screen bg-surface flex flex-col">
      <Topbar />
      <div className="flex flex-1 relative">
        <Sidebar />
        <main className="flex-1 p-4 lg:p-gutter max-w-7xl mx-auto w-full overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
