'use client';

import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/state/store';
import { setActiveRole } from '@/state/authSlice';
import { Card } from '@/components/ui/Card';
import { Role } from '@/types/api';
import { useRouter } from 'next/navigation';

const getRoleIcon = (role: Role) => {
  switch (role) {
    case 'DOCTOR': return 'medical_services';
    case 'NURSE': return 'vital_signs';
    case 'PHARMACIST': return 'prescriptions';
    case 'RECEPTIONIST': return 'person_search';
    case 'ADMIN': return 'admin_panel_settings';
    case 'SUPER_ADMIN': return 'shield_person';
    default: return 'person';
  }
};

const SelectRolePage = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const user = useSelector((state: RootState) => state.auth.user);

  const handleSelect = (role: Role) => {
    dispatch(setActiveRole(role));
    
    // Explicitly redirect to avoid AuthProvider timing issues
    const rolePathMap: Record<string, string> = {
      'RECEPTIONIST': 'reception',
      'DOCTOR': 'doctor',
      'PHARMACIST': 'pharmacy',
      'ADMIN': 'admin',
      'SUPER_ADMIN': 'super_admin',
      'NURSE': 'nurse'
    };
    const path = rolePathMap[role] || role.toLowerCase();
    router.push(`/${path}/dashboard`);
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <h1 className="text-3xl font-black text-[var(--text-primary)] mb-2 text-center">Select Your Role</h1>
        <p className="text-[var(--text-secondary)] mb-10 text-center">You have multiple roles assigned to this hospital</p>
        
        <div className="flex flex-wrap justify-center gap-6">
          {(user?.roles || []).map((role) => (
            <div
              key={role}
              onClick={() => handleSelect(role)}
              className="cursor-pointer group w-full sm:w-64"
            >
              <Card className="hover:border-[var(--primary)] transition-all h-full hover:shadow-xl active:scale-95">
                <div className="flex flex-col items-center text-center p-8">
                  <div className="w-20 h-20 rounded-2xl bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center mb-4 group-hover:bg-[var(--primary)] group-hover:text-white transition-all duration-300">
                    <span className="material-symbols-outlined text-4xl">{getRoleIcon(role)}</span>
                  </div>
                  <h3 className="text-lg font-black text-[var(--text-primary)] uppercase tracking-tight">{role}</h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-2 font-bold opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest">Select to Continue</p>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SelectRolePage;
