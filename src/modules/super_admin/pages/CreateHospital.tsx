'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/ui/MainLayout';
import { hospitalService } from '@/services/hospitalService';
import { catalogService } from '@/services/catalogService';
import { triggerGlobalToast } from '@/components/ui/Toast';
import { HOSPITAL_STATUS_OPTIONS } from '@/utils/enumOptions';

export function CreateHospital() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    registrationNo: '',
    gstin: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    status: 'ACTIVE',
    departments: [] as string[]
  });

  React.useEffect(() => {
    catalogService.getDepartments().then(res => {
      if (res.success && res.data) setDepartments(res.data);
    });
  }, []);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    // GSTIN Validation (India)
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (formData.gstin && !gstinRegex.test(formData.gstin)) {
      newErrors.gstin = 'Invalid GSTIN format. Expected: 22AAAAA0000A1Z5';
    }

    // Registration No Validation
    const regNoRegex = /^[A-Z0-9/-]{5,30}$/i;
    if (!formData.registrationNo) {
      newErrors.registrationNo = 'Registration number is required';
    } else if (!regNoRegex.test(formData.registrationNo)) {
      newErrors.registrationNo = 'Invalid registration number format';
    }

    if (!formData.name) newErrors.name = 'Hospital name is required';
    if (!formData.code) newErrors.code = 'Hospital code is required';
    if (!formData.city) newErrors.city = 'City is required';
    
    // Pincode Validation
    if (!formData.pincode) {
      newErrors.pincode = 'Pincode is required';
    } else if (!/^\d{6}$/.test(formData.pincode)) {
      newErrors.pincode = 'Pincode must be exactly 6 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setLoading(true);
      const res = await hospitalService.create(formData as any);
      if (res.success) {
        triggerGlobalToast('Hospital facility created successfully', 'success');
        router.push('/super_admin/hospitals');
      }
    } catch (error) {
      console.error('Failed to create hospital', error);
      triggerGlobalToast('Failed to create hospital facility', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout title="Configure Hospital" hideGlobalSearch={true}>
      <div className="max-w-6xl mx-auto">
        <form onSubmit={handleSubmit}>
          <div className="flex justify-between items-end mb-8">
            <div>
              <div 
                onClick={() => router.back()}
                className="flex items-center gap-2 text-slate-500 mb-2 cursor-pointer hover:text-[var(--primary)] transition-colors"
              >
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                <span className="font-label-sm uppercase">Hospital Directory</span>
              </div>
              <h2 className="font-headline-xl text-[var(--on-surface)]">Configure Hospital Facility</h2>
              <p className="font-body-md text-[var(--on-surface-variant)] mt-1">Manage registration details and operational settings for the new facility.</p>
            </div>
            <div className="flex gap-3">
              <button 
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2.5 border border-gray-300 bg-white text-[var(--on-surface)] font-bold rounded-lg hover:bg-slate-50 transition-all font-label-md"
              >
                Discard Changes
              </button>
              <button 
                type="submit"
                disabled={loading}
                className="btn-primary"
              >
                {loading ? 'Saving...' : 'Save Facility Profile'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-8 space-y-8">
              {/* Basic Information */}
              <section className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-gray-100 bg-slate-50/50">
                  <h3 className="font-headline-sm text-[var(--on-surface)] flex items-center gap-2">
                    <span className="material-symbols-outlined text-[var(--primary)]">info</span>
                    Basic Information
                  </h3>
                </div>
                <div className="p-8 space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="col-span-2">
                      <label className="font-label-md text-[var(--on-surface-variant)] mb-2 block">Hospital Name *</label>
                      <input 
                        className={`form-input font-body-md ${errors.name ? 'border-red-500' : ''}`}
                        type="text" 
                        placeholder="e.g. St. Mary's General Hospital"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                      {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                    </div>
                    <div>
                      <label className="font-label-md text-[var(--on-surface-variant)] mb-2 block">Hospital Code *</label>
                      <input 
                        className={`form-input font-body-md ${errors.code ? 'border-red-500' : ''}`}
                        type="text" 
                        placeholder="e.g. HSP-001"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        required
                      />
                      {errors.code && <p className="text-red-500 text-xs mt-1">{errors.code}</p>}
                    </div>
                    <div>
                      <label className="font-label-md text-[var(--on-surface-variant)] mb-2 block">Registration Number *</label>
                      <input 
                        className={`form-input font-body-md ${errors.registrationNo ? 'border-red-500' : ''}`}
                        type="text" 
                        placeholder="REG-2024-XXXX"
                        value={formData.registrationNo}
                        onChange={(e) => setFormData({ ...formData, registrationNo: e.target.value })}
                        required
                      />
                      {errors.registrationNo && <p className="text-red-500 text-xs mt-1">{errors.registrationNo}</p>}
                    </div>
                    <div className="col-span-2">
                      <label className="font-label-md text-[var(--on-surface-variant)] mb-2 block">GSTIN</label>
                      <input 
                        className={`form-input font-body-md ${errors.gstin ? 'border-red-500' : ''}`}
                        type="text" 
                        placeholder="22AAAAA0000A1Z5"
                        value={formData.gstin}
                        onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                      />
                      {errors.gstin && <p className="text-red-500 text-xs mt-1">{errors.gstin}</p>}
                    </div>
                  </div>
                </div>
              </section>

              {/* Address Information */}
              <section className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-gray-100 bg-slate-50/50">
                  <h3 className="font-bold text-lg text-[var(--text-primary)] flex items-center gap-2">
                    <span className="material-symbols-outlined text-[var(--primary)]">location_on</span>
                    Address Information
                  </h3>
                </div>
                <div className="p-8 space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="col-span-2">
                      <label className="block text-[14px] font-bold text-[var(--text-secondary)] mb-2">Full Address</label>
                      <textarea 
                        className="form-input min-h-[100px] py-3"
                        placeholder="Street address, building, landmark..."
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[14px] font-bold text-[var(--text-secondary)] mb-2">City *</label>
                      <input 
                        className={`form-input ${errors.city ? 'border-red-500' : ''}`}
                        type="text" 
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        required
                      />
                      {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[14px] font-bold text-[var(--text-secondary)] mb-2">State</label>
                        <input 
                          className="form-input" 
                          type="text" 
                          value={formData.state}
                          onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-[14px] font-bold text-[var(--text-secondary)] mb-2">Pincode *</label>
                        <input 
                          className={`form-input ${errors.pincode ? 'border-red-500' : ''}`}
                          type="text" 
                          value={formData.pincode}
                          maxLength={6}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '' || (/^\d+$/.test(val) && val.length <= 6)) {
                              setFormData({ ...formData, pincode: val });
                            }
                          }}
                          required
                        />
                        {errors.pincode && <p className="text-red-500 text-xs mt-1">{errors.pincode}</p>}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Department Management */}
              <section className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-gray-100 bg-slate-50/50">
                  <h3 className="font-headline-sm text-[var(--on-surface)] flex items-center gap-2">
                    <span className="material-symbols-outlined text-[var(--primary)]">hub</span>
                    Departments & Services
                  </h3>
                </div>
                <div className="p-8">
                  <p className="font-label-md text-[var(--on-surface-variant)] mb-4">Select departments enabled for this facility:</p>
                  <div className="flex flex-wrap gap-2">
                    {departments.map(dept => {
                      const isSelected = formData.departments.includes(dept);
                      return (
                        <button
                          key={dept}
                          type="button"
                          onClick={() => {
                            const current = formData.departments;
                            setFormData({ 
                              ...formData, 
                              departments: isSelected 
                                ? current.filter(d => d !== dept) 
                                : [...current, dept] 
                            });
                          }}
                          className={`px-4 py-2 rounded-xl border-2 font-bold text-xs uppercase tracking-tight transition-all ${
                            isSelected 
                              ? 'bg-[var(--primary)] border-[var(--primary)] text-white shadow-md scale-105' 
                              : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                          }`}
                        >
                          {dept}
                        </button>
                      );
                    })}
                  </div>
                  {departments.length === 0 && (
                    <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      <p className="text-sm text-slate-400 italic">No departments found in the master catalog.</p>
                    </div>
                  )}
                </div>
              </section>
            </div>

            <div className="col-span-4">
              <div className="sticky top-24 space-y-6">
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <h4 className="text-lg font-bold text-[var(--text-primary)] mb-6">Facility Status</h4>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-[var(--text-primary)] text-sm">Active Status</p>
                        <p className="text-[12px] text-[var(--text-secondary)]">Visible to patients and staff</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={formData.status === 'ACTIVE'}
                          onChange={(e) => setFormData({ ...formData, status: e.target.checked ? 'ACTIVE' : 'INACTIVE' })}
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary)]"></div>
                      </label>
                    </div>
                    <div className="pt-6 border-t border-slate-100">
                      <p className="font-bold text-[var(--text-primary)] text-sm mb-3">Onboarding Status</p>
                      <select 
                        className="form-input"
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as typeof formData.status })}
                      >
                        {HOSPITAL_STATUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 rounded-xl p-6 text-white shadow-xl">
                  <h4 className="text-lg font-bold mb-2">Need Help?</h4>
                  <p className="text-sm text-slate-400 mb-4">Consult our documentation for multi-facility setup guides.</p>
                  <button type="button" className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-base">auto_stories</span>
                    Open Knowledge Base
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
