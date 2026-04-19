'use client';

import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/state/store';
import { setActiveRole } from '@/state/authSlice';
import { Card } from '@/components/ui/Card';
import { Role } from '@/types/api';

const SelectRolePage = () => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);

  const handleSelect = (role: Role) => {
    dispatch(setActiveRole(role));
  };

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

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl font-black text-[var(--text-primary)] mb-2 text-center">Select Your Role</h1>
        <p className="text-[var(--text-secondary)] mb-8 text-center">You have multiple roles assigned to this hospital</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {user?.roles.map((role) => (
            <div 
              key={role}
              onClick={() => handleSelect(role)}
              className="cursor-pointer group"
            >
              <Card className="hover:border-[var(--primary)] transition-all h-full">
                <div className="flex flex-col items-center text-center p-4">
                  <div className="w-14 h-14 rounded-full bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-2xl">{getRoleIcon(role)}</span>
                  </div>
                  <h3 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-tight">{role}</h3>
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
