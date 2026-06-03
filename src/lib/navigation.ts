import { ROLE_PATH_MAP } from '@/utils/constants';

export interface MenuItem {
  name: string;
  icon: string;
  href: string;
  roles: string[];
}

export const getMenuItems = (effectiveRole: string | null): MenuItem[] => {
  const dashboardPath = effectiveRole ? (ROLE_PATH_MAP[effectiveRole] || effectiveRole.toLowerCase()) : 'unauthorized';

  return [
    { 
      name: 'Dashboard', 
      icon: effectiveRole === 'RECEPTIONIST' ? 'calendar_today' : 'dashboard', 
      href: `/${dashboardPath}/dashboard`, 
      roles: ['RECEPTIONIST', 'DOCTOR', 'PHARMACIST', 'ADMIN', 'SUPER_ADMIN', 'NURSE'] 
    },
    { 
      name: effectiveRole === 'DOCTOR' ? 'Queue' : 'Patients', 
      icon: 'group', 
      href: effectiveRole === 'DOCTOR' ? '/doctor/patient-queue' : '/reception/patients', 
      roles: ['RECEPTIONIST', 'DOCTOR', 'ADMIN'] 
    },
    { name: 'Doctors', icon: 'medical_services', href: '/reception/doctors', roles: ['RECEPTIONIST', 'ADMIN'] },
    { name: 'Appointments', icon: 'calendar_today', href: '/reception/appointments', roles: ['ADMIN'] },
    { name: 'Token Queue', icon: 'confirmation_number', href: '/reception/queue', roles: ['RECEPTIONIST', 'ADMIN'] },
    { name: 'Lab Queue', icon: 'biotech', href: '/lab/queue', roles: ['LAB_TECHNICIAN', 'ADMIN'] },
    {
      name: 'History',
      icon: 'history_edu',
      href: '/doctor/history',
      roles: ['DOCTOR', 'ADMIN']
    },
    { name: 'Prescriptions', icon: 'prescriptions', href: effectiveRole === 'PHARMACIST' ? '/pharmacy/prescriptions' : '/doctor/prescriptions', roles: ['PHARMACIST', 'ADMIN'] },
    { name: 'Pharmacy Billing', icon: 'point_of_sale', href: '/pharmacy/sales', roles: ['PHARMACIST', 'ADMIN'] },
    { name: 'Medicine Master', icon: 'medication', href: '/admin/medicines', roles: ['ADMIN', 'SUPER_ADMIN'] },
    { name: 'Laboratory Master', icon: 'biotech', href: '/settings/lab/tests', roles: ['ADMIN', 'SUPER_ADMIN'] },
    { name: 'Inventory', icon: 'inventory_2', href: '/pharmacy/stock', roles: ['PHARMACIST', 'ADMIN'] },
    { name: 'Users', icon: 'person', href: '/admin/users', roles: ['ADMIN', 'SUPER_ADMIN'] },
    { name: 'Hospitals', icon: 'apartment', href: '/super_admin/hospitals', roles: ['SUPER_ADMIN'] },
    { name: 'Reports', icon: 'query_stats', href: '/super_admin/reports', roles: ['SUPER_ADMIN'] },
    { name: 'Earnings', icon: 'payments', href: '/doctor/earnings', roles: ['DOCTOR'] },
    { name: 'Settings', icon: 'settings', href: '/settings', roles: ['ADMIN', 'SUPER_ADMIN'] },
  ];
};

export const getFilteredMenuItems = (effectiveRole: string | null): MenuItem[] => {
  const allItems = getMenuItems(effectiveRole);
  return allItems.filter(item => 
    effectiveRole && item.roles.includes(effectiveRole)
  );
};
