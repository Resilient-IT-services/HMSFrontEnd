'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/ui/MainLayout';
import apiClient from '@/services/apiClient';
import { hospitalService } from '@/services/hospitalService';
import { 
  ApiResponse, 
  UserFullProfileDTO, 
  HospitalResponse, 
  Role, 
  DetailedHospitalMembershipDTO,
  RoleAssignmentDTO,
  DoctorRoleDetails,
  NurseRoleDetails,
  AdminRoleDetails,
  PharmacistRoleDetails,
  ReceptionistRoleDetails
} from '@/types/api';

type ContractRole = 'DOCTOR' | 'NURSE' | 'RECEPTIONIST' | 'PHARMACIST' | 'ADMIN';

export default function AddContractPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [userData, setUserData] = useState<UserFullProfileDTO | null>(null);
  const [hospitals, setHospitals] = useState<HospitalResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>('');
  const [selectedRoles, setSelectedRoles] = useState<ContractRole[]>([]);
  
  // Role Details State
  const [doctorDetails, setDoctorDetails] = useState<Partial<DoctorRoleDetails>>({
    consultationFee: 0,
    commissionType: 'PERCENTAGE',
    commissionValue: 0,
    visitingConsultant: false
  });
  
  const [receptionistDetails, setReceptionistDetails] = useState<Partial<ReceptionistRoleDetails>>({
    deskLocation: '',
    emergencyContactNumber: ''
  });

  const [adminDetails, setAdminDetails] = useState<Partial<AdminRoleDetails>>({
    officeLocation: '',
    departmentHead: false
  });

  const [nurseDetails, setNurseDetails] = useState<Partial<NurseRoleDetails>>({
    floorLocation: '',
    shiftType: 'DAY'
  });

  const [pharmacistDetails, setPharmacistDetails] = useState<Partial<PharmacistRoleDetails>>({
    counterLocation: '',
    pharmacyWing: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [userRes, hospRes] = await Promise.all([
          apiClient.get<ApiResponse<UserFullProfileDTO>>(`/users/${id}/full-profile`),
          hospitalService.list()
        ]);
        
        if (userRes.data.success && userRes.data.data) {
          setUserData(userRes.data.data);
        }
        if (hospRes.success) {
          setHospitals(hospRes.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const toggleRole = (role: ContractRole) => {
    if (selectedRoles.includes(role)) {
      setSelectedRoles(selectedRoles.filter(r => r !== role));
    } else {
      setSelectedRoles([...selectedRoles, role]);
    }
  };

  const handleSave = async () => {
    if (!selectedHospitalId) {
      alert('Please select a hospital');
      return;
    }
    if (selectedRoles.length === 0) {
      alert('Please select at least one role');
      return;
    }

    try {
      setSaving(true);
      
      const roleAssignments: RoleAssignmentDTO[] = selectedRoles.map(roleCode => {
        const assignment: any = {
          roleCode,
          departmentName: 'General', // Default or could be added to UI
          active: true
        };

        if (roleCode === 'DOCTOR') assignment.doctorDetails = doctorDetails;
        if (roleCode === 'NURSE') assignment.nurseDetails = nurseDetails;
        if (roleCode === 'ADMIN') assignment.adminDetails = adminDetails;
        if (roleCode === 'PHARMACIST') assignment.pharmacistDetails = pharmacistDetails;
        if (roleCode === 'RECEPTIONIST') assignment.receptionistDetails = receptionistDetails;

        return assignment;
      });

      const newMembership: DetailedHospitalMembershipDTO = {
        hospitalId: selectedHospitalId,
        roleAssignments
      };

      // In a real scenario, we might have a specific endpoint to add a membership
      // For now, let's assume we update the user's memberships
      const updatedMemberships = [...(userData?.detailedMemberships || []), newMembership];
      
      const res = await apiClient.put(`/users/${id}`, {
        ...userData,
        detailedMemberships: updatedMemberships
      });

      if (res.data.success) {
        router.push(`/admin/users/${id}`);
      }
    } catch (error) {
      console.error('Failed to save contract', error);
      alert('Failed to save contract');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <MainLayout title="Loading..."><div className="p-8 text-center">Loading details...</div></MainLayout>;
  if (!userData) return <MainLayout title="Error"><div className="p-8 text-center">User not found.</div></MainLayout>;

  return (
    <MainLayout title={`Add Contract - ${userData.fullName}`}>
      <div className="max-w-5xl mx-auto pb-24">
        {/* Breadcrumbs & Header */}
        <div className="mb-8">
          <nav className="flex items-center space-x-2 text-gray-500 text-[11px] font-bold uppercase tracking-widest mb-2">
            <button onClick={() => router.push(`/admin/users/${id}`)} className="hover:text-primary transition-colors">Contracts</button>
            <span className="material-symbols-outlined text-sm">chevron_right</span>
            <span className="text-primary">New Contract Assignment</span>
          </nav>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-headline-xl text-on-surface">Add Contract</h1>
              <span className="material-symbols-outlined text-gray-400 text-lg cursor-help" title="Configure hospital affiliations and role-specific employment parameters.">info</span>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => router.back()}
                className="btn-secondary"
              >
                Back to List
              </button>
              <button 
                onClick={handleSave}
                disabled={saving}
                className="btn-primary"
              >
                <span className="material-symbols-outlined">check_circle</span>
                {saving ? 'Saving...' : 'Save Contract'}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-section-gap">
          {/* Section 1: Hospital Selection */}
          <section className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
            <div className="flex items-center space-x-2 mb-6">
              <h2 className="text-headline-sm font-headline-sm text-gray-900 uppercase tracking-wide">Hospital Selection</h2>
            </div>
            <div className="w-full">
              <label className="block text-label-md font-label-md text-gray-700 mb-2">Hospital Name & City <span className="text-primary">*</span></label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">apartment</span>
                <select 
                  className="form-input pl-12"
                  value={selectedHospitalId}
                  onChange={(e) => setSelectedHospitalId(e.target.value)}
                >
                  <option value="">Select a hospital...</option>
                  {hospitals.map(h => (
                    <option key={h.id} value={h.id}>{h.name} ({h.code})</option>
                  ))}
                </select>
              </div>
              <p className="text-body-sm text-gray-400 mt-2 italic">The contract will be automatically linked to this facility's billing unit.</p>
            </div>
          </section>

          {/* Section 2: Role Selection */}
          <section className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
            <div className="flex items-center space-x-2 mb-6">
              <h2 className="text-headline-sm font-headline-sm text-gray-900 uppercase tracking-wide">Role Assignment</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {(['DOCTOR', 'NURSE', 'RECEPTIONIST', 'PHARMACIST', 'ADMIN'] as ContractRole[]).map(role => {
                const isSelected = selectedRoles.includes(role);
                return (
                  <button
                    key={role}
                    onClick={() => toggleRole(role)}
                    className={`px-6 py-2 rounded-full flex items-center space-x-2 border transition-all ${
                      isSelected 
                        ? 'bg-orange-50 text-orange-600 border-orange-200 shadow-sm' 
                        : 'bg-white text-gray-500 border-gray-200 hover:border-orange-200'
                    }`}
                  >
                    <span className="text-label-sm font-bold tracking-tight">{role}</span>
                    {isSelected && <span className="material-symbols-outlined text-sm">close</span>}
                    {!isSelected && <span className="material-symbols-outlined text-sm">add</span>}
                  </button>
                );
              })}
            </div>
            {selectedRoles.length > 0 && (
              <div className="mt-6 flex items-center space-x-3 bg-slate-50 border border-slate-100 rounded-lg p-3">
                <span className="material-symbols-outlined text-orange-600 text-lg">check_circle</span>
                <p className="text-body-sm text-gray-700">Configuring profiles for {selectedRoles.join(', ')}.</p>
              </div>
            )}
          </section>

          {/* Section 3: Dynamic Contract Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
            {/* Doctor Card */}
            {selectedRoles.includes('DOCTOR') && (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                      <span className="material-symbols-outlined text-orange-600">medical_services</span>
                    </div>
                    <div>
                      <h3 className="text-headline-sm font-headline-sm text-gray-900">Doctor Profile</h3>
                      <p className="text-body-sm text-gray-500">Core clinical parameters</p>
                    </div>
                  </div>
                  <button onClick={() => toggleRole('DOCTOR')} className="text-gray-400 hover:text-red-500 transition-colors">
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </div>
                <div className="p-6 space-y-5 flex-1">
                  <div>
                    <label className="block text-label-md font-label-md text-gray-700 mb-1.5 uppercase text-[10px] tracking-widest font-bold">Consultation Fee ($) <span className="text-orange-600">*</span></label>
                    <input 
                      className="form-input" 
                      placeholder="0.00" 
                      type="number"
                      value={doctorDetails.consultationFee}
                      onChange={(e) => setDoctorDetails({...doctorDetails, consultationFee: Number(e.target.value)})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-label-md font-label-md text-gray-700 mb-1.5 uppercase text-[10px] tracking-widest font-bold">Commission Value</label>
                      <input 
                        className="form-input" 
                        placeholder="e.g. 15" 
                        type="number"
                        value={doctorDetails.commissionValue}
                        onChange={(e) => setDoctorDetails({...doctorDetails, commissionValue: Number(e.target.value)})}
                      />
                    </div>
                    <div>
                      <label className="block text-label-md font-label-md text-gray-700 mb-1.5 uppercase text-[10px] tracking-widest font-bold">Employment</label>
                      <select 
                        className="form-input"
                        value={doctorDetails.visitingConsultant ? 'Visiting' : 'Full-time'}
                        onChange={(e) => setDoctorDetails({...doctorDetails, visitingConsultant: e.target.value === 'Visiting'})}
                      >
                        <option value="Full-time">Full-time</option>
                        <option value="Visiting">Visiting</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Receptionist Card */}
            {selectedRoles.includes('RECEPTIONIST') && (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <span className="material-symbols-outlined text-blue-600">person_search</span>
                    </div>
                    <div>
                      <h3 className="text-headline-sm font-headline-sm text-gray-900">Receptionist Profile</h3>
                      <p className="text-body-sm text-gray-500">Administrative details</p>
                    </div>
                  </div>
                  <button onClick={() => toggleRole('RECEPTIONIST')} className="text-gray-400 hover:text-red-500 transition-colors">
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </div>
                <div className="p-6 space-y-5 flex-1">
                  <div>
                    <label className="block text-label-md font-label-md text-gray-700 mb-1.5 uppercase text-[10px] tracking-widest font-bold">Desk Location <span className="text-orange-600">*</span></label>
                    <input 
                      className="form-input" 
                      placeholder="e.g. Front Desk A, Ward 4" 
                      type="text"
                      value={receptionistDetails.deskLocation}
                      onChange={(e) => setReceptionistDetails({...receptionistDetails, deskLocation: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-label-md font-label-md text-gray-700 mb-1.5 uppercase text-[10px] tracking-widest font-bold">Emergency Contact</label>
                    <input 
                      className="form-input" 
                      placeholder="Phone number" 
                      type="tel"
                      value={receptionistDetails.emergencyContactNumber}
                      onChange={(e) => setReceptionistDetails({...receptionistDetails, emergencyContactNumber: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Nurse Card */}
            {selectedRoles.includes('NURSE') && (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                      <span className="material-symbols-outlined text-green-600">medical_services</span>
                    </div>
                    <div>
                      <h3 className="text-headline-sm font-headline-sm text-gray-900">Nurse Profile</h3>
                      <p className="text-body-sm text-gray-500">Ward & Shift details</p>
                    </div>
                  </div>
                  <button onClick={() => toggleRole('NURSE')} className="text-gray-400 hover:text-red-500 transition-colors">
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </div>
                <div className="p-6 space-y-5 flex-1">
                  <div>
                    <label className="block text-label-md font-label-md text-gray-700 mb-1.5 uppercase text-[10px] tracking-widest font-bold">Floor Location</label>
                    <input 
                      className="form-input" 
                      placeholder="e.g. Floor 2, ICU" 
                      type="text"
                      value={nurseDetails.floorLocation}
                      onChange={(e) => setNurseDetails({...nurseDetails, floorLocation: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-label-md font-label-md text-gray-700 mb-1.5 uppercase text-[10px] tracking-widest font-bold">Shift Type</label>
                    <select 
                      className="form-input"
                      value={nurseDetails.shiftType}
                      onChange={(e) => setNurseDetails({...nurseDetails, shiftType: e.target.value as any})}
                    >
                      <option value="DAY">Day Shift</option>
                      <option value="NIGHT">Night Shift</option>
                      <option value="ROTATIONAL">Rotational</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Admin Card */}
            {selectedRoles.includes('ADMIN') && (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col md:col-span-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                      <span className="material-symbols-outlined text-green-600">admin_panel_settings</span>
                    </div>
                    <div>
                      <h3 className="text-headline-sm font-headline-sm text-gray-900">Admin Profile</h3>
                      <p className="text-body-sm text-gray-500">System access & permissions</p>
                    </div>
                  </div>
                  <button onClick={() => toggleRole('ADMIN')} className="text-gray-400 hover:text-red-500 transition-colors">
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-label-md font-label-md text-gray-700 mb-1.5 uppercase text-[10px] tracking-widest font-bold">Access Level</label>
                    <div className="flex space-x-4 mt-3">
                      {['Standard', 'Privileged', 'Superuser'].map(level => (
                        <label key={level} className="flex items-center space-x-2 cursor-pointer">
                          <input 
                            type="radio" 
                            name="accessLevel"
                            className="text-orange-600 focus:ring-orange-500/20"
                            checked={level === (adminDetails.officeLocation === level ? level : 'Standard')} // Dummy logic for demo
                            onChange={() => setAdminDetails({...adminDetails, officeLocation: level})}
                          />
                          <span className="text-body-md text-gray-700">{level}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-label-md font-label-md text-gray-700 mb-1.5 uppercase text-[10px] tracking-widest font-bold">Notes</label>
                    <textarea 
                      className="form-input min-h-[80px]" 
                      placeholder="Internal management notes..."
                      value={adminDetails.officeLocation} // Reusing officeLocation for notes if needed, or just leave as demo
                      onChange={(e) => setAdminDetails({...adminDetails, officeLocation: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Pharmacist Card */}
            {selectedRoles.includes('PHARMACIST') && (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
                      <span className="material-symbols-outlined text-teal-600">medication</span>
                    </div>
                    <div>
                      <h3 className="text-headline-sm font-headline-sm text-gray-900">Pharmacist Profile</h3>
                      <p className="text-body-sm text-gray-500">Inventory & Dispensing</p>
                    </div>
                  </div>
                  <button onClick={() => toggleRole('PHARMACIST')} className="text-gray-400 hover:text-red-500 transition-colors">
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </div>
                <div className="p-6 space-y-5 flex-1">
                  <div>
                    <label className="block text-label-md font-label-md text-gray-700 mb-1.5 uppercase text-[10px] tracking-widest font-bold">Counter Location</label>
                    <input 
                      className="form-input" 
                      placeholder="e.g. Counter 1, Ground Floor" 
                      type="text"
                      value={pharmacistDetails.counterLocation}
                      onChange={(e) => setPharmacistDetails({...pharmacistDetails, counterLocation: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-label-md font-label-md text-gray-700 mb-1.5 uppercase text-[10px] tracking-widest font-bold">Pharmacy Wing</label>
                    <input 
                      className="form-input" 
                      placeholder="e.g. East Wing" 
                      type="text"
                      value={pharmacistDetails.pharmacyWing}
                      onChange={(e) => setPharmacistDetails({...pharmacistDetails, pharmacyWing: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Action Bar (Fixed) */}
      <div className="fixed bottom-0 right-0 left-64 bg-white/95 backdrop-blur-md border-t border-gray-200 px-8 py-4 flex justify-between items-center z-40">
        <div className="flex items-center gap-2 text-body-sm text-gray-500">
          <span className="material-symbols-outlined text-green-500" style={{ fontVariationSettings: "'FILL' 1" }}>cloud_done</span>
          Last updated moments ago
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => router.back()}
            className="btn-secondary"
          >
            Discard
          </button>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="btn-primary"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </MainLayout>
  );
}
