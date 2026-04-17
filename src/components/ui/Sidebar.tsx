'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  ClipboardList, 
  Pill, 
  Settings, 
  LogOut,
  UserCircle
} from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/state/store';
import { logout } from '@/state/authSlice';
import { authService } from '@/services/authService';

const Sidebar = () => {
  const pathname = usePathname();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);

  const handleLogout = async () => {
    try {
      await authService.logout();
      dispatch(logout());
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, href: `/${user?.role?.toLowerCase()}/dashboard`, roles: ['RECEPTIONIST', 'DOCTOR', 'PHARMACIST', 'ADMIN', 'SUPER_ADMIN'] },
    { name: 'Patients', icon: Users, href: '/reception/patients', roles: ['RECEPTIONIST', 'DOCTOR', 'ADMIN'] },
    { name: 'Appointments', icon: Calendar, href: '/reception/appointments', roles: ['RECEPTIONIST', 'ADMIN'] },
    { name: 'Prescriptions', icon: ClipboardList, href: '/doctor/prescriptions', roles: ['DOCTOR', 'PHARMACIST', 'ADMIN'] },
    { name: 'Pharmacy', icon: Pill, href: '/pharmacy/stock', roles: ['PHARMACIST', 'ADMIN'] },
    { name: 'User Management', icon: UserCircle, href: '/admin/users', roles: ['ADMIN', 'SUPER_ADMIN'] },
    { name: 'Settings', icon: Settings, href: '/settings', roles: ['ADMIN', 'SUPER_ADMIN'] },
  ];

  const filteredMenuItems = menuItems.filter(item => 
    user?.role && item.roles.includes(user.role)
  );

  return (
    <div className="flex flex-col h-screen w-64 bg-[var(--surface)] border-r border-[var(--border)]">
      <div className="flex items-center justify-center h-16 border-b border-[var(--border)]">
        <h1 className="text-xl font-bold text-[var(--primary)]">HMS System</h1>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="px-4 space-y-1">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? 'bg-[var(--primary)] text-white'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--background)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-white' : 'text-[var(--text-secondary)]'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="p-4 border-t border-[var(--border)]">
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-4 py-2 text-sm font-medium text-[var(--text-secondary)] rounded-md hover:bg-[var(--error)] hover:text-white transition-colors"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
