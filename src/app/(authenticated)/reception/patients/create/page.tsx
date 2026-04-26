'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/ui/MainLayout';
import { patientService } from '@/services/patientService';
import { CreatePatientRequest } from '@/types/api';
import { triggerGlobalToast } from '@/components/ui/Toast';

const PatientRegistration = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreatePatientRequest & { firstName: string, lastName: string, email: string }>({
    firstName: '',
    lastName: '',
    gender: 'MALE',
    dob: '',
    phone: '',
    address: '',
    email: '',
    fullName: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: CreatePatientRequest = {
        fullName: `${formData.firstName} ${formData.lastName}`.trim(),
        gender: formData.gender,
        dob: formData.dob,
        phone: formData.phone,
        address: formData.address || 'Not Provided'
      };

      const res = await patientService.create(payload);
      if (res.success) {
        triggerGlobalToast('Patient registered successfully', 'success');
        router.push('/reception/patients');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout title="Patient Registration">
      <div className="p-4 max-w-6xl mx-auto">
        {/* Breadcrumbs */}
        <nav className="flex items-center space-x-2 text-xs mb-6 text-slate-500">
          <span className="hover:text-primary cursor-pointer" onClick={() => router.push('/reception/dashboard')}>Dashboard</span>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <span className="font-semibold text-slate-900">Patient Registration</span>
        </nav>

        {/* Page Header */}
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-1">New Patient Registration</h2>
            <p className="text-slate-500">Complete the details below to initialize a new electronic health record.</p>
          </div>
          <div className="bg-orange-50 border border-orange-100 px-6 py-3 rounded-xl flex items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] font-black text-primary uppercase tracking-wider">UPIN Assignment</p>
              <p className="text-lg font-bold text-slate-900">AUTO-GENERATE</p>
            </div>
            <div className="h-10 w-px bg-orange-200"></div>
            <span className="material-symbols-outlined text-primary text-3xl">fingerprint</span>
          </div>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Canvas */}
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
              <div className="flex items-center gap-2 mb-8 pb-4 border-b border-slate-100">
                <span className="material-symbols-outlined text-primary">person</span>
                <h3 className="text-xl font-bold text-slate-900">Personal Information</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase block">First Name</label>
                  <input 
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-slate-50/50 text-sm" 
                    placeholder="e.g., Jonathan" 
                    required 
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase block">Last Name</label>
                  <input 
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-slate-50/50 text-sm" 
                    placeholder="e.g., Doe" 
                    required 
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase block">Date of Birth</label>
                  <input 
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-slate-50/50 text-sm" 
                    required 
                    type="date"
                    value={formData.dob}
                    onChange={(e) => setFormData({...formData, dob: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase block">Gender</label>
                  <select 
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-slate-50/50 text-sm appearance-none"
                    value={formData.gender}
                    onChange={(e) => setFormData({...formData, gender: e.target.value as any})}
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase block">Phone Number</label>
                  <input 
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-slate-50/50 text-sm" 
                    placeholder="Phone number" 
                    required 
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase block">Address</label>
                  <input 
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-slate-50/50 text-sm" 
                    placeholder="Patient address" 
                    required 
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                  />
                </div>
              </div>
            </section>

            <section className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm opacity-60">
              <div className="flex items-center gap-2 mb-8 pb-4 border-b border-slate-100">
                <span className="material-symbols-outlined text-primary">emergency</span>
                <h3 className="text-xl font-bold text-slate-900">Emergency Contact (Optional)</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase block">Full Name</label>
                  <input className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50/50 text-sm" placeholder="Next of kin name" type="text" disabled />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase block">Relationship</label>
                  <input className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50/50 text-sm" placeholder="e.g., Spouse, Parent" type="text" disabled />
                </div>
              </div>
            </section>

            {/* Action Bar */}
            <div className="flex items-center justify-end gap-4 pt-4">
              <button 
                type="button"
                onClick={() => router.back()}
                className="px-8 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={loading}
                className="px-10 py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 hover:opacity-90 transition-all active:scale-95 flex items-center gap-2"
              >
                {loading ? (
                  <span className="animate-spin material-symbols-outlined">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined text-[20px]">how_to_reg</span>
                )}
                Save & Register
              </button>
            </div>
          </div>

          {/* Sidebar Context/Feedback */}
          <div className="space-y-8">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-sm">verified</span>
                Real-time Validation
              </h4>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className={`material-symbols-outlined text-sm mt-1 ${formData.firstName && formData.lastName ? 'text-green-500' : 'text-slate-300'}`}>check_circle</span>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Identity check</p>
                    <p className="text-[10px] text-slate-500 leading-tight">UPIN will be generated upon successful save.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className={`material-symbols-outlined text-sm mt-1 ${formData.phone && formData.dob ? 'text-green-500' : 'text-orange-400'}`}>
                    {formData.phone && formData.dob ? 'check_circle' : 'error_outline'}
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Required Fields</p>
                    <p className="text-[10px] text-slate-500 leading-tight">Phone Number and Date of Birth are mandatory.</p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-slate-200 aspect-[4/3] shadow-sm">
              <img 
                alt="Medical Clinic Interior" 
                className="w-full h-full object-cover" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAviafQziMbx0SXqJEVyL1i_V5_WO5cwe7WOAjlToVJHYxF67gNjf_jkvLAUPifsB2MDetT0Zlx7Eviffa7goH6iUixCv7qLzzfK85gtp3KlMqSzbPRb_pHrdv_b6orKlafF1fwsScmqPldgV7b-NbwlGxgYZLFo8vEdlbxxafmwH3ggq549BphkIfNWJeqkKnL7e5Apc_RDdOkv2I-WrQ34vmnE-3_vHb_uq448qyxDtWwyfVZCw85bMF9Tx7Pl673bQu33f1j21U"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-6">
                <p className="text-white text-xs italic">"Precision in registration ensures excellence in clinical care."</p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </MainLayout>
  );
};

export default PatientRegistration;
