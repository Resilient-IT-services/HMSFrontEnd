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
        <div className="flex-1 flex flex-col min-w-0">
          <main className="flex-1 p-4 lg:p-gutter max-w-7xl mx-auto w-full overflow-x-hidden">
            {children}
          </main>
          <footer className="px-8 py-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] border-t border-slate-100 bg-white/50">
            CareFlow <span className="opacity-50">by Resilient</span> © 2026
          </footer>
        </div>
      </div>
    </div>
  );
}
