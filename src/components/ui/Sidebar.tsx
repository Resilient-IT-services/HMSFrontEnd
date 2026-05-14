'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/state/store';
import { logout } from '@/state/authSlice';
import { authService } from '@/services/authService';
import { getFilteredMenuItems } from '@/lib/navigation';

const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  const { isSuperMode, activeRole } = useSelector((state: RootState) => state.auth);

  const handleLogout = async () => {
    try {
      await authService.logout();
      dispatch(logout());
      router.push('/login');
    } catch {
      // Error handled by interceptor or failed logout is non-critical for redirection
    }
  };

  // If in super mode, we act as super admin regardless of activeRole
  const effectiveRole = isSuperMode ? 'SUPER_ADMIN' : activeRole;
  const filteredMenuItems = getFilteredMenuItems(effectiveRole);

  return (
    <aside className="bg-white h-[calc(100vh-64px)] w-64 border-r border-gray-200 flex flex-col p-4 gap-2 sticky top-16 z-[50] hidden lg:flex">
      <div className="px-2 mb-4">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Main Menu</p>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto">
        {filteredMenuItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 transition-all duration-200 font-manrope text-sm font-medium ${
                isActive
                  ? 'bg-[var(--primary-light)] text-[var(--primary)] rounded-lg'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className="material-symbols-outlined" style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>
                {item.icon}
              </span>
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto flex flex-col gap-2 pt-4 border-t border-gray-100">
        <a className="flex items-center gap-3 px-3 py-2.5 text-gray-600 hover:bg-gray-50 transition-all font-manrope text-sm font-medium cursor-pointer">
          <span className="material-symbols-outlined">help</span>
          <span>Support</span>
        </a>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 text-gray-600 hover:bg-gray-50 transition-all font-manrope text-sm font-medium w-full text-left"
        >
          <span className="material-symbols-outlined">logout</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
