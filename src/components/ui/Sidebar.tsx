'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/state/store';
import { logout } from '@/state/authSlice';
import { authService } from '@/services/authService';

const Sidebar = () => {
  const pathname = usePathname();
  const dispatch = useDispatch();
  const { user, isSuperMode, activeRole } = useSelector((state: RootState) => state.auth);

  const handleLogout = async () => {
    try {
      await authService.logout();
      dispatch(logout());
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  const rolePathMap: Record<string, string> = {
    'RECEPTIONIST': 'reception',
    'DOCTOR': 'doctor',
    'PHARMACIST': 'pharmacy',
    'ADMIN': 'admin',
    'SUPER_ADMIN': 'super_admin',
    'NURSE': 'nurse'
  };

  // If in super mode, we act as super admin regardless of activeRole
  const effectiveRole = isSuperMode ? 'SUPER_ADMIN' : activeRole;
  const dashboardPath = effectiveRole ? (rolePathMap[effectiveRole] || effectiveRole.toLowerCase()) : 'unauthorized';

  const menuItems = [
    { name: 'Dashboard', icon: 'dashboard', href: `/${dashboardPath}/dashboard`, roles: ['RECEPTIONIST', 'DOCTOR', 'PHARMACIST', 'ADMIN', 'SUPER_ADMIN', 'NURSE'] },
    { name: 'Patients', icon: 'group', href: '/reception/patients', roles: ['RECEPTIONIST', 'DOCTOR', 'ADMIN', 'SUPER_ADMIN'] },
    { name: 'Appointments', icon: 'calendar_today', href: '/reception/appointments', roles: ['RECEPTIONIST', 'ADMIN', 'SUPER_ADMIN'] },
    { name: 'Prescriptions', icon: 'prescriptions', href: '/doctor/prescriptions', roles: ['DOCTOR', 'PHARMACIST', 'ADMIN', 'SUPER_ADMIN'] },
    { name: 'Inventory', icon: 'inventory_2', href: '/pharmacy/stock', roles: ['PHARMACIST', 'ADMIN', 'SUPER_ADMIN'] },
    { name: 'User Management', icon: 'person', href: '/admin/users', roles: ['ADMIN', 'SUPER_ADMIN'] },
    { name: 'Hospitals', icon: 'apartment', href: '/super_admin/hospitals', roles: ['SUPER_ADMIN'] },
    { name: 'Settings', icon: 'settings', href: '/settings', roles: ['ADMIN', 'SUPER_ADMIN'] },
  ];

  const filteredMenuItems = menuItems.filter(item => 
    effectiveRole && item.roles.includes(effectiveRole)
  );

  return (
    <aside className="hidden lg:flex w-64 flex-col border-r border-[var(--border)] bg-[var(--surface)] p-4 gap-2 h-screen">
      <nav className="flex flex-col gap-1">
        {filteredMenuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 font-medium transition-colors ${
                isActive
                  ? 'bg-[var(--primary)] text-white'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--primary-light)] hover:text-[var(--primary)]'
              }`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              {item.name}
            </Link>
          );
        })}
      </nav>
      
      <div className="mt-auto flex flex-col gap-1">
        <div className="my-4 border-t border-[var(--border)]"></div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 rounded-xl px-4 py-3 text-[var(--text-secondary)] hover:bg-[var(--error-light)] hover:text-[var(--error)] transition-colors font-medium w-full text-left"
        >
          <span className="material-symbols-outlined">logout</span>
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
