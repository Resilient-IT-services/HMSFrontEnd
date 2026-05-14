'use client';

import React from 'react';
import { UserRequestDTO } from '@/types/api';

import { Section } from '@/components/ui/Section';

interface UserFormPersonalTabProps {
  formData: UserRequestDTO;
  setFormData: (data: UserRequestDTO) => void;
  isEdit?: boolean;
  validationErrors: Record<string, string>;
}

export const UserFormPersonalTab: React.FC<UserFormPersonalTabProps> = ({
  formData,
  setFormData,
  isEdit,
  validationErrors
}) => {
  const renderFieldError = (field: string) => {
    if (validationErrors[field]) {
      return <p className="text-red-500 text-[10px] font-bold mt-1 uppercase tracking-tight">{validationErrors[field]}</p>;
    }
    return null;
  };

  return (
    <div className="space-y-12">
      <Section title="Global Identity" icon="person" iconVariant="slate">
        <div className="flex flex-col gap-1.5">
          <label className="font-label-sm text-gray-700 uppercase">Full Name <span className="text-orange-600">*</span></label>
          <input 
            className={`form-input ${validationErrors.fullName ? 'border-red-500 ring-1 ring-red-500/20' : ''}`}
            type="text" 
            placeholder="e.g. John Doe"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
          />
          {renderFieldError('fullName')}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="font-label-sm text-gray-700 uppercase">Username <span className="text-orange-600">*</span></label>
          <input 
            className={`form-input ${validationErrors.username ? 'border-red-500 ring-1 ring-red-500/20' : ''}`}
            type="text" 
            placeholder="e.g. jdoe_01"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            disabled={isEdit}
          />
          {renderFieldError('username')}
        </div>
        {!isEdit && (
          <div className="flex flex-col gap-1.5">
            <label className="font-label-sm text-gray-700 uppercase">Password <span className="text-orange-600">*</span></label>
            <input 
              className={`form-input ${validationErrors.password ? 'border-red-500 ring-1 ring-red-500/20' : ''}`}
              type="password" 
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
            {renderFieldError('password')}
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <label className="font-label-sm text-gray-700 uppercase">Email Address <span className="text-orange-600">*</span></label>
          <input 
            className={`form-input ${validationErrors.email ? 'border-red-500' : ''}`} 
            type="email" 
            placeholder="johndoe@example.com"
            value={formData.email} 
            onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
          />
          {renderFieldError('email')}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="font-label-sm text-gray-700 uppercase">Primary Phone <span className="text-orange-600">*</span></label>
          <input 
            className={`form-input ${validationErrors.phone ? 'border-red-500' : ''}`} 
            type="tel" 
            placeholder="+91 98765 43210"
            value={formData.phone} 
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
          />
          {renderFieldError('phone')}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="font-label-sm text-gray-700 uppercase">Date of Birth <span className="text-orange-600">*</span></label>
          <input 
            className={`form-input ${validationErrors.dob ? 'border-red-500 ring-1 ring-red-500/20' : ''}`}
            type="date" 
            value={formData.dob}
            onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
          />
          {renderFieldError('dob')}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="font-label-sm text-gray-700 uppercase">Gender Identity</label>
          <select className="form-input" value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5 md:col-span-2">
          <label className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
            <input 
              type="checkbox" 
              className="w-5 h-5 accent-emerald-500"
              checked={formData.active}
              onChange={(e) => {
                const isActive = e.target.checked;
                setFormData({ ...formData, active: isActive, status: isActive ? 'ACTIVE' : 'INACTIVE' });
              }}
            />
            <div>
              <p className="font-bold text-sm text-on-surface">Account Status: {formData.active ? 'Active' : 'Inactive'}</p>
              <p className="text-xs text-gray-500">Toggle to enable or disable this user's access to the system.</p>
            </div>
          </label>
        </div>
        <div className="flex flex-col gap-1.5 md:col-span-2">
          <label className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
            <input 
              type="checkbox" 
              className="w-5 h-5 accent-orange-600"
              checked={formData.superuser}
              onChange={(e) => setFormData({ ...formData, superuser: e.target.checked })}
            />
            <div>
              <p className="font-bold text-sm text-on-surface">System Administrator Privileges</p>
              <p className="text-xs text-gray-500">Grant this user full access to global system settings across all hospitals.</p>
            </div>
          </label>
        </div>
      </Section>
    </div>
  );
};
