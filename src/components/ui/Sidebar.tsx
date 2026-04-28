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
  const { isSuperMode, activeRole } = useSelector((state: RootState) => state.auth);

  const handleLogout = async () => {
    try {
      await authService.logout();
      dispatch(logout());
      globalThis.location.href = '/login';
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
    { 
      name: effectiveRole === 'DOCTOR' ? 'Patient Queue' : 'Patients', 
      icon: 'group', 
      href: effectiveRole === 'DOCTOR' ? '/doctor/patient-queue' : '/reception/patients', 
      roles: ['RECEPTIONIST', 'DOCTOR', 'ADMIN'] 
    },
    { name: 'Doctors', icon: 'medical_services', href: '/reception/doctors', roles: ['RECEPTIONIST', 'ADMIN'] },
    { name: 'Appointments', icon: 'calendar_today', href: '/reception/appointments', roles: ['RECEPTIONIST', 'ADMIN'] },
    { 
      name: effectiveRole === 'DOCTOR' ? 'History' : 'Token Queue', 
      icon: effectiveRole === 'DOCTOR' ? 'history_edu' : 'queue', 
      href: effectiveRole === 'DOCTOR' ? '/doctor/history' : '/reception/queue', 
      roles: ['RECEPTIONIST', 'DOCTOR', 'ADMIN'] 
    },
    { name: 'Prescriptions', icon: 'prescriptions', href: '/doctor/prescriptions', roles: ['DOCTOR', 'PHARMACIST', 'ADMIN'] },
    { name: 'Inventory', icon: 'inventory_2', href: '/pharmacy/stock', roles: ['PHARMACIST', 'ADMIN'] },
    { name: 'User Management', icon: 'person', href: '/admin/users', roles: ['ADMIN', 'SUPER_ADMIN'] },
    { name: 'Hospitals', icon: 'apartment', href: '/super_admin/hospitals', roles: ['SUPER_ADMIN'] },
    { name: 'Settings', icon: 'settings', href: '/settings', roles: ['ADMIN', 'SUPER_ADMIN'] },
  ];

  const filteredMenuItems = menuItems.filter(item => 
    effectiveRole && item.roles.includes(effectiveRole)
  );

  return (
    <aside className="bg-white h-[calc(100vh-64px)] w-64 border-r border-gray-200 flex flex-col p-4 gap-2 sticky top-16 z-50">
      <div className="px-2 mb-4">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Main Menu</p>
      </div>
      <nav className="flex-1 space-y-1">
        {filteredMenuItems.map((item) => {
          // Check if current path starts with item.href to keep it active for sub-routes
          // e.g. /admin/users and /admin/users/create both should highlight "User Management"
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 transition-all duration-200 font-manrope text-sm font-medium ${
                isActive
                  ? 'bg-orange-50 text-orange-600 rounded-lg'
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
