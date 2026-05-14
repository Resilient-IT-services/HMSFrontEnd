import React from 'react';
import { Section } from '@/components/ui/Section';
import { FormField } from '@/components/ui/FormField';

interface UserFormProfileTabProps {
  formData: any;
  setFormData: (data: any) => void;
  assignedRoles: string[];
  validationErrors: Record<string, string>;
}

export const UserFormProfileTab: React.FC<UserFormProfileTabProps> = ({ 
  formData, 
  setFormData,
  assignedRoles,
  validationErrors
}) => {
  const onChange = (data: any) => {
    setFormData((prev: any) => ({ ...prev, ...data }));
  };

  return (
    <div className="space-y-6">
      <Section title="Basic Identity">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField label="Full Name" required error={validationErrors.fullName}>
            <input
              type="text"
              className="form-input"
              value={formData.fullName || ''}
              onChange={(e) => onChange({ fullName: e.target.value })}
              placeholder="e.g. Dr. John Doe"
            />
          </FormField>
          <FormField label="Username" required error={validationErrors.username}>
            <input
              type="text"
              className="form-input"
              value={formData.username || ''}
              onChange={(e) => onChange({ username: e.target.value })}
              placeholder="johndoe"
              disabled={!!formData.id}
            />
          </FormField>
          <FormField label="Email Address" required error={validationErrors.email}>
            <input
              type="email"
              className="form-input"
              value={formData.email || ''}
              onChange={(e) => onChange({ email: e.target.value })}
              placeholder="john@hospital.com"
            />
          </FormField>
          <FormField label="Phone Number" required error={validationErrors.phone}>
            <input
              type="tel"
              className="form-input"
              value={formData.phone || ''}
              onChange={(e) => onChange({ phone: e.target.value })}
              placeholder="+91 9876543210"
            />
          </FormField>
          <FormField label="Gender" required error={validationErrors.gender}>
            <select
              className="form-select"
              value={formData.gender || 'MALE'}
              onChange={(e) => onChange({ gender: e.target.value as any })}
            >
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </FormField>
          <FormField label="Date of Birth" required error={validationErrors.dob}>
            <input
              type="date"
              className="form-input"
              value={formData.dob || ''}
              onChange={(e) => onChange({ dob: e.target.value })}
            />
          </FormField>
        </div>
      </Section>

      <Section title="Account Security">
        <div className="flex items-start gap-4 p-4 bg-orange-50 rounded-xl border border-orange-100">
          <input
            type="checkbox"
            id="superuser"
            className="mt-1"
            checked={formData.superuser || false}
            onChange={(e) => onChange({ superuser: e.target.checked })}
          />
          <div>
            <label htmlFor="superuser" className="text-sm font-bold text-orange-900 block">Grant Super Administrator Privileges</label>
            <p className="text-[10px] text-orange-700 font-medium">WARNING: Super admins have unrestricted access to all hospitals and system configurations.</p>
          </div>
        </div>
      </Section>

      {formData.receptionistInfo && assignedRoles.includes('RECEPTIONIST') && (
        <Section title="Reception Settings">
          <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <input
              type="checkbox"
              id="insurance"
              className="mt-1"
              checked={formData.receptionistInfo.insuranceSpecialist || false}
              onChange={(e) => onChange({ 
                receptionistInfo: { ...formData.receptionistInfo!, insuranceSpecialist: e.target.checked } 
              })}
            />
            <div>
              <label htmlFor="insurance" className="text-sm font-bold text-slate-800 block">Insurance Specialist</label>
              <p className="text-[10px] text-gray-500">Check if user is trained in medical insurance processing.</p>
            </div>
          </div>
        </Section>
      )}
    </div>
  );
};
