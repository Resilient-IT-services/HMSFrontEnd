'use client';

import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/state/store';
import { Bell, Search, User } from 'lucide-react';

interface TopbarProps {
  title: string;
}

const Topbar: React.FC<TopbarProps> = ({ title }) => {
  const user = useSelector((state: RootState) => state.auth.user);

  return (
    <div className="h-16 bg-[var(--surface)] border-b border-[var(--border)] flex items-center justify-between px-8">
      <div className="flex items-center">
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">{title}</h2>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-[var(--text-secondary)]" />
          </span>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-[var(--border)] rounded-md leading-5 bg-[var(--background)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] focus:border-[var(--primary)] sm:text-sm"
            placeholder="Search..."
          />
        </div>

        <button className="p-1 rounded-full text-[var(--text-secondary)] hover:text-[var(--primary)] focus:outline-none">
          <Bell className="h-6 w-6" />
        </button>

        <div className="flex items-center space-x-3 ml-4">
          <div className="text-right">
            <p className="text-sm font-medium text-[var(--text-primary)]">{user?.username}</p>
            <p className="text-xs text-[var(--text-secondary)]">{user?.role}</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-[var(--background)] flex items-center justify-center border border-[var(--border)]">
            <User className="h-6 w-6 text-[var(--text-secondary)]" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Topbar;
