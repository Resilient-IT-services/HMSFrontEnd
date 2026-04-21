'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/ui/FormField';
import apiClient from '@/services/apiClient';
import { ApiResponse, UserResponse, Role, HospitalResponse } from '@/types/api';

interface RoleAllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedUser: UserResponse | null;
  hospitals: HospitalResponse[];
  roleOptions: Role[];
}

export const RoleAllocationModal: React.FC<RoleAllocationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  selectedUser,
  hospitals,
  roleOptions,
}) => {
  const [allocation, setAllocation] = useState<{
    hospitalId: number | null;
    roles: Role[];
  }>(() => {
    if (selectedUser?.memberships && selectedUser.memberships.length > 0) {
      return {
        hospitalId: selectedUser.memberships[0].hospitalId,
        roles: selectedUser.memberships[0].roles
      };
    }
    return { hospitalId: null, roles: [] };
  });

  const handleAllocateRoles = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      const response = await apiClient.post<ApiResponse<UserResponse>>('/users/allocate', {
        userId: selectedUser.id,
        hospitalId: allocation.hospitalId,
        roles: allocation.roles
      });
      if (response.data.success) {
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Failed to allocate roles', error);
    }
  };

  const handleAllocationRoleToggle = (role: Role) => {
    setAllocation(prev => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role]
    }));
  };

  const hasAccess = (hospId: number | null) => {
    return selectedUser?.memberships?.some(m => m.hospitalId === hospId);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Allocate Roles: ${selectedUser?.username}`}
    >
      <form onSubmit={handleAllocateRoles} className="p-6 space-y-4">
        <FormField label="Target Context" required>
          <select
            className="form-input"
            value={allocation.hospitalId === null ? 'GLOBAL' : allocation.hospitalId}
            onChange={(e) => {
              const val = e.target.value;
              const hospId = val === 'GLOBAL' ? null : Number.parseInt(val);

              // Pre-fill existing roles if any
              const existing = selectedUser?.memberships?.find(m => m.hospitalId === hospId);
              setAllocation({
                hospitalId: hospId,
                roles: existing ? existing.roles : []
              });
            }}
          >
            <optgroup label="System Wide">
              <option 
                value="GLOBAL" 
                style={{ backgroundColor: hasAccess(null) ? 'var(--success-light)' : 'transparent' }}
              >
                {hasAccess(null) ? '✓ ' : ''}System Level (Global)
              </option>
            </optgroup>
            <optgroup label="Real Business Hospitals">
              {hospitals.map(h => {
                const active = hasAccess(h.id);
                return (
                  <option 
                    key={h.id} 
                    value={h.id}
                    style={{ backgroundColor: active ? 'var(--success-light)' : 'transparent' }}
                  >
                    {active ? '✓ ' : ''}{h.name} ({h.code})
                  </option>
                );
              })}
            </optgroup>
          </select>
          <p className="text-[10px] text-[var(--text-secondary)] mt-1">
            <span className="inline-block w-2 h-2 rounded-full bg-[var(--success-light)] mr-1"></span>
            Hospitals marked with ✓ already have assigned roles.
          </p>
        </FormField>

        <FormField label="Assigned Roles" required>
          <p className="text-[10px] text-[var(--text-secondary)] mb-2 uppercase font-bold tracking-wider">
            {allocation.hospitalId === null 
              ? 'Select Global System Roles' 
              : `Select roles for ${hospitals.find(h => h.id === allocation.hospitalId)?.name}`}
          </p>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {roleOptions
              .filter(role => {
                if (allocation.hospitalId === null) return role === 'SUPER_ADMIN';
                return role !== 'SUPER_ADMIN';
              })
              .map(role => (
                <label key={role} className="flex items-center gap-2 p-2 rounded-lg border border-[var(--border)] hover:bg-[var(--background)] cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={allocation.roles.includes(role)}
                    onChange={() => handleAllocationRoleToggle(role)}
                    className="accent-[var(--primary)]"
                  />
                  <span className="text-xs font-bold text-[var(--text-primary)]">{role}</span>
                </label>
              ))}
          </div>
          {allocation.hospitalId === null && (
            <p className="text-[10px] text-[var(--info)] mt-2 italic">
              Only Super Admin roles can be assigned at the System Level.
            </p>
          )}
        </FormField>

        <div className="pt-4 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 py-3 text-sm font-bold text-[var(--text-secondary)] hover:bg-[var(--background)] rounded-xl transition-all">Cancel</button>
          <button type="submit" className="flex-1 btn-primary">Save Allocation</button>
        </div>
      </form>
    </Modal>
  );
};
