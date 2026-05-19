'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/ui/MainLayout';
import { patientService } from '@/services/patientService';
import { CreatePatientRequest } from '@/types/api';
import { triggerGlobalToast } from '@/components/ui/Toast';
import { validateDOB } from '@/utils/dateValidator';

export function PatientRegistration({ patientId }: { patientId?: string } = {}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!patientId);
  const [errors, setErrors] = useState<Record<string, string>>({});
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
  const isEditMode = !!patientId;

  useEffect(() => {
    if (!patientId) return;

    const loadPatient = async () => {
      try {
        setInitialLoading(true);
        const response = await patientService.get(patientId);

        if (!response.success || !response.data) {
          triggerGlobalToast('Patient not found', 'error');
          router.push('/reception/patients');
          return;
        }

        const patient = response.data;
        const nameParts = patient.fullName.trim().split(/\s+/);
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ');

        setFormData({
          id: patient.id,
          firstName,
          lastName,
          fullName: patient.fullName,
          gender: patient.gender,
          dob: patient.dob,
          phone: patient.phone,
          address: patient.address,
          email: patient.email || '',
          patientCode: patient.patientCode,
          bloodGroup: patient.bloodGroup,
          medicalHistory: patient.medicalHistory
        });
      } catch (error) {
        console.error(error);
        triggerGlobalToast('Failed to load patient profile', 'error');
        router.push('/reception/patients');
      } finally {
        setInitialLoading(false);
      }
    };

    void loadPatient();
  }, [patientId, router]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = 'Phone number must be exactly 10 digits';
    }
    
    const dobValidation = validateDOB(formData.dob);
    if (!dobValidation.isValid) {
      newErrors.dob = dobValidation.message || 'Invalid date of birth';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      triggerGlobalToast('Please correct the errors in the form', 'error');
      return;
    }
    
    setLoading(true);
    try {
      const payload: CreatePatientRequest = {
        fullName: `${formData.firstName} ${formData.lastName}`.trim(),
        gender: formData.gender,
        dob: formData.dob,
        phone: formData.phone,
        address: formData.address || 'Not Provided',
        bloodGroup: formData.bloodGroup || undefined,
        medicalHistory: formData.medicalHistory || undefined,
      };

      // Only include email if it's not empty
      if (formData.email && formData.email.trim() !== '') {
        payload.email = formData.email.trim();
      }

      // Only include id and patientCode if we are in edit mode
      if (isEditMode) {
        payload.id = patientId;
        payload.patientCode = formData.patientCode;
      } else {
        // DIAGNOSTIC: Force a unique patient code to see if backend accepts it
        // and if it bypasses the auto-generator collision.
        payload.patientCode = `DEBUG-${Math.floor(Math.random() * 10_000)}`;
      }

      const res = isEditMode
        ? await patientService.update(patientId!, payload)
        : await patientService.create(payload);

      if (res.success) {
        triggerGlobalToast(
          patientId ? 'Patient profile updated successfully' : 'Patient registered successfully',
          'success'
        );
        router.push(patientId ? `/reception/patients/${patientId}` : '/reception/patients');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <MainLayout title="Loading..."><div className="p-8">Loading patient details...</div></MainLayout>;
  }

  return (
    <MainLayout title={isEditMode ? 'Edit Patient Profile' : 'Patient Registration'}>
      <div className="p-4 max-w-6xl mx-auto">
        {/* Breadcrumbs */}
        <nav className="flex items-center space-x-2 text-xs mb-6 text-slate-500">
          <span className="hover:text-primary cursor-pointer" onClick={() => router.push('/reception/dashboard')}>Dashboard</span>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <span className="hover:text-primary cursor-pointer" onClick={() => router.push('/reception/patients')}>Patients</span>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <span className="font-semibold text-slate-900">{isEditMode ? 'Edit Profile' : 'Patient Registration'}</span>
        </nav>

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-8 gap-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">
              {isEditMode ? 'Edit Patient Profile' : 'New Patient Registration'}
            </h2>
            <p className="text-sm text-slate-500">
              {isEditMode
                ? 'Update the patient record details below.'
                : 'Complete the details below to initialize a new electronic health record.'}
            </p>
          </div>
          <div className="bg-orange-50 border border-orange-100 px-4 py-3 sm:px-6 rounded-xl flex items-center gap-4 self-start md:self-auto w-full md:w-auto">
            <div className="flex-1 md:text-right">
              <p className="text-[10px] font-black text-primary uppercase tracking-wider">
                {isEditMode ? 'Patient Code' : 'UPIN Assignment'}
              </p>
              <p className="text-base sm:text-lg font-bold text-slate-900">
                {isEditMode ? (formData.patientCode || 'UNAVAILABLE') : 'AUTO-GENERATE'}
              </p>
            </div>
            <div className="h-10 w-px bg-orange-200"></div>
            <span className="material-symbols-outlined text-primary text-2xl sm:text-3xl">fingerprint</span>
          </div>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Canvas */}
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-8 shadow-sm">
              <div className="flex items-center gap-2 mb-6 sm:mb-8 pb-4 border-b border-slate-100">
                <span className="material-symbols-outlined text-primary">person</span>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">Personal Information</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 sm:gap-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase block">First Name</label>
                  <input 
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 transition-all bg-slate-50/50 text-sm ${errors.firstName ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:border-primary focus:ring-primary/20'}`} 
                    placeholder="e.g., Jonathan" 
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => {
                      setFormData({...formData, firstName: e.target.value});
                      if (errors.firstName) setErrors(prev => ({ ...prev, firstName: '' }));
                    }}
                  />
                  {errors.firstName && <p className="text-[10px] font-bold text-red-500 uppercase mt-1">{errors.firstName}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase block">Last Name</label>
                  <input 
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 transition-all bg-slate-50/50 text-sm ${errors.lastName ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:border-primary focus:ring-primary/20'}`} 
                    placeholder="e.g., Doe" 
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => {
                      setFormData({...formData, lastName: e.target.value});
                      if (errors.lastName) setErrors(prev => ({ ...prev, lastName: '' }));
                    }}
                  />
                  {errors.lastName && <p className="text-[10px] font-bold text-red-500 uppercase mt-1">{errors.lastName}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase block">Date of Birth</label>
                  <input 
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 transition-all bg-slate-50/50 text-sm ${errors.dob ? 'border-red-500 focus:border-red-500/20' : 'border-slate-200 focus:border-primary focus:ring-primary/20'}`} 
                    type="date"
                    value={formData.dob}
                    onChange={(e) => {
                      setFormData({...formData, dob: e.target.value});
                      if (errors.dob) setErrors(prev => ({ ...prev, dob: '' }));
                    }}
                  />
                  {errors.dob && <p className="text-[10px] font-bold text-red-500 uppercase mt-1">{errors.dob}</p>}
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
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 transition-all bg-slate-50/50 text-sm ${errors.phone ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:border-primary focus:ring-primary/20'}`} 
                    placeholder="e.g., 9876543210" 
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => {
                      setFormData({...formData, phone: e.target.value});
                      if (errors.phone) setErrors(prev => ({ ...prev, phone: '' }));
                    }}
                  />
                  {errors.phone && <p className="text-[10px] font-bold text-red-500 uppercase mt-1">{errors.phone}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase block">Email Address (Optional)</label>
                  <input 
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 transition-all bg-slate-50/50 text-sm ${errors.email ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:border-primary focus:ring-primary/20'}`} 
                    placeholder="e.g., patient@example.com" 
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({...formData, email: e.target.value});
                      if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                    }}
                  />
                  {errors.email && <p className="text-[10px] font-bold text-red-500 uppercase mt-1">{errors.email}</p>}
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase block">Address</label>
                  <input 
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-slate-50/50 text-sm" 
                    placeholder="e.g., 123 Main St, New York, NY" 
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                  />
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
                {isEditMode ? 'Save Changes' : 'Save & Register'}
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
}
