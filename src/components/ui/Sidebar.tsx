'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/state/store';
import { logout } from '@/state/authSlice';
import { authService } from '@/services/authService';
import { useLayout } from '@/context/LayoutContext';
import { ROLE_PATH_MAP, MOBILE_BREAKPOINT } from '@/utils/constants';

const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  const { isSuperMode, activeRole } = useSelector((state: RootState) => state.auth);
  const { isSidebarOpen, setIsSidebarOpen } = useLayout();

  const handleLogout = async () => {
    try {
      await authService.logout();
      dispatch(logout());
      router.push('/login');
    } catch (error) {
      // Error handled by interceptor
    }
  };

  const handleLinkClick = () => {
    if (globalThis.innerWidth < MOBILE_BREAKPOINT) {
      setIsSidebarOpen(false);
    }
  };

  // If in super mode, we act as super admin regardless of activeRole
  const effectiveRole = isSuperMode ? 'SUPER_ADMIN' : activeRole;
  const dashboardPath = effectiveRole ? (ROLE_PATH_MAP[effectiveRole] || effectiveRole.toLowerCase()) : 'unauthorized';

  const menuItems = [
    { name: 'Dashboard', icon: 'dashboard', href: `/${dashboardPath}/dashboard`, roles: ['RECEPTIONIST', 'DOCTOR', 'PHARMACIST', 'ADMIN', 'SUPER_ADMIN', 'NURSE'] },
    { 
      name: effectiveRole === 'DOCTOR' ? 'Patient Queue' : 'Patients', 
      icon: 'group', 
      href: effectiveRole === 'DOCTOR' ? '/doctor/patient-queue' : '/reception/patients', 
      roles: ['RECEPTIONIST', 'DOCTOR', 'ADMIN'] 
    },
    { name: 'Doctors', icon: 'medical_services', href: '/reception/doctors', roles: ['RECEPTIONIST', 'ADMIN'] },
    { name: 'Appointments', icon: 'calendar_today', href: '/reception/appointments', roles: ['RECEPTIONIST', 'ADMIN'] },
    {
      name: 'History',
      icon: 'history_edu',
      href: '/doctor/history',
      roles: ['DOCTOR', 'ADMIN']
    },
    { name: 'Prescriptions', icon: 'prescriptions', href: effectiveRole === 'PHARMACIST' ? '/pharmacy/prescriptions' : '/doctor/prescriptions', roles: ['PHARMACIST', 'ADMIN'] },
    { name: 'Medicine Master', icon: 'medication', href: '/admin/medicines', roles: ['ADMIN', 'SUPER_ADMIN'] },
    { name: 'Inventory', icon: 'inventory_2', href: '/pharmacy/stock', roles: ['PHARMACIST', 'ADMIN'] },
    { name: 'User Management', icon: 'person', href: '/admin/users', roles: ['ADMIN', 'SUPER_ADMIN'] },
    { name: 'Hospitals', icon: 'apartment', href: '/super_admin/hospitals', roles: ['SUPER_ADMIN'] },
    { name: 'Vitals Config', icon: 'monitoring', href: '/super_admin/vitals', roles: ['SUPER_ADMIN'] },
    { name: 'Reports', icon: 'query_stats', href: '/super_admin/reports', roles: ['SUPER_ADMIN'] },
    { name: 'Earnings', icon: 'payments', href: '/doctor/earnings', roles: ['DOCTOR'] },
    { name: 'Settings', icon: 'settings', href: '/settings', roles: ['ADMIN', 'SUPER_ADMIN'] },
  ];

  const filteredMenuItems = menuItems.filter(item => 
    effectiveRole && item.roles.includes(effectiveRole)
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[55] lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={`bg-white h-[calc(100vh-64px)] w-64 border-r border-gray-200 flex flex-col p-4 gap-2 fixed lg:sticky top-16 z-[56] transition-transform duration-300 ease-in-out ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="px-2 mb-4 flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Main Menu</p>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-1 hover:bg-gray-100 rounded-lg text-gray-400"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
        <nav className="flex-1 space-y-1">
          {filteredMenuItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={handleLinkClick}
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
    </>
  );
};

export default Sidebar;
