'use client';

import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/state/store';
import { setActiveRole, setCurrentHospitalId } from '@/state/authSlice';
import { Role } from '@/types/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const roleDisplayData: Record<string, { icon: string, title: string, description: string }> = {
  'DOCTOR': {
    icon: 'stethoscope',
    title: 'Doctor',
    description: 'Patient diagnosis, prescriptions, and clinical rounds.'
  },
  'ADMIN': {
    icon: 'admin_panel_settings',
    title: 'Administrator',
    description: 'Facility oversight, staffing schedules, and system logs.'
  },
  'RECEPTIONIST': {
    icon: 'desk',
    title: 'Receptionist',
    description: 'Patient registration, appointment booking, and triage.'
  },
  'PHARMACIST': {
    icon: 'prescriptions',
    title: 'Pharmacist',
    description: 'Medication dispensing, inventory management, and pharmaceutical care.'
  },
  'NURSE': {
    icon: 'vital_signs',
    title: 'Nurse',
    description: 'Patient care, vitals monitoring, and treatment administration.'
  },
  'LAB_TECHNICIAN': {
    icon: 'biotech',
    title: 'Lab Technician',
    description: 'Laboratory tests, sample analysis, and diagnostic reporting.'
  },
  'SUPER_ADMIN': {
    icon: 'shield_person',
    title: 'Super Admin',
    description: 'System-wide configuration, multi-facility oversight, and security.'
  }
};

const SelectRolePage = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const user = useSelector((state: RootState) => state.auth.user);
  const currentHospitalId = user?.currentHospitalId;

  // Fallback to the first membership if currentHospitalId is not set but they only have one hospital
  const currentHospital = user?.memberships.find(m => m.hospitalId === currentHospitalId) 
    || (user?.memberships.length === 1 ? user.memberships[0] : null);

  const handleSelect = (role: Role) => {
    dispatch(setActiveRole(role));
    
    const rolePathMap: Record<string, string> = {
      'RECEPTIONIST': 'reception',
      'DOCTOR': 'doctor',
      'PHARMACIST': 'pharmacy',
      'ADMIN': 'admin',
      'SUPER_ADMIN': 'super_admin',
      'NURSE': 'nurse'
    };
    const path = rolePathMap[role] || role.toLowerCase();
    const targetPath = `/${path}/dashboard`;
    router.push(targetPath);
  };

  const handleSwitchHospital = () => {
    dispatch(setCurrentHospitalId(null));
  };

  return (
    <div className="bg-background font-body-md text-on-background min-h-screen flex flex-col antialiased">
      <style dangerouslySetInnerHTML={{ __html: `
        .role-card:hover .icon-container {
            background-color: #ffdbce;
            color: #a83900;
        }
      `}} />

      <header className="flex justify-between items-center px-8 py-4 w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-4">
          <span className="text-xl font-extrabold tracking-tight text-gray-900 dark:text-white font-headline-md">MedCore Management</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-gray-500">help</span>
            <span className="font-label-md text-gray-500">Help</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-gray-500">settings</span>
          </div>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center p-gutter">
        <div className="max-w-4xl w-full flex flex-col gap-section-gap items-center">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface-container rounded-full mb-4">
              <span className="material-symbols-outlined text-sm text-secondary">local_hospital</span>
              <span className="font-label-sm text-secondary">{currentHospital?.hospitalName || 'Selected Facility'}</span>
            </div>
            <h1 className="font-headline-xl text-on-background mb-2">Select Your Role</h1>
            <p className="font-body-lg text-tertiary max-w-md mx-auto">Choose a profile to continue your session for the selected facility.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
            {(user?.roles || []).map((role) => {
              const display = roleDisplayData[role] || {
                icon: 'person',
                title: role,
                description: 'Access assigned department functions and tools.'
              };
              
              return (
                <button 
                  key={role}
                  onClick={() => handleSelect(role)}
                  className="role-card group relative bg-surface-container-lowest border border-outline-variant p-8 rounded-xl flex flex-col items-center text-center transition-all duration-300 hover:shadow-lg hover:border-primary-container"
                >
                  <div className="icon-container w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center mb-6 transition-colors duration-300">
                    <span className="material-symbols-outlined text-3xl">{display.icon}</span>
                  </div>
                  <span className="font-headline-md text-on-surface mb-2">{display.title}</span>
                  <p className="font-body-sm text-tertiary mb-6">{display.description}</p>
                  <div className="mt-auto inline-flex items-center gap-2 text-primary font-label-md group-hover:gap-3 transition-all">
                    <span>Select Role</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </div>
                </button>
              );
            })}
          </div>

          {user?.memberships && user.memberships.length > 1 && (
            <button 
              onClick={handleSwitchHospital}
              className="mt-base flex items-center gap-2 text-secondary font-label-md hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-lg">swap_horiz</span>
              <span>Change Hospital Facility</span>
            </button>
          )}
        </div>
      </main>

      <div className="fixed bottom-0 right-0 p-gutter -z-10 opacity-10 pointer-events-none">
        <span className="material-symbols-outlined text-[300px]" style={{ fontVariationSettings: "'wght' 100" }}>vital_signs</span>
      </div>

      <footer className="flex justify-between items-center px-8 py-4 w-full bg-gray-50 dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800">
        <p className="font-manrope text-xs text-gray-500">© 2024 MedCore Health Systems. Clinical Accuracy Priority.</p>
        <div className="flex gap-6">
          <Link className="font-manrope text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white underline-offset-4 hover:underline" href="#">Privacy Policy</Link>
          <Link className="font-manrope text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white underline-offset-4 hover:underline" href="#">Support</Link>
          <Link className="font-manrope text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white underline-offset-4 hover:underline" href="#">Security Standards</Link>
        </div>
      </footer>
    </div>
  );
};

export default SelectRolePage;
