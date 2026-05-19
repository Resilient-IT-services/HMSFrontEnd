'use client';

import React from 'react';
import { UserRequestDTO } from '@/types/api';
import { MobileSelector } from '@/components/ui/MobileSelector';

interface UserFormProfileTabProps {
  formData: UserRequestDTO;
  setFormData: (data: UserRequestDTO) => void;
  specializations: string[];
  assignedRoles: string[];
  validationErrors: Record<string, string>;
}

export const UserFormProfileTab: React.FC<UserFormProfileTabProps> = ({
  formData,
  setFormData,
  specializations,
  assignedRoles,
  validationErrors
}) => {
  const updateDoctorInfo = (updates: Partial<NonNullable<UserRequestDTO['doctorInfo']>>) => {
    setFormData({ ...formData, doctorInfo: { ...formData.doctorInfo!, ...updates } });
  };

  const updateReceptionistInfo = (updates: Partial<NonNullable<UserRequestDTO['receptionistInfo']>>) => {
    setFormData({ ...formData, receptionistInfo: { ...formData.receptionistInfo!, ...updates } });
  };

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
          <div className={`bg-white border border-gray-200 rounded-xl p-4 md:p-6 space-y-4 shadow-sm ${validationErrors.specialization || validationErrors.specializations ? 'ring-2 ring-error/50' : ''}`}>
            <div className="flex items-center gap-3 border-b border-gray-50 pb-3">
              <span className="material-symbols-outlined text-primary text-xl">stethoscope</span>
              <h4 className="text-[10px] font-black text-on-surface uppercase tracking-widest">Doctor Profile Details</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              <div className="flex flex-col gap-1.5 md:col-span-3">
                <label className="font-label-sm text-gray-700 uppercase">Specializations <span className="text-primary">*</span></label>
                <div className="flex flex-wrap gap-2 p-3 bg-gray-50/50 border border-gray-200 rounded-xl min-h-[50px]">
                    {specializations.map(spec => {
                        const isSpecSelected = formData.doctorInfo?.specializations?.includes(spec);
                        return (
                            <button
                                key={spec}
                                type="button"
                                onClick={() => {
                                    const currentSpecs = formData.doctorInfo?.specializations || [];
                                    const newSpecs = isSpecSelected 
                                        ? currentSpecs.filter(s => s !== spec) 
                                        : [...currentSpecs, spec];
                                    updateDoctorInfo({ specializations: newSpecs });
                                }}
                                className={`px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-tighter transition-all ${
                                    isSpecSelected 
                                        ? 'bg-primary border-primary text-white shadow-sm' 
                                        : 'bg-white border-gray-200 text-slate-500 hover:border-slate-300'
                                }`}
                            >
                                {spec}
                            </button>
                        );
                    })}
                    {specializations.length === 0 && <p className="text-[10px] text-slate-400 italic font-medium">No specializations available in catalog.</p>}
                </div>
                {renderFieldError('specialization')}
                {renderFieldError('specializations')}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-label-sm text-gray-700 uppercase">License Number</label>
                <input
                    className={`form-input ${validationErrors.licenseNumber ? 'border-error' : ''}`}
                    type="text"
                    placeholder="e.g. MED-12345678"
                    value={formData.doctorInfo.licenseNumber}
                    onChange={(e) => updateDoctorInfo({ licenseNumber: e.target.value })}
                />
                {renderFieldError('licenseNumber')}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-label-sm text-gray-700 uppercase">Registration Number</label>
                <input
                    className="form-input"
                    type="text"
                    placeholder="e.g. REG-12345"
                    value={formData.doctorInfo.registrationNumber || ''}
                    onChange={(e) => updateDoctorInfo({ registrationNumber: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-label-sm text-gray-700 uppercase">Exp. Years</label>
                <input
                    className="form-input"
                    type="number"
                    placeholder="e.g. 10"
                    value={formData.doctorInfo.experienceYears || ''}
                    onChange={(e) => updateDoctorInfo({ experienceYears: Number(e.target.value) })}
                />
              </div>
              <div className="flex flex-col gap-1.5 md:col-span-3">
                <label className="font-label-sm text-gray-700 uppercase">Bio & Awards</label>
                <textarea
                    className="form-input"
                    rows={2}
                    placeholder="Brief bio and notable awards..."
                    value={formData.doctorInfo.bio || ''}
                    onChange={(e) => updateDoctorInfo({ bio: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-3 md:col-span-3">
                <div className="flex items-center justify-between">
                  <label className="font-label-sm text-gray-700 uppercase">Education Details</label>
                  <button
                    type="button"
                    onClick={() => {
                      const qualifications = formData.doctorInfo?.education?.qualifications || [];
                      updateDoctorInfo({
                        education: {
                          qualifications: [...qualifications, { degree: '', institution: '', year: new Date().getFullYear(), specialization: '' }]
                        }
                      });
                    }}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-600"
                  >
                    Add Education
                  </button>
                </div>
                <div className="space-y-3">
                  {(formData.doctorInfo.education?.qualifications || []).map((qualification, index) => (
                    <div key={index} className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4 md:grid-cols-12">
                      <div className="md:col-span-3">
                        <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-500">Degree</label>
                        <input
                          className="form-input"
                          type="text"
                          value={qualification.degree}
                          onChange={(e) => {
                            const qualifications = [...(formData.doctorInfo?.education?.qualifications || [])];
                            qualifications[index] = { ...qualification, degree: e.target.value };
                            updateDoctorInfo({ education: { qualifications } });
                          }}
                        />
                      </div>
                      <div className="md:col-span-4">
                        <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-500">Institution</label>
                        <input
                          className="form-input"
                          type="text"
                          value={qualification.institution}
                          onChange={(e) => {
                            const qualifications = [...(formData.doctorInfo?.education?.qualifications || [])];
                            qualifications[index] = { ...qualification, institution: e.target.value };
                            updateDoctorInfo({ education: { qualifications } });
                          }}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-500">Year</label>
                        <input
                          className="form-input"
                          type="number"
                          value={qualification.year || ''}
                          onChange={(e) => {
                            const qualifications = [...(formData.doctorInfo?.education?.qualifications || [])];
                            qualifications[index] = { ...qualification, year: Number(e.target.value) };
                            updateDoctorInfo({ education: { qualifications } });
                          }}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-500">Focus</label>
                        <input
                          className="form-input"
                          type="text"
                          value={qualification.specialization}
                          onChange={(e) => {
                            const qualifications = [...(formData.doctorInfo?.education?.qualifications || [])];
                            qualifications[index] = { ...qualification, specialization: e.target.value };
                            updateDoctorInfo({ education: { qualifications } });
                          }}
                        />
                      </div>
                      <div className="flex items-end md:col-span-1">
                        <button
                          type="button"
                          onClick={() => {
                            const qualifications = (formData.doctorInfo?.education?.qualifications || []).filter((_, qualificationIndex) => qualificationIndex !== index);
                            updateDoctorInfo({ education: { qualifications } });
                          }}
                          className="w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-wider text-red-600"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                  {(formData.doctorInfo.education?.qualifications || []).length === 0 && (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-[10px] font-medium text-slate-400">
                      No education entries added yet.
                    </div>
                  )}
                </div>
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
                    <MobileSelector
                        label="Certification"
                        options={[
                            { id: 'RN', name: 'Registered Nurse (RN)', icon: 'badge' },
                            { id: 'LPN', name: 'Licensed Practical Nurse (LPN)', icon: 'badge' },
                            { id: 'NP', name: 'Nurse Practitioner (NP)', icon: 'badge' },
                            { id: 'CNA', name: 'Certified Nursing Assistant (CNA)', icon: 'badge' }
                        ]}
                        value={formData.nurseInfo.certificationLevel || ''}
                        onChange={(val) => setFormData({ ...formData, nurseInfo: { ...formData.nurseInfo!, certificationLevel: val as any } })}
                        placeholder="Select Level..."
                    />
                </div>
                <div className="flex flex-col gap-1.5">
                    <label className="font-label-sm text-gray-700 uppercase">Nursing License No.</label>
                    <input className="form-input" type="text" placeholder="e.g. RN-98765432" value={formData.nurseInfo.nursingLicenseNo} onChange={(e) => setFormData({ ...formData, nurseInfo: { ...formData.nurseInfo!, nursingLicenseNo: e.target.value } })} />
                </div>
            </div>
          </div>
        )}

        {assignedRoles.includes('RECEPTIONIST') && formData.receptionistInfo && (
          <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-3 border-b border-gray-50 pb-3">
              <span className="material-symbols-outlined text-emerald-600 text-xl">translate</span>
              <h4 className="text-[10px] font-black text-on-surface uppercase tracking-widest">Receptionist Languages</h4>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="font-label-sm text-gray-700 uppercase">Languages Spoken</label>
                <button
                  type="button"
                  onClick={() => {
                    const fluencies = formData.receptionistInfo?.languagesSpoken?.fluencies || [];
                    updateReceptionistInfo({
                      languagesSpoken: {
                        fluencies: [...fluencies, { language: '', proficiency: 'BASIC' }]
                      }
                    });
                  }}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-600"
                >
                  Add Language
                </button>
              </div>
              <div className="space-y-3">
                {(formData.receptionistInfo.languagesSpoken?.fluencies || []).map((fluency, index) => (
                  <div key={index} className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4 md:grid-cols-12">
                    <div className="md:col-span-6">
                      <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-500">Language</label>
                      <input
                        className="form-input"
                        type="text"
                        value={fluency.language}
                        onChange={(e) => {
                          const fluencies = [...(formData.receptionistInfo?.languagesSpoken?.fluencies || [])];
                          fluencies[index] = { ...fluency, language: e.target.value };
                          updateReceptionistInfo({ languagesSpoken: { fluencies } });
                        }}
                      />
                    </div>
                    <div className="md:col-span-4">
                      <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-500">Proficiency</label>
                      <select
                        className="form-input"
                        value={fluency.proficiency}
                        onChange={(e) => {
                          const fluencies = [...(formData.receptionistInfo?.languagesSpoken?.fluencies || [])];
                          fluencies[index] = { ...fluency, proficiency: e.target.value as 'NATIVE' | 'FLUENT' | 'INTERMEDIATE' | 'BASIC' };
                          updateReceptionistInfo({ languagesSpoken: { fluencies } });
                        }}
                      >
                        <option value="BASIC">Basic</option>
                        <option value="INTERMEDIATE">Intermediate</option>
                        <option value="FLUENT">Fluent</option>
                        <option value="NATIVE">Native</option>
                      </select>
                    </div>
                    <div className="flex items-end md:col-span-2">
                      <button
                        type="button"
                        onClick={() => {
                          const fluencies = (formData.receptionistInfo?.languagesSpoken?.fluencies || []).filter((_, fluencyIndex) => fluencyIndex !== index);
                          updateReceptionistInfo({ languagesSpoken: { fluencies } });
                        }}
                        className="w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-wider text-red-600"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                {(formData.receptionistInfo.languagesSpoken?.fluencies || []).length === 0 && (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-[10px] font-medium text-slate-400">
                    No receptionist languages added yet.
                  </div>
                )}
              </div>
              <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">Insurance Specialist</p>
                  <p className="text-[10px] text-slate-400">Marks the receptionist as trained to assist with insurance workflows.</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.receptionistInfo.insuranceSpecialist}
                  onChange={(e) => updateReceptionistInfo({ insuranceSpecialist: e.target.checked })}
                />
              </label>
            </div>
          </div>
        )}
      </div>

      {/* 2. Full Summary UI */}
      <div className="space-y-4 md:space-y-6">
        <div className="flex items-center gap-2 mb-2 md:mb-6 border-b border-gray-100 pb-4">
          <h3 className="font-bold text-[11px] md:text-xs text-on-surface uppercase tracking-wider">Final Review Summary</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* Identity Card */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 md:p-6 space-y-4 shadow-sm">
                <div className="flex items-center gap-2 text-primary">
                    <span className="material-symbols-outlined text-sm font-bold">person</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest">Identity & Access</span>
                </div>
                <div className="space-y-3">
                    <div className="flex justify-between border-b border-gray-50 pb-2 gap-4">
                        <span className="text-[10px] md:text-xs text-gray-400 font-bold uppercase shrink-0">Full Name</span>
                        <span className="text-[10px] md:text-xs font-bold text-on-surface text-right truncate">{formData.fullName || '—'}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-50 pb-2 gap-4">
                        <span className="text-[10px] md:text-xs text-gray-400 font-bold uppercase shrink-0">Username</span>
                        <span className="text-[10px] md:text-xs font-bold text-on-surface text-right truncate">{formData.username || '—'}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-50 pb-2 gap-4">
                        <span className="text-[10px] md:text-xs text-gray-400 font-bold uppercase shrink-0">DOB</span>
                        <span className="text-[10px] md:text-xs font-bold text-on-surface text-right">{formData.dob || '—'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] md:text-xs text-gray-400 font-bold uppercase">Superuser</span>
                        <span className={`text-[9px] md:text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${formData.superuser ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'}`}>{formData.superuser ? 'YES' : 'NO'}</span>
                    </div>
                </div>
            </div>

            {/* Contact Card */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 md:p-6 space-y-4 shadow-sm">
                <div className="flex items-center gap-2 text-primary">
                    <span className="material-symbols-outlined text-sm font-bold">contact_page</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest">Contact Information</span>
                </div>
                <div className="space-y-3">
                    <div className="flex justify-between border-b border-gray-50 pb-2 gap-4">
                        <span className="text-[10px] md:text-xs text-gray-400 font-bold uppercase shrink-0">Email</span>
                        <span className="text-[10px] md:text-xs font-bold text-on-surface text-right truncate">{formData.email || '—'}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-50 pb-2 gap-4">
                        <span className="text-[10px] md:text-xs text-gray-400 font-bold uppercase shrink-0">Phone</span>
                        <span className="text-[10px] md:text-xs font-bold text-on-surface text-right">{formData.phone || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-[10px] md:text-xs text-gray-400 font-bold uppercase">Gender</span>
                        <span className="text-[10px] md:text-xs font-bold text-on-surface text-right">{formData.gender}</span>
                    </div>
                </div>
            </div>
        </div>

        {/* Facility & Roles Card */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 md:p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined text-sm font-bold">domain</span>
                <span className="text-[10px] font-bold uppercase tracking-widest">Assigned Facilities & Roles</span>
            </div>
            {formData.memberships && formData.memberships.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                    {formData.memberships.map((m, idx) => (
                        <div key={idx} className="p-3 md:p-4 bg-slate-50/50 border border-slate-100 rounded-xl">
                            <p className="text-[10px] md:text-xs font-bold text-on-surface mb-2 truncate">{m.hospitalName || 'Facility ID: ' + m.hospitalId}</p>
                            <div className="flex flex-wrap gap-1">
                                {m.roleAssignments?.map(ra => (
                                    <span key={ra.roleCode} className="text-[8px] md:text-[9px] font-bold px-1.5 md:px-2 py-0.5 bg-white text-primary border border-orange-100 rounded uppercase tracking-tighter">{ra.roleCode}</span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-[10px] md:text-xs text-gray-400 font-medium italic">No facility memberships assigned.</p>
            )}
        </div>
      </div>
    </div>
  );
};
