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
  }>({ hospitalId: null, roles: [] });

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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Allocate Roles: ${selectedUser?.username}`}
    >
      <form onSubmit={handleAllocateRoles} className="p-6 space-y-4">
        <FormField label="Target Hospital" required>
          <select
            className="form-input"
            value={allocation.hospitalId || ''}
            onChange={(e) => {
              const val = e.target.value;
              const hospId = val === '' ? null : Number.parseInt(val);

              // Pre-fill existing roles if any
              const existing = selectedUser?.memberships?.find(m => m.hospitalId === hospId);
              setAllocation({
                hospitalId: hospId,
                roles: existing ? existing.roles : []
              });
            }}
          >
            <option value="">System Level (Global)</option>
            {hospitals.map(h => (
              <option key={h.id} value={h.id}>{h.name} ({h.code})</option>
            ))}
          </select>
        </FormField>

        <FormField label="Assigned Roles" required>
          <p className="text-[10px] text-[var(--text-secondary)] mb-2 uppercase font-bold tracking-wider">
            Select roles for {allocation.hospitalId ? 'this hospital' : 'system level'}
          </p>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {roleOptions.map(role => (
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
        </FormField>

        <div className="pt-4 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 py-3 text-sm font-bold text-[var(--text-secondary)] hover:bg-[var(--background)] rounded-xl transition-all">Cancel</button>
          <button type="submit" className="flex-1 btn-primary">Save Allocation</button>
        </div>
      </form>
    </Modal>
  );
};
