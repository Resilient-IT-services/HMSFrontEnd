'use client';

import React from 'react';
import { UserRequestDTO } from '@/types/api';

import { Section } from '@/components/ui/Section';
import { MobileSelector } from '@/components/ui/MobileSelector';

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
    <div className="space-y-6 md:space-y-12">
      <Section title="Personal Info" icon="person" iconVariant="orange">
        <div className="space-y-4 md:space-y-0 md:contents">
          <div className="flex flex-col">
            <label className="block text-sm font-medium text-slate-600 mb-1.5 ml-1">Full Name <span className="text-orange-600">*</span></label>
            <input 
              className={`form-input ${validationErrors.fullName ? 'border-red-500 ring-1 ring-red-500/10' : ''}`}
              type="text" 
              placeholder="e.g. John Doe"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            />
            {renderFieldError('fullName')}
          </div>
          <div className="flex flex-col">
            <label className="block text-sm font-medium text-slate-600 mb-1.5 ml-1">Username <span className="text-orange-600">*</span></label>
            <input 
              className={`form-input ${validationErrors.username ? 'border-red-500 ring-1 ring-red-500/10' : ''}`}
              type="text" 
              placeholder="e.g. jdoe_01"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              disabled={isEdit}
            />
            {renderFieldError('username')}
          </div>
          {!isEdit && (
            <div className="flex flex-col">
              <label className="block text-sm font-medium text-slate-600 mb-1.5 ml-1">Password <span className="text-orange-600">*</span></label>
              <input 
                className={`form-input ${validationErrors.password ? 'border-red-500 ring-1 ring-red-500/10' : ''}`}
                type="password" 
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              {renderFieldError('password')}
            </div>
          )}
          <div className="flex flex-col">
            <label className="block text-sm font-medium text-slate-600 mb-1.5 ml-1">Email Address <span className="text-orange-600">*</span></label>
            <input 
              className={`form-input ${validationErrors.email ? 'border-red-500 ring-1 ring-red-500/10' : ''}`} 
              type="email" 
              placeholder="johndoe@example.com"
              value={formData.email} 
              onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
            />
            {renderFieldError('email')}
          </div>
          <div className="flex flex-col">
            <label className="block text-sm font-medium text-slate-600 mb-1.5 ml-1">Primary Phone <span className="text-orange-600">*</span></label>
            <input 
              className={`form-input ${validationErrors.phone ? 'border-red-500 ring-1 ring-red-500/10' : ''}`} 
              type="tel" 
              placeholder="+91 98765 43210"
              value={formData.phone} 
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
            />
            {renderFieldError('phone')}
          </div>
          <div className="flex flex-col">
            <label className="block text-sm font-medium text-slate-600 mb-1.5 ml-1">Date of Birth <span className="text-orange-600">*</span></label>
            <input 
              className={`form-input ${validationErrors.dob ? 'border-red-500 ring-1 ring-red-500/10' : ''}`}
              type="date" 
              value={formData.dob}
              onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
            />
            {renderFieldError('dob')}
          </div>
          <div className="flex flex-col">
            <label className="block text-sm font-medium text-slate-600 mb-1.5 ml-1">Gender Identity</label>
            <MobileSelector
              label="Gender"
              options={[
                { id: 'MALE', name: 'Male', icon: 'male' },
                { id: 'FEMALE', name: 'Female', icon: 'female' },
                { id: 'OTHER', name: 'Other', icon: 'transgender' }
              ]}
              value={formData.gender || ''}
              onChange={(val) => setFormData({ ...formData, gender: val as any })}
              placeholder="Select Gender..."
            />
          </div>
          <div className="md:col-span-2 space-y-3">
            <label className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 bg-surface active:bg-orange-50 transition-colors cursor-pointer">
              <input 
                type="checkbox" 
                className="w-5 h-5 text-primary-container border-slate-200 focus:ring-primary-container rounded"
                checked={formData.active}
                onChange={(e) => {
                  const isActive = e.target.checked;
                  setFormData({ ...formData, active: isActive, status: isActive ? 'ACTIVE' : 'INACTIVE' });
                }}
              />
              <div className="flex flex-col">
                <p className="text-sm font-bold text-on-surface">Account Status: {formData.active ? 'Active' : 'Inactive'}</p>
                <p className="text-[11px] text-secondary">Toggle to enable or disable system access.</p>
              </div>
            </label>
            <label className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 bg-surface active:bg-orange-50 transition-colors cursor-pointer">
              <input 
                type="checkbox" 
                className="w-5 h-5 text-primary-container border-slate-200 focus:ring-primary-container rounded"
                checked={formData.superuser}
                onChange={(e) => setFormData({ ...formData, superuser: e.target.checked })}
              />
              <div className="flex flex-col">
                <p className="text-sm font-bold text-on-surface">System Administrator Privileges</p>
                <p className="text-[11px] text-secondary">Grant full access to global settings across all hospitals.</p>
              </div>
            </label>
          </div>
        </div>
      </Section>
    </div>
  );
};
