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
      roles: ['RECEPTIONIST', 'DOCTOR', 'PHARMACIST', 'ADMIN', 'SUPER_ADMIN', 'NURSE', 'LAB_ADMIN'] 
    },
    { 
      name: effectiveRole === 'DOCTOR' ? 'Queue' : 'Patients', 
      icon: 'group', 
      href: effectiveRole === 'DOCTOR' ? '/doctor/patient-queue' : '/reception/patients', 
      roles: ['RECEPTIONIST', 'DOCTOR', 'ADMIN'] 
    },
    { name: 'Doctors', icon: 'medical_services', href: '/reception/doctors', roles: ['RECEPTIONIST', 'ADMIN'] },
    {
      name: 'IPD',
      icon: 'hotel',
      href: '/ipd/dashboard',
      // IPD content also available for RECEPTIONIST via Dashboard > IPD tab
      roles: ['ADMIN', 'NURSE']
    },
    { name: 'Appointments', icon: 'calendar_today', href: '/reception/appointments', roles: [] }, 
    { name: 'Token Queue', icon: 'confirmation_number', href: '/reception/queue', roles: ['RECEPTIONIST'] },
    
    // Lab Specific Routes
    { name: 'Walk-in Registration', icon: 'person_add', href: '/lab_admin/walkin', roles: ['LAB_ADMIN'] },
    { name: 'Lab Queue', icon: 'biotech', href: '/lab_admin/queue', roles: ['LAB_ADMIN', 'PATHOLOGIST'] },
    { name: 'Lab Reports', icon: 'description', href: '/lab_admin/reports', roles: ['LAB_ADMIN', 'PATHOLOGIST'] },
    { name: 'Lab Inventory', icon: 'inventory', href: '/lab_admin/inventory', roles: ['LAB_ADMIN'] },
    { name: 'Lab Packages', icon: 'package', href: '/lab_admin/packages', roles: ['LAB_ADMIN', 'ADMIN'] },
    { name: 'Lab Machines', icon: 'precision_manufacturing', href: '/lab_admin/machines', roles: ['LAB_ADMIN', 'ADMIN'] },
    { name: 'Lab Dashboard', icon: 'science', href: '/admin/lab-dashboard', roles: ['ADMIN'] },
    { name: 'Lab Settings', icon: 'settings_b_roll', href: '/admin/lab-settings', roles: ['ADMIN'] },

    {
      name: 'History',
      icon: 'history_edu',
      href: '/doctor/history',
      roles: ['DOCTOR', 'ADMIN']
    },
    { name: 'Prescriptions', icon: 'prescriptions', href: effectiveRole === 'PHARMACIST' ? '/pharmacy/prescriptions' : '/doctor/prescriptions', roles: ['PHARMACIST', 'ADMIN'] },
    { name: 'Pharmacy Billing', icon: 'point_of_sale', href: '/pharmacy/sales', roles: ['PHARMACIST', 'ADMIN'] },
    { name: 'Billing History', icon: 'history', href: '/pharmacy/billing-history', roles: ['PHARMACIST', 'ADMIN'] },
    { name: 'Medicine Master', icon: 'medication', href: '/admin/medicines', roles: ['ADMIN', 'SUPER_ADMIN'] },
    { name: 'Consumable Master', icon: 'inventory_2', href: '/super_admin/consumables', roles: ['SUPER_ADMIN'] },
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
