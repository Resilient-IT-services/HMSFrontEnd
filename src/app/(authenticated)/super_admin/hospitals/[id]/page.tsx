'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/ui/MainLayout';
import { hospitalService } from '@/services/hospitalService';
import { HospitalResponse } from '@/types/api';

export default function EditHospitalPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<HospitalResponse>>({
    name: '',
    code: '',
    address: '',
    status: 'ACTIVE'
  });

  useEffect(() => {
    const fetchHospital = async () => {
      try {
        setLoading(true);
        const res = await hospitalService.getById(id as any);
        if (res.success && res.data) {
          setFormData(res.data);
        }
      } catch (error) {
        console.error('Failed to fetch hospital', error);
      } finally {
        setLoading(false);
      }
    };
    fetchHospital();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await hospitalService.update(id as any, formData as any);
      if (res.success) {
        router.push('/super_admin/hospitals');
      }
    } catch (error) {
      console.error('Failed to update hospital', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <MainLayout title="Loading...">
        <div className="flex items-center justify-center h-64 text-gray-500">
          Loading hospital details...
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Configure Hospital">
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
              <p className="font-body-md text-[var(--on-surface-variant)] mt-1">Manage registration details and operational settings for {formData.name}.</p>
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
                disabled={saving}
                className="btn-primary"
              >
                {saving ? 'Saving...' : 'Save Facility Profile'}
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
                      <label className="font-label-md text-[var(--on-surface-variant)] mb-2 block">Hospital Name</label>
                      <input 
                        className="form-input font-body-md"
                        type="text" 
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="font-label-md text-[var(--on-surface-variant)] mb-2 block">Hospital Code</label>
                      <input 
                        className="form-input font-body-md"
                        type="text" 
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="font-label-md text-[var(--on-surface-variant)] mb-2 block">Registration Number</label>
                      <input 
                        className="form-input font-body-md"
                        type="text" 
                        defaultValue="REG-2023-884920"
                      />
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
                      <label className="block text-[14px] font-bold text-[var(--text-secondary)] mb-2">Address Line 1</label>
                      <input 
                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] transition-all"
                        type="text" 
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[14px] font-bold text-[var(--text-secondary)] mb-2">Address Line 2 (Optional)</label>
                      <input 
                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] transition-all"
                        placeholder="Suite, Floor, Building"
                        type="text"
                      />
                    </div>
                    <div>
                      <label className="block text-[14px] font-bold text-[var(--text-secondary)] mb-2">City</label>
                      <input className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] transition-all" type="text" defaultValue="Austin" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[14px] font-bold text-[var(--text-secondary)] mb-2">State</label>
                        <select className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] transition-all appearance-none">
                          <option>Texas</option>
                          <option>California</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[14px] font-bold text-[var(--text-secondary)] mb-2">Pincode</label>
                        <input className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] transition-all" type="text" defaultValue="78701" />
                      </div>
                    </div>
                  </div>
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
                      <p className="font-bold text-[var(--text-primary)] text-sm mb-3">Enterprise Tier</p>
                      <div className="bg-orange-50 border border-orange-100 rounded-lg p-4 flex items-start gap-3">
                        <span className="material-symbols-outlined text-orange-600">workspace_premium</span>
                        <div>
                          <p className="text-[12px] text-orange-800 font-bold uppercase">Platinum Partner</p>
                          <p className="text-[11px] text-orange-700 mt-1">Priority support and advanced billing modules enabled.</p>
                        </div>
                      </div>
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
