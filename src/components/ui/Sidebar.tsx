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
    { name: 'Patients', icon: 'group', href: '/reception/patients', roles: ['RECEPTIONIST', 'DOCTOR', 'ADMIN'] },
    { name: 'Doctors', icon: 'medical_services', href: '/reception/doctors', roles: ['RECEPTIONIST', 'DOCTOR', 'ADMIN'] },
    { name: 'Appointments', icon: 'calendar_today', href: '/reception/appointments', roles: ['RECEPTIONIST', 'ADMIN'] },
    { name: 'Token Queue', icon: 'queue', href: '/reception/queue', roles: ['RECEPTIONIST', 'DOCTOR', 'ADMIN'] },
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
    <aside className="hidden lg:flex w-64 flex-col border-r border-gray-200 bg-white p-4 gap-2 h-screen sticky top-0">
      <div className="mb-8 px-2">
        <h1 className="text-lg font-extrabold text-gray-900 leading-tight">VitalSync HMS</h1>
        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Admin Console</p>
      </div>

      <div className="px-2 mb-4">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Main Menu</p>
      </div>

      <nav className="flex-1 space-y-1">
        {filteredMenuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 font-manrope text-sm font-medium ${
                isActive
                  ? 'bg-orange-50 text-orange-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className={`material-symbols-outlined ${isActive ? 'active-state' : ''}`} style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>
                {item.icon}
              </span>
              {item.name}
            </Link>
          );
        })}
      </nav>
      
      <div className="mt-auto flex flex-col gap-1 pt-4 border-t border-gray-100">
        <a className="flex items-center gap-3 px-3 py-2.5 text-gray-600 hover:bg-gray-50 transition-all font-manrope text-sm font-medium cursor-pointer">
          <span className="material-symbols-outlined">help</span>
          Support
        </a>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 text-gray-600 hover:bg-gray-50 transition-all font-manrope text-sm font-medium w-full text-left"
        >
          <span className="material-symbols-outlined">logout</span>
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
