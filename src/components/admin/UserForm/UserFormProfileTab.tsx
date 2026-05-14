'use client';

import React from 'react';
import { UserRequestDTO } from '@/types/api';

interface UserFormProfileTabProps {
  formData: UserRequestDTO;
  setFormData: (data: UserRequestDTO) => void;
  assignedRoles: string[];
  validationErrors: Record<string, string>;
}

export const UserFormProfileTab: React.FC<UserFormProfileTabProps> = ({
  formData,
  setFormData,
  assignedRoles,
  validationErrors
}) => {
  const renderFieldError = (field: string) => {
    if (validationErrors[field]) {
      return <p className="text-red-500 text-[10px] font-bold mt-1 uppercase tracking-tight">{validationErrors[field]}</p>;
    }
    return null;
  };

  return (
    <div className="space-y-8 md:space-y-12">
      {/* 1. Dynamic Role-Based Inputs */}
      <div className="space-y-4 md:space-y-6">
        <div className="flex items-center gap-2 mb-4 md:mb-6 border-b border-gray-100 pb-4">
          <h3 className="font-headline-sm text-on-surface uppercase tracking-wide text-[10px] md:text-xs font-black">Professional Credentials</h3>
        </div>

        {assignedRoles.length === 0 && !formData.superuser && (
            <div className="p-6 md:p-8 bg-gray-50 border border-dashed border-gray-200 rounded-2xl text-center">
                <p className="text-xs md:text-sm text-gray-500 font-bold italic">No specific professional roles assigned yet.</p>
            </div>
        )}

        {assignedRoles.includes('DOCTOR') && formData.doctorInfo && (
          <div className={`bg-white border border-gray-200 rounded-xl p-4 md:p-6 space-y-4 shadow-sm ${validationErrors.specialization ? 'ring-2 ring-error/50' : ''}`}>
            <div className="flex items-center gap-3 border-b border-gray-50 pb-3">
              <span className="material-symbols-outlined text-primary text-xl">stethoscope</span>
              <h4 className="text-[10px] font-black text-on-surface uppercase tracking-widest">Doctor Profile Details</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              <div className="flex flex-col gap-1.5">
                <label className="font-label-sm text-gray-700 uppercase">Specialization <span className="text-primary">*</span></label>
                <input
                    className={`form-input ${validationErrors.specialization ? 'border-error' : ''}`}
                    type="text"
                    placeholder="e.g. Cardiologist, Orthopedic..."
                    value={formData.doctorInfo.specialization}
                    onChange={(e) => setFormData({ ...formData, doctorInfo: { ...formData.doctorInfo!, specialization: e.target.value } })}
                />
                {renderFieldError('specialization')}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-label-sm text-gray-700 uppercase">License Number</label>
                <input
                    className="form-input"
                    type="text"
                    placeholder="e.g. MED-12345678"
                    value={formData.doctorInfo.licenseNumber}
                    onChange={(e) => setFormData({ ...formData, doctorInfo: { ...formData.doctorInfo!, licenseNumber: e.target.value } })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-label-sm text-gray-700 uppercase">Years of Experience</label>
                <input
                    className="form-input"
                    type="number"
                    placeholder="e.g. 10"
                    value={formData.doctorInfo.bio ? formData.doctorInfo.bio.match(/Exp: (\d+)/)?.[1] || '' : ''}
                    onChange={(e) => setFormData({ ...formData, doctorInfo: { ...formData.doctorInfo!, bio: `Exp: ${e.target.value} years` } })}
                />
              </div>
            </div>
          </div>
        )}

        {assignedRoles.includes('NURSE') && formData.nurseInfo && (
          <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-3 border-b border-gray-50 pb-3">
              <span className="material-symbols-outlined text-blue-600 text-xl">medical_services</span>
              <h4 className="text-[10px] font-black text-on-surface uppercase tracking-widest">Nursing Credentials</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="flex flex-col gap-1.5">
                    <label className="font-label-sm text-gray-700 uppercase">Certification Level</label>
                    <select className="form-input" value={formData.nurseInfo.certificationLevel} onChange={(e) => setFormData({ ...formData, nurseInfo: { ...formData.nurseInfo!, certificationLevel: e.target.value as any } })}>
                        <option value="RN">Registered Nurse (RN)</option>
                        <option value="LPN">Licensed Practical Nurse (LPN)</option>
                        <option value="NP">Nurse Practitioner (NP)</option>
                        <option value="CNA">Certified Nursing Assistant (CNA)</option>
                    </select>
                </div>
                <div className="flex flex-col gap-1.5">
                    <label className="font-label-sm text-gray-700 uppercase">Nursing License No.</label>
                    <input className="form-input" type="text" placeholder="e.g. RN-98765432" value={formData.nurseInfo.nursingLicenseNo} onChange={(e) => setFormData({ ...formData, nurseInfo: { ...formData.nurseInfo!, nursingLicenseNo: e.target.value } })} />
                </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Full Summary UI */}
      <div className="space-y-4 md:space-y-6">
        <div className="flex items-center gap-2 mb-4 md:mb-6 border-b border-gray-100 pb-4">
          <h3 className="font-headline-sm text-on-surface uppercase tracking-wide text-[10px] md:text-xs font-black">Final Review Summary</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* Identity Card */}
            <div className="bg-gray-50/50 border border-gray-200 rounded-2xl p-4 md:p-6 space-y-4">
                <div className="flex items-center gap-2 text-primary">
                    <span className="material-symbols-outlined text-sm font-bold">person</span>
                    <span className="text-[10px] font-black uppercase tracking-widest">Identity & Access</span>
                </div>
                <div className="space-y-3">
                    <div className="flex justify-between border-b border-gray-100 pb-2 gap-4">
                        <span className="text-[10px] md:text-xs text-gray-500 font-bold uppercase shrink-0">Full Name</span>
                        <span className="text-[10px] md:text-xs font-black text-on-surface text-right truncate">{formData.fullName || '—'}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 pb-2 gap-4">
                        <span className="text-[10px] md:text-xs text-gray-500 font-bold uppercase shrink-0">Username</span>
                        <span className="text-[10px] md:text-xs font-black text-on-surface text-right truncate">{formData.username || '—'}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 pb-2 gap-4">
                        <span className="text-[10px] md:text-xs text-gray-500 font-bold uppercase shrink-0">DOB</span>
                        <span className="text-[10px] md:text-xs font-black text-on-surface text-right">{formData.dob || '—'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] md:text-xs text-gray-500 font-bold uppercase">Superuser</span>
                        <span className={`text-[9px] md:text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${formData.superuser ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-600'}`}>{formData.superuser ? 'YES' : 'NO'}</span>
                    </div>
                </div>
            </div>

            {/* Contact Card */}
            <div className="bg-gray-50/50 border border-gray-200 rounded-2xl p-4 md:p-6 space-y-4">
                <div className="flex items-center gap-2 text-primary">
                    <span className="material-symbols-outlined text-sm font-bold">contact_page</span>
                    <span className="text-[10px] font-black uppercase tracking-widest">Contact Information</span>
                </div>
                <div className="space-y-3">
                    <div className="flex justify-between border-b border-gray-100 pb-2 gap-4">
                        <span className="text-[10px] md:text-xs text-gray-500 font-bold uppercase shrink-0">Email</span>
                        <span className="text-[10px] md:text-xs font-black text-on-surface text-right truncate">{formData.email || '—'}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 pb-2 gap-4">
                        <span className="text-[10px] md:text-xs text-gray-500 font-bold uppercase shrink-0">Phone</span>
                        <span className="text-[10px] md:text-xs font-black text-on-surface text-right">{formData.phone || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-[10px] md:text-xs text-gray-500 font-bold uppercase">Gender</span>
                        <span className="text-[10px] md:text-xs font-black text-on-surface text-right">{formData.gender}</span>
                    </div>
                </div>
            </div>
        </div>

        {/* Facility & Roles Card */}
        <div className="bg-gray-50/50 border border-gray-200 rounded-2xl p-4 md:p-6 space-y-4">
            <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined text-sm font-bold">domain</span>
                <span className="text-[10px] font-black uppercase tracking-widest">Assigned Facilities & Roles</span>
            </div>
            {formData.memberships && formData.memberships.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                    {formData.memberships.map((m, idx) => (
                        <div key={idx} className="p-3 md:p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
                            <p className="text-[10px] md:text-xs font-black text-on-surface mb-2 truncate">{m.hospitalName || 'Facility ID: ' + m.hospitalId}</p>
                            <div className="flex flex-wrap gap-1">
                                {m.roleAssignments?.map(ra => (
                                    <span key={ra.roleCode} className="text-[8px] md:text-[9px] font-black px-1.5 md:px-2 py-0.5 bg-orange-50 text-primary border border-orange-100 rounded uppercase">{ra.roleCode}</span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-[10px] md:text-xs text-gray-400 italic">No facility memberships assigned.</p>
            )}
        </div>
      </div>
    </div>
  );
};
