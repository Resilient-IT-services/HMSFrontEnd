'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/ui/MainLayout';
import { hospitalService } from '@/services/hospitalService';
import { catalogService } from '@/services/catalogService';
import { HospitalResponse } from '@/types/api';
import { triggerGlobalToast } from '@/components/ui/Toast';
import { HOSPITAL_STATUS_OPTIONS } from '@/utils/enumOptions';
import { PageSurface } from '@/components/ui/PageSurface';
import { Button } from '@/components/ui/Button';

export function EditHospital({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [departments, setDepartments] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<Partial<HospitalResponse>>({
    name: '',
    code: '',
    registrationNo: '',
    gstin: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    status: 'ACTIVE',
    departments: [],
    timezone: 'Asia/Kolkata'
  });

  const commonTimezones = [
    'Asia/Kolkata',
    'UTC',
    'America/New_York',
    'Europe/London',
    'Asia/Dubai',
    'Africa/Nairobi',
    'Australia/Sydney'
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [hospRes, deptRes] = await Promise.all([
          hospitalService.getById(id as any),
          catalogService.getDepartments()
        ]);

        if (hospRes.success && hospRes.data) {
          setFormData(hospRes.data);
        }
        if (deptRes.success && deptRes.data) {
          setDepartments(deptRes.data);
        }
      } catch (error) {
        console.error('Failed to fetch data', error);
        triggerGlobalToast('Failed to fetch hospital details', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

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
      setSaving(true);
      const res = await hospitalService.update(id as any, formData as any);
      if (res.success) {
        triggerGlobalToast('Hospital facility updated successfully', 'success');
        router.push('/super_admin/hospitals');
      }
    } catch (error) {
      console.error('Failed to update hospital', error);
      triggerGlobalToast('Failed to update hospital facility', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <MainLayout title="Loading...">
        <div className="flex items-center justify-center h-64 text-gray-500 font-bold uppercase tracking-widest animate-pulse">
          Retrieving facility profile...
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Configure Hospital" hideGlobalSearch={true}>
      <PageSurface
        maxWidthClassName="max-w-[1600px]"
        backgroundClassName="bg-[#f8f9fb]"
        fontClassName="font-inter"
      >
        <div className="py-4 md:py-8">
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
                  <h2 className="font-headline-xl text-slate-900">Configure Hospital Facility</h2>
                  <p className="font-body-md text-slate-500 mt-1">Manage registration details and operational settings for {formData.name}.</p>
                </div>
                <div className="flex gap-3">
                  <button 
                    type="button"
                    onClick={() => router.back()}
                    className="px-6 py-2.5 border border-gray-300 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-50 transition-all text-sm"
                  >
                    Discard Changes
                  </button>
                  <Button 
                    type="submit"
                    isLoading={saving}
                  >
                    Save Facility Profile
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                <div className="md:col-span-8 space-y-8">
                  {/* Basic Information */}
                  <section className="bg-white border border-gray-200 rounded-[2rem] overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-gray-100 bg-slate-50/50">
                      <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">info</span>
                        Basic Information
                      </h3>
                    </div>
                    <div className="p-8 space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="col-span-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Hospital Name *</label>
                          <input 
                            className={`form-input font-bold ${errors.name ? 'border-red-500' : ''}`}
                            type="text" 
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                          />
                          {errors.name && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase">{errors.name}</p>}
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Hospital Code *</label>
                          <input 
                            className={`form-input font-bold ${errors.code ? 'border-red-500' : ''}`}
                            type="text" 
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                            required
                          />
                          {errors.code && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase">{errors.code}</p>}
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Registration Number *</label>
                          <input 
                            className={`form-input font-bold ${errors.registrationNo ? 'border-red-500' : ''}`}
                            type="text" 
                            value={formData.registrationNo}
                            onChange={(e) => setFormData({ ...formData, registrationNo: e.target.value })}
                            required
                          />
                          {errors.registrationNo && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase">{errors.registrationNo}</p>}
                        </div>
                        <div className="col-span-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Facility Timezone *</label>
                          <select 
                            className="form-input font-bold"
                            value={formData.timezone}
                            onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                            required
                          >
                            {commonTimezones.map(tz => (
                              <option key={tz} value={tz}>{tz}</option>
                            ))}
                          </select>
                          <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-bold italic">Critical for accurate scheduling and reporting boundaries.</p>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Address Information */}
                  <section className="bg-white border border-gray-200 rounded-[2rem] overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-gray-100 bg-slate-50/50">
                      <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">location_on</span>
                        Address Information
                      </h3>
                    </div>
                    <div className="p-8 space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="col-span-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Full Address</label>
                          <textarea 
                            className="form-input min-h-[100px] py-3 font-medium"
                            placeholder="Street address, building, landmark..."
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">City *</label>
                          <input 
                            className={`form-input font-bold ${errors.city ? 'border-red-500' : ''}`}
                            type="text" 
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            required
                          />
                          {errors.city && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase">{errors.city}</p>}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">State</label>
                            <input 
                              className="form-input font-bold" 
                              type="text" 
                              value={formData.state}
                              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Pincode *</label>
                            <input 
                              className={`form-input font-bold ${errors.pincode ? 'border-red-500' : ''}`}
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
                            {errors.pincode && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase">{errors.pincode}</p>}
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Department Management */}
                  <section className="bg-white border border-gray-200 rounded-[2rem] overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-gray-100 bg-slate-50/50">
                      <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">hub</span>
                        Departments & Services
                      </h3>
                    </div>
                    <div className="p-8">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Select departments enabled for this facility:</p>
                      <div className="flex flex-wrap gap-2">
                        {departments.map(dept => {
                          const isSelected = formData.departments?.includes(dept);
                          return (
                            <button
                              key={dept}
                              type="button"
                              onClick={() => {
                                const current = formData.departments || [];
                                setFormData({ 
                                  ...formData, 
                                  departments: isSelected 
                                    ? current.filter(d => d !== dept) 
                                    : [...current, dept] 
                                });
                              }}
                              className={`px-4 py-2 rounded-xl border-2 font-bold text-xs uppercase tracking-tight transition-all ${
                                isSelected 
                                  ? 'bg-primary border-primary text-white shadow-md scale-105' 
                                  : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                              }`}
                            >
                              {dept}
                            </button>
                          );
                        })}
                      </div>
                      {departments.length === 0 && (
                        <div className="py-8 text-center bg-slate-50 rounded-[1.5rem] border border-dashed border-slate-200">
                          <p className="text-sm text-slate-400 italic">No departments found in the master catalog.</p>
                        </div>
                      )}
                    </div>
                  </section>
                </div>

                <div className="md:col-span-4">
                  <div className="sticky top-24 space-y-6">
                    <div className="bg-white border border-gray-200 rounded-[1.5rem] p-6 shadow-sm">
                      <h4 className="text-lg font-bold text-slate-900 mb-6">Facility Status</h4>
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold text-slate-900 text-sm">Active Status</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Visible to patients and staff</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              className="sr-only peer" 
                              checked={formData.status === 'ACTIVE'}
                              onChange={(e) => setFormData({ ...formData, status: e.target.checked ? 'ACTIVE' : 'INACTIVE' })}
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                          </label>
                        </div>
                        <div className="pt-6 border-t border-slate-100">
                          <p className="font-bold text-slate-900 text-sm mb-3">Onboarding Status</p>
                          <select 
                            className="form-input font-bold"
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                          >
                            {HOSPITAL_STATUS_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-900 rounded-[1.5rem] p-6 text-white shadow-xl relative overflow-hidden">
                      <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-8xl opacity-10 -rotate-12">help</span>
                      <h4 className="text-lg font-bold mb-2">Need Help?</h4>
                      <p className="text-sm text-slate-400 mb-4 font-medium leading-relaxed">Consult our documentation for multi-facility setup guides.</p>
                      <button type="button" className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 backdrop-blur-md">
                        <span className="material-symbols-outlined text-base">auto_stories</span>
                        Knowledge Base
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </PageSurface>
    </MainLayout>
  );
}
