'use client';

import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/state/store';

interface TopbarProps {
  title: string;
}

const Topbar: React.FC<TopbarProps> = ({ title }) => {
  const user = useSelector((state: RootState) => state.auth.user);

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] bg-opacity-80 backdrop-blur-md px-6 py-3 lg:px-10">
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)] text-white">
          <span className="material-symbols-outlined">health_and_safety</span>
        </div>
        <div>
          <h2 className="text-xl font-bold leading-tight tracking-tight text-[var(--text-primary)]">HMS System</h2>
          <p className="text-xs text-[var(--text-secondary)]">Hospital Management Portal</p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-end gap-4 lg:gap-8">
        <div className="hidden md:flex flex-1 max-w-md relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">search</span>
          <input 
            className="w-full rounded-xl border-[var(--border)] bg-[var(--background)] pl-10 pr-4 py-2 text-sm focus:border-[var(--primary)] focus:ring-[var(--primary)] text-[var(--text-primary)]" 
            placeholder="Search..." 
            type="text"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--background)] text-[var(--text-secondary)] hover:bg-[var(--primary-light)] hover:text-[var(--primary)] transition-colors">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          
          <div className="flex items-center gap-3 ml-2">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-[var(--text-primary)] leading-none">{user?.username}</p>
              <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase mt-1 tracking-wider">{user?.role}</p>
            </div>
            <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-[var(--primary-light)] bg-[var(--background)] flex items-center justify-center">
               <span className="material-symbols-outlined text-[var(--text-secondary)]">person</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
