'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserRequestDTO, UserFullProfileDTO, HospitalResponse, Role } from '@/types/api';
import { hospitalService } from '@/services/hospitalService';
import apiClient from '@/services/apiClient';

interface UserFormProps {
  initialData?: UserFullProfileDTO;
  isEdit?: boolean;
}

const UserForm: React.FC<UserFormProps> = ({ initialData, isEdit }) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'personal' | 'profile' | 'contracts'>('personal');
  const [hospitals, setHospitals] = useState<HospitalResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<UserRequestDTO>({
    username: initialData?.username || '',
    fullName: initialData?.fullName || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    dob: initialData?.dob || '',
    gender: (initialData?.gender as any) || 'MALE',
    password: '',
    superuser: initialData?.superuser || false,
    detailedMemberships: initialData?.detailedMemberships || []
  });

  useEffect(() => {
    const fetchHospitals = async () => {
      const res = await hospitalService.list();
      if (res.success) setHospitals(res.data || []);
    };
    fetchHospitals();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const url = isEdit ? `/users/${initialData?.id}` : '/users';
      const method = isEdit ? 'put' : 'post';
      
      const res = await apiClient[method](url, formData);
      if (res.data.success) {
        router.push('/admin/users');
      }
    } catch (error) {
      console.error('Failed to save user', error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <form onSubmit={handleSubmit}>
        {/* Page Header */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-[var(--primary-light)] flex items-center justify-center text-[var(--primary)] text-2xl font-bold border-4 border-orange-50 shadow-sm">
                {formData.fullName ? getInitials(formData.fullName) : '?'}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-green-500 w-5 h-5 rounded-full border-4 border-white"></div>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-headline-xl text-[var(--on-surface)]">{isEdit ? 'Edit User Profile' : 'Create New User'}</h1>
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded uppercase tracking-wider">Active</span>
              </div>
              <p className="font-body-lg text-[var(--on-surface-variant)]">{formData.fullName || 'New Staff Member'}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center gap-2"
            >
              <span className="material-symbols-outlined">save</span>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Main Content with Tabs */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          {/* Tab Headers */}
          <div className="flex border-b border-gray-100 bg-slate-50/30">
            <button 
              type="button"
              onClick={() => setActiveTab('personal')}
              className={`px-8 py-4 font-bold text-sm flex items-center gap-2 transition-all ${activeTab === 'personal' ? 'border-b-2 border-[var(--primary)] text-[var(--primary)]' : 'text-gray-500 hover:bg-gray-50 font-label-md'}`}
            >
              <span className="material-symbols-outlined text-lg">person</span>
              Personal Info
            </button>
            <button 
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`px-8 py-4 font-bold text-sm flex items-center gap-2 transition-all ${activeTab === 'profile' ? 'border-b-2 border-[var(--primary)] text-[var(--primary)]' : 'text-gray-500 hover:bg-gray-50 font-label-md'}`}
            >
              <span className="material-symbols-outlined text-lg">badge</span>
              Profile Information
            </button>
            <button 
              type="button"
              onClick={() => setActiveTab('contracts')}
              className={`px-8 py-4 font-bold text-sm flex items-center gap-2 transition-all ${activeTab === 'contracts' ? 'border-b-2 border-[var(--primary)] text-[var(--primary)]' : 'text-gray-500 hover:bg-gray-50 font-label-md'}`}
            >
              <span className="material-symbols-outlined text-lg">description</span>
              Contracts
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {activeTab === 'personal' && (
              <div className="space-y-12">
                <div>
                  <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
                    <h3 className="font-headline-sm text-[var(--on-surface)]">Global Identity</h3>
                    <span className="material-symbols-outlined text-gray-400 text-sm">info</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div className="flex flex-col gap-1.5">
                      <label className="font-label-sm text-gray-700 uppercase">Full Name</label>
                      <input 
                        className="form-input font-body-md" 
                        type="text" 
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="font-label-sm text-gray-700 uppercase">Username</label>
                      <input 
                        className="form-input font-body-md" 
                        type="text" 
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        required
                        disabled={isEdit}
                      />
                    </div>
                    {!isEdit && (
                      <div className="flex flex-col gap-1.5">
                        <label className="font-label-sm text-gray-700 uppercase">Password</label>
                        <input 
                          className="form-input font-body-md" 
                          type="password" 
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          required={!isEdit}
                        />
                      </div>
                    )}
                    <div className="flex flex-col gap-1.5">
                      <label className="font-label-sm text-gray-700 uppercase">Email Address</label>
                      <input 
                        className="form-input font-body-md" 
                        type="email" 
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="font-label-sm text-gray-700 uppercase">Primary Phone</label>
                      <input 
                        className="form-input font-body-md" 
                        type="tel" 
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="font-label-sm text-gray-700 uppercase">Date of Birth</label>
                      <input 
                        className="form-input font-body-md" 
                        type="date" 
                        value={formData.dob}
                        onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="font-label-sm text-gray-700 uppercase">Gender Identity</label>
                      <select 
                        className="form-input font-body-md"
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                      >
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="space-y-6 font-body-md">
                <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                  <h3 className="font-headline-sm text-[var(--on-surface)]">Global Profiles</h3>
                  <button type="button" className="text-[var(--primary)] font-bold text-sm hover:underline font-label-md">Add Profile</button>
                </div>
                <div className="border border-gray-100 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50/50">
                      <tr>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase font-label-sm">Profile Type</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase font-label-sm">Status</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase font-label-sm text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-body-md">
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-orange-50 text-[var(--primary)] flex items-center justify-center">
                              <span className="material-symbols-outlined">stethoscope</span>
                            </div>
                            <div>
                              <p className="font-bold text-sm">Staff Member</p>
                              <p className="text-[11px] text-gray-500">Global system access</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-700 text-[12px] font-bold border border-green-100 uppercase font-label-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                            Complete
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <button type="button" className="text-[var(--primary)] hover:underline font-bold text-sm font-label-md">Edit</button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'contracts' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                  <h3 className="font-headline-sm text-[var(--on-surface)]">Hospital Contracts</h3>
                  <button type="button" className="bg-[var(--primary)] text-white px-4 py-2 rounded-lg text-sm font-bold font-label-md">Add Contract</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {formData.detailedMemberships?.map((m, idx) => {
                    const hosp = hospitals.find(h => String(h.id) === String(m.hospitalId));
                    return (
                      <div key={idx} className="p-5 border border-gray-200 rounded-xl hover:border-[var(--primary)] transition-all bg-white font-body-md">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex gap-4">
                            <div className="w-12 h-12 rounded-lg bg-slate-50 flex items-center justify-center">
                              <span className="material-symbols-outlined text-gray-400">location_city</span>
                            </div>
                            <div>
                              <h4 className="font-bold text-sm">{hosp?.name || 'Unknown Hospital'}</h4>
                              <p className="text-[12px] text-gray-500">{m.roles.join(', ')} • {m.department || 'No Dept'}</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded uppercase font-label-sm">Active</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 py-3 border-y border-gray-50">
                          <div>
                            <p className="text-[10px] uppercase font-bold text-gray-400 font-label-sm">Rate</p>
                            <p className="font-bold text-sm">${m.hourlyRate || 0} / hr</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase font-bold text-gray-400 font-label-sm">Status</p>
                            <p className="font-bold text-sm">{m.status || 'ACTIVE'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase font-bold text-gray-400 font-label-sm">Schedule</p>
                            <p className="font-bold text-sm">{m.schedule || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {(!formData.detailedMemberships || formData.detailedMemberships.length === 0) && (
                    <div className="md:col-span-2 py-10 text-center text-gray-500 border-2 border-dashed border-gray-200 rounded-xl font-body-md">
                      No contracts assigned.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Action Bar */}
        <div className="fixed bottom-0 right-0 left-64 bg-white/95 backdrop-blur-md border-t border-gray-200 px-8 py-4 flex justify-between items-center z-40">
          <div className="flex items-center gap-2 text-sm text-gray-500 font-body-sm">
            <span className="material-symbols-outlined text-green-500">cloud_done</span>
            All changes tracked
          </div>
          <div className="flex gap-3">
            <button 
              type="button" 
              onClick={() => router.back()}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-50 transition-colors font-label-md"
            >
              Discard
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="btn-primary px-8"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default UserForm;
