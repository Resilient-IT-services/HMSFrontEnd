'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  UserRequestDTO, 
  UserFullProfileDTO, 
  HospitalResponse, 
  HospitalMembershipDTO, 
  RoleAssignmentDTO,
  Role
} from '@/types/api';
import { hospitalService } from '@/services/hospitalService';
import apiClient from '@/services/apiClient';

interface UserFormProps {
  initialData?: UserFullProfileDTO;
  isEdit?: boolean;
}

interface ValidationErrors {
  [key: string]: string;
}

const UserForm: React.FC<UserFormProps> = ({ initialData, isEdit }) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'personal' | 'contracts' | 'profile'>('personal');
  
  // Helper for LocalTime to string (HH:mm)
  const localTimeToString = (lt?: any): string => {
    if (!lt) return '09:00';
    const h = lt.hour?.toString().padStart(2, '0') || '00';
    const m = lt.minute?.toString().padStart(2, '0') || '00';
    return `${h}:${m}`;
  };

  // Helper for string (HH:mm) to LocalTime
  const stringToLocalTime = (s: string) => {
    const [h, m] = s.split(':').map(Number);
    return { hour: h, minute: m, second: 0, nano: 0 };
  };

  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const [hospitals, setHospitals] = useState<HospitalResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  
  const [formData, setFormData] = useState<UserRequestDTO>({
    username: initialData?.username || '',
    fullName: initialData?.fullName || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    dob: initialData?.dob || '',
    gender: (initialData?.gender as any) || 'MALE',
    password: '',
    superuser: initialData?.superuser || false,
    memberships: initialData?.memberships || [],
    doctorInfo: initialData?.doctorInfo,
    nurseInfo: initialData?.nurseInfo,
    pharmacistInfo: initialData?.pharmacistInfo,
    receptionistInfo: initialData?.receptionistInfo,
  });

  // Derived Roles to automate Profile Information tab
  const assignedRoles = useMemo(() => {
    const roles = new Set<string>();
    formData.memberships?.forEach(m => {
      m.roleAssignments?.forEach(ra => roles.add(ra.roleCode));
    });
    return Array.from(roles);
  }, [formData.memberships]);

  useEffect(() => {
    const fetchHospitals = async () => {
      const res = await hospitalService.list();
      if (res.success && res.data) setHospitals(res.data.content || []);
    };
    fetchHospitals();
  }, []);

  const validate = (): boolean => {
    const errors: ValidationErrors = {};
    
    // Basic info validation
    if (!formData.fullName?.trim()) errors.fullName = 'Full name is required';
    if (!formData.username?.trim()) errors.username = 'Username is required';
    if (!isEdit && !formData.password?.trim()) errors.password = 'Password is required';
    if (!formData.email?.trim()) errors.email = 'Email address is required';
    if (!formData.phone?.trim()) errors.phone = 'Phone number is required';
    if (!formData.dob) errors.dob = 'Date of birth is required';
    
    // Contract validation - Optional for superusers
    if (!formData.superuser) {
      if (!formData.memberships || formData.memberships.length === 0) {
        errors.memberships = 'At least one hospital contract is required for standard staff.';
      } else {
        formData.memberships.forEach((m, idx) => {
          if (!m.hospitalId) errors[`membership_${idx}_hospital`] = 'Hospital is required';
          if (!m.roleAssignments || m.roleAssignments.length === 0) {
            errors[`membership_${idx}_roles`] = 'At least one role is required';
          } else {
            m.roleAssignments.forEach((ra, raIdx) => {
              if (ra.roleCode === 'DOCTOR') {
                if (!ra.doctorDetails?.consultationFee) errors[`membership_${idx}_role_${raIdx}_fee`] = 'Fee is required';
              }
              if (ra.roleCode === 'NURSE') {
                if (!ra.nurseDetails?.floorLocation) errors[`membership_${idx}_role_${raIdx}_floor`] = 'Floor is required';
              }
            });
          }
        });
      }
    }

    // Profile info validation based on active roles
    if (assignedRoles.includes('DOCTOR')) {
      if (!formData.doctorInfo?.specialization) errors.specialization = 'Doctor specialization is required';
      if (!formData.doctorInfo?.licenseNumber) errors.licenseNumber = 'Medical license number is required';
    }
    if (assignedRoles.includes('NURSE')) {
      if (!formData.nurseInfo?.nursingLicenseNo) errors.nurseLicense = 'Nursing license number is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (isAddingContract) {
      confirmAddContract();
      return;
    }

    if (!validate()) {
      // If validation fails, stay on the page and show errors
      return;
    }

    try {
      setLoading(true);
      const url = isEdit ? `/users/${initialData?.id}` : '/users';
      const method = isEdit ? 'put' : 'post';
      
      const res = await apiClient[method](url, formData);
      if (res.data.success) {
        router.push('/admin/users');
      }
    } catch (error: any) {
      console.error('Failed to save user', error);
      // Backend validation errors
      if (error.response?.data?.details) {
        setValidationErrors(error.response.data.details);
      }
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const [isAddingContract, setIsAddingContract] = useState(false);
  const [editingContractIndex, setEditingContractIndex] = useState<number | null>(null);
  const [newContract, setNewContract] = useState<HospitalMembershipDTO>({
    hospitalId: '',
    roleAssignments: []
  });

  const handleAddRoleToNewContract = (role: string) => {
    const assignments = newContract.roleAssignments || [];
    const exists = assignments.find(r => r.roleCode === role);
    if (exists) {
      setNewContract({
        ...newContract,
        roleAssignments: assignments.filter(r => r.roleCode !== role)
      });
    } else {
      const assignment: RoleAssignmentDTO = {
        roleCode: role,
        departmentName: 'General',
        active: true,
        assignmentId: '',
      };
      if (role === 'DOCTOR') assignment.doctorDetails = { consultationFee: 0, commissionValue: 0, visitingConsultant: false } as any;
      if (role === 'NURSE') assignment.nurseDetails = { floorLocation: '', shiftType: 'DAY' } as any;
      if (role === 'RECEPTIONIST') assignment.receptionistDetails = { deskLocation: '', emergencyContactNumber: '' } as any;
      if (role === 'ADMIN') assignment.adminDetails = { officeLocation: 'Standard', departmentHead: false } as any;
      
      setNewContract({
        ...newContract,
        roleAssignments: [...assignments, assignment]
      });
    }
  };

  const duplicateContract = (contract: HospitalMembershipDTO) => {
    setNewContract({
      ...contract,
      hospitalId: '', // Reset hospital for the new copy
      hospitalName: undefined
    });
    setEditingContractIndex(null);
    setIsAddingContract(true);
  };

  const confirmAddContract = () => {
    if (!newContract.hospitalId) {
      setValidationErrors({...validationErrors, newContractHospital: 'Hospital is required'});
      return;
    }
    
    // Check for duplicate hospital if creating new
    if (editingContractIndex === null) {
      const exists = formData.memberships?.some(m => String(m.hospitalId) === String(newContract.hospitalId));
      if (exists) {
        alert('User already has a contract with this hospital');
        return;
      }
    }

    if (!newContract.roleAssignments || newContract.roleAssignments.length === 0) {
      alert('Select at least one role');
      return;
    }
    
    const hosp = hospitals.find(h => String(h.id) === String(newContract.hospitalId));
    
    // Auto-initialize profile info objects if they don't exist for these roles
    const updatedInfo: any = {};
    newContract.roleAssignments.forEach(ra => {
      const key = `${ra.roleCode.toLowerCase()}Info` as keyof UserRequestDTO;
      if (!formData[key]) {
        if (ra.roleCode === 'DOCTOR') updatedInfo.doctorInfo = { specialization: '', bio: '', licenseNumber: '', education: { qualifications: [] } };
        if (ra.roleCode === 'NURSE') updatedInfo.nurseInfo = { nursingLicenseNo: '', certificationLevel: 'RN' };
        if (ra.roleCode === 'PHARMACIST') updatedInfo.pharmacistInfo = { pciRegNo: '', qualification: '' };
        if (ra.roleCode === 'RECEPTIONIST') updatedInfo.receptionistInfo = { languagesSpoken: { fluencies: [] }, insuranceSpecialist: false };
      }
    });

    const updatedMemberships = [...(formData.memberships || [])];
    if (editingContractIndex !== null) {
      updatedMemberships[editingContractIndex] = { ...newContract, hospitalName: hosp?.name };
    } else {
      updatedMemberships.push({ ...newContract, hospitalName: hosp?.name });
    }

    setFormData({
      ...formData,
      ...updatedInfo,
      memberships: updatedMemberships
    });
    setIsAddingContract(false);
    setEditingContractIndex(null);
    setNewContract({ hospitalId: '', roleAssignments: [] });
    setValidationErrors({});
  };

  const hasTabError = (tab: 'personal' | 'contracts' | 'profile'): boolean => {
    if (tab === 'personal') {
      return !!(validationErrors.fullName || validationErrors.username || validationErrors.password || validationErrors.email || validationErrors.phone || validationErrors.dob);
    }
    if (tab === 'contracts') {
      return !!(validationErrors.memberships || Object.keys(validationErrors).some(k => k.startsWith('membership_')));
    }
    if (tab === 'profile') {
      return !!(validationErrors.specialization || validationErrors.licenseNumber || validationErrors.nurseDept || validationErrors.nurseLicense);
    }
    return false;
  };

  const renderFieldError = (field: string) => {
    if (validationErrors[field]) {
      return <p className="text-error text-[10px] font-bold mt-1 uppercase tracking-tight">{validationErrors[field]}</p>;
    }
    return null;
  };

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <form onSubmit={handleSubmit}>
        {/* Page Header */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-orange-50 flex items-center justify-center text-primary text-2xl font-bold border-4 border-orange-100 shadow-sm">
                {formData.fullName ? getInitials(formData.fullName) : '?'}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-green-500 w-5 h-5 rounded-full border-4 border-white"></div>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-headline-xl text-on-surface">{isEdit ? 'Edit User Profile' : 'Create New User'}</h1>
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded uppercase tracking-wider">Active</span>
              </div>
              <p className="font-body-lg text-gray-500">{formData.fullName || 'New Staff Member'}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center gap-2"
            >
              <span className="material-symbols-outlined">save</span>
              {loading ? 'Saving...' : isAddingContract ? 'Save Contract & User' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Main Content with Tabs */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          {/* Tab Headers */}
          <div className="flex border-b border-gray-100 bg-gray-50/30">
            {[
              { id: 'personal', label: 'Personal Info', icon: 'person' },
              { id: 'contracts', label: 'Contracts', icon: 'description' },
              { id: 'profile', label: 'Profile Information', icon: 'badge' }
            ].map((tab) => {
              const hasError = hasTabError(tab.id as any);
              const isActive = activeTab === tab.id;
              return (
                <button 
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-8 py-4 font-bold text-sm flex items-center gap-2 transition-all border-b-2 ${
                    isActive ? 'border-primary text-primary bg-white' : 'border-transparent text-gray-500 hover:bg-gray-50'
                  } ${hasError ? 'text-error' : ''}`}
                >
                  <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                  {tab.label}
                  {hasError && <span className="material-symbols-outlined text-error text-sm animate-pulse">error</span>}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {activeTab === 'personal' && (
              <div className="space-y-12">
                <div>
                  <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
                    <h3 className="font-headline-sm text-on-surface uppercase tracking-wide text-xs font-black">Global Identity</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div className="flex flex-col gap-1.5">
                      <label className="font-label-sm text-gray-700 uppercase">Full Name <span className="text-primary">*</span></label>
                      <input 
                        className={`form-input ${validationErrors.fullName ? 'border-error ring-1 ring-error/20' : ''}`}
                        type="text" 
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      />
                      {renderFieldError('fullName')}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="font-label-sm text-gray-700 uppercase">Username <span className="text-primary">*</span></label>
                      <input 
                        className={`form-input ${validationErrors.username ? 'border-error ring-1 ring-error/20' : ''}`}
                        type="text" 
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        disabled={isEdit}
                      />
                      {renderFieldError('username')}
                    </div>
                    {!isEdit && (
                      <div className="flex flex-col gap-1.5">
                        <label className="font-label-sm text-gray-700 uppercase">Password <span className="text-primary">*</span></label>
                        <input 
                          className={`form-input ${validationErrors.password ? 'border-error ring-1 ring-error/20' : ''}`}
                          type="password" 
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                        {renderFieldError('password')}
                      </div>
                    )}
                    <div className="flex flex-col gap-1.5">
                      <label className="font-label-sm text-gray-700 uppercase">Email Address <span className="text-primary">*</span></label>
                      <input className={`form-input ${validationErrors.email ? 'border-error' : ''}`} type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                      {renderFieldError('email')}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="font-label-sm text-gray-700 uppercase">Primary Phone <span className="text-primary">*</span></label>
                      <input className={`form-input ${validationErrors.phone ? 'border-error' : ''}`} type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                      {renderFieldError('phone')}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="font-label-sm text-gray-700 uppercase">Date of Birth <span className="text-primary">*</span></label>
                      <input 
                        className={`form-input ${validationErrors.dob ? 'border-error ring-1 ring-error/20' : ''}`}
                        type="date" 
                        value={formData.dob}
                        onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                      />
                      {renderFieldError('dob')}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="font-label-sm text-gray-700 uppercase">Gender Identity</label>
                      <select className="form-input" value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}>
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5 md:col-span-2">
                      <label className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                        <input 
                          type="checkbox" 
                          className="w-5 h-5 accent-primary"
                          checked={formData.superuser}
                          onChange={(e) => setFormData({ ...formData, superuser: e.target.checked })}
                        />
                        <div>
                          <p className="font-bold text-sm text-on-surface">System Administrator Privileges</p>
                          <p className="text-xs text-secondary">Grant this user full access to global system settings across all hospitals.</p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'contracts' && (
              <div className="p-container-padding">
                {!isAddingContract ? (
                  <div className="flex flex-col gap-6">
                    <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                      <div className="flex flex-col gap-1">
                        <h3 className="font-headline-sm text-on-surface uppercase tracking-wide text-xs font-black">Hospital Memberships</h3>
                        {validationErrors.memberships && <p className="text-error text-[10px] font-bold uppercase tracking-tight">{validationErrors.memberships}</p>}
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setIsAddingContract(true)}
                        className="bg-primary-container text-white px-4 py-2 rounded-lg text-sm font-bold transition-all hover:opacity-90 active:scale-95 flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-lg">add_business</span>
                        Add Contract
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {formData.memberships?.map((m, idx) => {
                        const hosp = hospitals.find(h => String(h.id) === String(m.hospitalId));
                        return (
                          <div key={idx} className="p-5 border border-gray-200 rounded-xl hover:border-primary-container transition-all bg-white font-body-md shadow-sm group">
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex gap-4">
                                <div className="w-12 h-12 rounded-lg bg-gray-50 flex items-center justify-center text-primary">
                                  <span className="material-symbols-outlined">location_city</span>
                                </div>
                                <div>
                                  <h4 className="font-bold text-sm">{m.hospitalName || hosp?.name || 'Hospital ID: ' + m.hospitalId}</h4>
                                  <p className="text-[11px] text-gray-500 font-bold uppercase tracking-tight">
                                    {(m.roleAssignments || []).map(ra => ra.roleCode).join(' • ')}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button 
                                  type="button"
                                  onClick={() => duplicateContract(m)}
                                  title="Duplicate Contract to new hospital"
                                  className="text-gray-400 hover:text-primary opacity-0 group-hover:opacity-100 transition-all"
                                >
                                  <span className="material-symbols-outlined text-lg">content_copy</span>
                                </button>
                                <button 
                                  type="button"
                                  onClick={() => {
                                    setNewContract(m);
                                    setEditingContractIndex(idx);
                                    setIsAddingContract(true);
                                  }}
                                  className="text-gray-400 hover:text-primary opacity-0 group-hover:opacity-100 transition-all"
                                >
                                  <span className="material-symbols-outlined text-lg">edit</span>
                                </button>
                                <button 
                                  type="button"
                                  onClick={() => {
                                    const updated = [...(formData.memberships || [])];
                                    updated.splice(idx, 1);
                                    setFormData({ ...formData, memberships: updated });
                                  }}
                                  className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                >
                                  <span className="material-symbols-outlined text-lg">delete</span>
                                </button>
                              </div>
                            </div>
                            <div className="space-y-2">
                              {(m.roleAssignments || []).map((ra, raIdx) => (
                                <div key={raIdx} className="flex justify-between items-center p-2 bg-gray-50 rounded border border-gray-100">
                                  <span className="text-[10px] font-black text-primary uppercase">{ra.roleCode}</span>
                                  {ra.doctorDetails && <span className="text-[10px] font-bold">${ra.doctorDetails.consultationFee} Fee</span>}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                      {(!formData.memberships || formData.memberships.length === 0) && (
                        <div className="md:col-span-2 py-12 text-center bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center gap-4">
                          <span className="material-symbols-outlined text-4xl text-gray-300">description</span>
                          <p className="text-gray-500 font-bold">No hospital contracts found.</p>
                          <button type="button" onClick={() => setIsAddingContract(true)} className="btn-secondary text-xs">Assign First Hospital</button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex flex-col gap-1">
                        <nav className="flex items-center space-x-2 text-gray-500 text-[11px] font-bold uppercase tracking-widest">
                          <span>Contracts</span> <span className="material-symbols-outlined text-sm">chevron_right</span> <span className="text-primary">New Assignment</span>
                        </nav>
                        <h3 className="font-headline-sm text-on-surface uppercase tracking-wide text-xs font-black">Assign Hospital & Roles</h3>
                      </div>
                      <div className="flex items-center gap-3">
                        <button type="button" onClick={() => setIsAddingContract(false)} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg font-bold border border-gray-200 text-xs">Cancel</button>
                        <button type="button" onClick={confirmAddContract} className="bg-primary-container text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 hover:opacity-95 transition-all shadow-sm text-xs">
                          <span className="material-symbols-outlined text-lg">check_circle</span> Confirm Contract
                        </button>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <section className="bg-gray-50/50 border border-gray-200 rounded-xl p-6">
                        <label className="block text-[10px] font-black text-gray-700 uppercase mb-4">Select Facility <span className="text-primary">*</span></label>
                        <div className="relative">
                          <select 
                            className={`form-input pl-10 ${validationErrors.newContractHospital ? 'border-error ring-1 ring-error/20' : ''}`}
                            value={newContract.hospitalId}
                            onChange={(e) => setNewContract({ ...newContract, hospitalId: e.target.value })}
                            disabled={editingContractIndex !== null}
                          >
                            <option value="">Select a hospital...</option>
                            {hospitals
                              .filter(h => 
                                editingContractIndex !== null || 
                                !formData.memberships?.some(m => String(m.hospitalId) === String(h.id))
                              )
                              .map(h => <option key={h.id} value={h.id}>{h.name}</option>)
                            }
                          </select>
                          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">apartment</span>
                        </div>
                        {renderFieldError('newContractHospital')}
                      </section>

                      <section className="bg-gray-50/50 border border-gray-200 rounded-xl p-6">
                        <label className="block text-[10px] font-black text-gray-700 uppercase mb-4">Roles at Facility <span className="text-primary">*</span></label>
                        <div className="flex flex-wrap gap-3 mb-4">
                          {['DOCTOR', 'NURSE', 'RECEPTIONIST', 'PHARMACIST', 'ADMIN'].map(role => {
                            const isSelected = !!(newContract.roleAssignments || []).find(r => r.roleCode === role);
                            return (
                              <button
                                key={role} type="button"
                                onClick={() => handleAddRoleToNewContract(role)}
                                className={`px-4 py-2 rounded-lg border-2 transition-all font-black text-[10px] tracking-widest ${
                                  isSelected ? 'bg-primary border-primary text-white' : 'bg-white border-gray-200 text-gray-400 hover:border-primary'
                                }`}
                              >
                                {role}
                              </button>
                            );
                          })}
                        </div>
                      </section>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {(newContract.roleAssignments || []).map((ra, raIdx) => (
                          <div key={ra.roleCode} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                            <p className="text-[10px] font-black text-primary uppercase mb-4 tracking-tighter border-b border-gray-50 pb-2 flex items-center justify-between gap-2">
                              <span className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">settings</span> {ra.roleCode} Configuration
                              </span>
                            </p>
                            <div className="mb-4">
                              <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">Assigned Department</label>
                              <input 
                                type="text" 
                                className="form-input py-1.5" 
                                placeholder="e.g. Cardiology, Emergency..."
                                value={ra.departmentName} 
                                onChange={(e) => {
                                  const updated = [...(newContract.roleAssignments || [])];
                                  updated[raIdx].departmentName = e.target.value;
                                  setNewContract({ ...newContract, roleAssignments: updated });
                                }} 
                              />
                            </div>
                            {ra.roleCode === 'DOCTOR' && ra.doctorDetails && (
                              <div className="space-y-4">
                                <div>
                                  <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">Consultation Fee ($)</label>
                                  <input type="number" className="form-input py-1.5" value={ra.doctorDetails.consultationFee} onChange={(e) => {
                                    const updated = [...(newContract.roleAssignments || [])];
                                    updated[raIdx].doctorDetails = { ...ra.doctorDetails!, consultationFee: Number(e.target.value) };
                                    setNewContract({ ...newContract, roleAssignments: updated });
                                  }} />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">Commission %</label>
                                    <input type="number" className="form-input py-1.5" value={ra.doctorDetails.commissionValue} onChange={(e) => {
                                      const updated = [...(newContract.roleAssignments || [])];
                                      updated[raIdx].doctorDetails = { ...ra.doctorDetails!, commissionValue: Number(e.target.value) };
                                      setNewContract({ ...newContract, roleAssignments: updated });
                                    }} />
                                  </div>
                                  <div>
                                    <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">Status</label>
                                    <select className="form-input py-1.5" value={ra.doctorDetails.visitingConsultant ? 'V' : 'F'} onChange={(e) => {
                                      const updated = [...(newContract.roleAssignments || [])];
                                      updated[raIdx].doctorDetails = { ...ra.doctorDetails!, visitingConsultant: e.target.value === 'V' };
                                      setNewContract({ ...newContract, roleAssignments: updated });
                                    }}>
                                      <option value="F">Full-time</option>
                                      <option value="V">Visiting</option>
                                    </select>
                                  </div>
                                </div>
                              </div>
                            )}
                            {ra.roleCode === 'NURSE' && ra.nurseDetails && (
                              <div className="space-y-4">
                                <div>
                                  <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">Floor</label>
                                  <input type="text" className="form-input py-1.5" value={ra.nurseDetails.floorLocation} onChange={(e) => {
                                    const updated = [...(newContract.roleAssignments || [])];
                                    updated[raIdx].nurseDetails = { ...ra.nurseDetails!, floorLocation: e.target.value };
                                    setNewContract({ ...newContract, roleAssignments: updated });
                                  }} />
                                </div>
                              </div>
                            )}
                            {ra.roleCode === 'PHARMACIST' && ra.pharmacistDetails && (
                              <div className="space-y-4">
                                <div>
                                  <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">Counter Location</label>
                                  <input type="text" className="form-input py-1.5" value={ra.pharmacistDetails.counterLocation} onChange={(e) => {
                                    const updated = [...(newContract.roleAssignments || [])];
                                    updated[raIdx].pharmacistDetails = { ...ra.pharmacistDetails!, counterLocation: e.target.value };
                                    setNewContract({ ...newContract, roleAssignments: updated });
                                  }} />
                                </div>
                              </div>
                            )}
                            {ra.roleCode === 'RECEPTIONIST' && ra.receptionistDetails && (
                              <div className="space-y-4">
                                <div>
                                  <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">Desk Location</label>
                                  <input type="text" className="form-input py-1.5" value={ra.receptionistDetails.deskLocation} onChange={(e) => {
                                    const updated = [...(newContract.roleAssignments || [])];
                                    updated[raIdx].receptionistDetails = { ...ra.receptionistDetails!, deskLocation: e.target.value };
                                    setNewContract({ ...newContract, roleAssignments: updated });
                                  }} />
                                </div>
                              </div>
                            )}

                            {/* Scheduling Section for Doctors and Nurses */}
                            {(ra.roleCode === 'DOCTOR' || ra.roleCode === 'NURSE') && (
                              <div className="mt-6 pt-6 border-t border-gray-50 space-y-6">
                                <div>
                                  <div className="flex justify-between items-center mb-4">
                                    <h5 className="text-[10px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                                      <span className="material-symbols-outlined text-sm">calendar_month</span> Recurring Schedule
                                    </h5>
                                  </div>
                                  <div className="space-y-3">
                                    {dayNames.map((day, dIdx) => {
                                      const dayNum = dIdx + 1;
                                      const existing = ra.schedules?.find(s => s.dayOfWeek === dayNum);
                                      return (
                                        <div key={day} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                          <div className="flex items-center gap-2 min-w-[100px]">
                                            <input 
                                              type="checkbox" 
                                              className="w-4 h-4 accent-primary"
                                              checked={!!existing}
                                              onChange={(e) => {
                                                const updatedAssignments = [...(newContract.roleAssignments || [])];
                                                let schedules = [...(updatedAssignments[raIdx].schedules || [])];
                                                if (e.target.checked) {
                                                  schedules.push({ dayOfWeek: dayNum, startTime: { hour: 9, minute: 0 }, endTime: { hour: 17, minute: 0 }, slotDurationMinutes: 15, maxPatients: 20 });
                                                } else {
                                                  schedules = schedules.filter(s => s.dayOfWeek !== dayNum);
                                                }
                                                updatedAssignments[raIdx].schedules = schedules;
                                                setNewContract({ ...newContract, roleAssignments: updatedAssignments });
                                              }}
                                            />
                                            <span className="text-[11px] font-bold text-slate-700">{day.substring(0, 3)}</span>
                                          </div>
                                          {existing && (
                                            <div className="flex-1 grid grid-cols-3 gap-2">
                                              <div className="flex items-center gap-1">
                                                <input 
                                                  type="time" 
                                                  className="form-input py-1 text-[10px] h-8"
                                                  value={localTimeToString(existing.startTime)}
                                                  onChange={(e) => {
                                                    const updatedAssignments = [...(newContract.roleAssignments || [])];
                                                    const schedules = [...(updatedAssignments[raIdx].schedules || [])];
                                                    const sIdx = schedules.findIndex(s => s.dayOfWeek === dayNum);
                                                    schedules[sIdx] = { ...schedules[sIdx], startTime: stringToLocalTime(e.target.value) };
                                                    updatedAssignments[raIdx].schedules = schedules;
                                                    setNewContract({ ...newContract, roleAssignments: updatedAssignments });
                                                  }}
                                                />
                                              </div>
                                              <div className="flex items-center gap-1">
                                                <input 
                                                  type="time" 
                                                  className="form-input py-1 text-[10px] h-8"
                                                  value={localTimeToString(existing.endTime)}
                                                  onChange={(e) => {
                                                    const updatedAssignments = [...(newContract.roleAssignments || [])];
                                                    const schedules = [...(updatedAssignments[raIdx].schedules || [])];
                                                    const sIdx = schedules.findIndex(s => s.dayOfWeek === dayNum);
                                                    schedules[sIdx] = { ...schedules[sIdx], endTime: stringToLocalTime(e.target.value) };
                                                    updatedAssignments[raIdx].schedules = schedules;
                                                    setNewContract({ ...newContract, roleAssignments: updatedAssignments });
                                                  }}
                                                />
                                              </div>
                                              <div className="flex items-center gap-1">
                                                <input 
                                                  type="number" 
                                                  placeholder="Patients"
                                                  className="form-input py-1 text-[10px] h-8"
                                                  value={existing.maxPatients}
                                                  onChange={(e) => {
                                                    const updatedAssignments = [...(newContract.roleAssignments || [])];
                                                    const schedules = [...(updatedAssignments[raIdx].schedules || [])];
                                                    const sIdx = schedules.findIndex(s => s.dayOfWeek === dayNum);
                                                    schedules[sIdx] = { ...schedules[sIdx], maxPatients: Number(e.target.value) };
                                                    updatedAssignments[raIdx].schedules = schedules;
                                                    setNewContract({ ...newContract, roleAssignments: updatedAssignments });
                                                  }}
                                                />
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>

                                <div>
                                  <div className="flex justify-between items-center mb-4">
                                    <h5 className="text-[10px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                                      <span className="material-symbols-outlined text-sm">event_busy</span> Availability Overrides
                                    </h5>
                                    <button 
                                      type="button"
                                      onClick={() => {
                                        const updatedAssignments = [...(newContract.roleAssignments || [])];
                                        const exceptions = [...(updatedAssignments[raIdx].availabilityExceptions || [])];
                                        exceptions.push({ date: new Date().toISOString().split('T')[0], type: 'VACATION', mode: 'UNAVAILABLE', note: '' });
                                        updatedAssignments[raIdx].availabilityExceptions = exceptions;
                                        setNewContract({ ...newContract, roleAssignments: updatedAssignments });
                                      }}
                                      className="text-primary text-[9px] font-black uppercase flex items-center gap-1 hover:underline"
                                    >
                                      <span className="material-symbols-outlined text-xs">add</span> Add Exception
                                    </button>
                                  </div>
                                  <div className="space-y-3">
                                    {ra.availabilityExceptions?.map((ex, exIdx) => (
                                      <div key={exIdx} className="p-3 bg-orange-50/50 rounded-xl border border-orange-100/50 relative group">
                                        <button 
                                          type="button"
                                          onClick={() => {
                                            const updatedAssignments = [...(newContract.roleAssignments || [])];
                                            const exceptions = [...(updatedAssignments[raIdx].availabilityExceptions || [])];
                                            exceptions.splice(exIdx, 1);
                                            updatedAssignments[raIdx].availabilityExceptions = exceptions;
                                            setNewContract({ ...newContract, roleAssignments: updatedAssignments });
                                          }}
                                          className="absolute top-2 right-2 text-gray-400 hover:text-error opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                          <span className="material-symbols-outlined text-sm">close</span>
                                        </button>
                                        <div className="grid grid-cols-2 gap-3 mb-2">
                                          <input 
                                            type="date" 
                                            className="form-input py-1 text-[10px] h-8"
                                            value={ex.date}
                                            onChange={(e) => {
                                              const updatedAssignments = [...(newContract.roleAssignments || [])];
                                              const exceptions = [...(updatedAssignments[raIdx].availabilityExceptions || [])];
                                              exceptions[exIdx].date = e.target.value;
                                              updatedAssignments[raIdx].availabilityExceptions = exceptions;
                                              setNewContract({ ...newContract, roleAssignments: updatedAssignments });
                                            }}
                                          />
                                          <select 
                                            className="form-input py-1 text-[10px] h-8"
                                            value={ex.mode}
                                            onChange={(e) => {
                                              const updatedAssignments = [...(newContract.roleAssignments || [])];
                                              const exceptions = [...(updatedAssignments[raIdx].availabilityExceptions || [])];
                                              exceptions[exIdx].mode = e.target.value;
                                              updatedAssignments[raIdx].availabilityExceptions = exceptions;
                                              setNewContract({ ...newContract, roleAssignments: updatedAssignments });
                                            }}
                                          >
                                            <option value="UNAVAILABLE">Unavailable</option>
                                            <option value="AVAILABLE">Extra Available</option>
                                          </select>
                                        </div>
                                        <input 
                                          type="text" 
                                          placeholder="Note (e.g. Vacation, Seminar...)"
                                          className="form-input py-1 text-[10px] h-8"
                                          value={ex.note}
                                          onChange={(e) => {
                                            const updatedAssignments = [...(newContract.roleAssignments || [])];
                                            const exceptions = [...(updatedAssignments[raIdx].availabilityExceptions || [])];
                                            exceptions[exIdx].note = e.target.value;
                                            updatedAssignments[raIdx].availabilityExceptions = exceptions;
                                            setNewContract({ ...newContract, roleAssignments: updatedAssignments });
                                          }}
                                        />
                                      </div>
                                    ))}
                                    {(!ra.availabilityExceptions || ra.availabilityExceptions.length === 0) && (
                                      <p className="text-[9px] text-gray-400 italic text-center py-2">No active overrides.</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}

                            {(!ra.doctorDetails && !ra.nurseDetails && !ra.pharmacistDetails && !ra.receptionistDetails) && ra.roleCode === 'ADMIN' && <p className="text-[10px] text-gray-400 italic">No specific parameters for this role.</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="space-y-8">
                <div className="bg-orange-50/30 p-6 rounded-2xl border border-orange-100 mb-8">
                  <h3 className="font-headline-sm text-on-surface uppercase tracking-wide text-xs font-black mb-2">Global Professional Profile</h3>
                  <p className="text-xs text-gray-500">Automated cards based on user's active hospital roles.</p>
                </div>

                {assignedRoles.length === 0 && (
                  <div className="py-20 text-center text-gray-400">
                    <span className="material-symbols-outlined text-4xl mb-4">badge_critical</span>
                    <p className="font-bold">No professional roles assigned.</p>
                    <p className="text-sm">Assign roles in the Contracts tab to enable profile data entry.</p>
                  </div>
                )}

                {assignedRoles.includes('DOCTOR') && formData.doctorInfo && (
                  <div className={`bg-white border border-gray-200 rounded-xl p-8 space-y-6 shadow-sm ${validationErrors.specialization ? 'ring-2 ring-error/50' : ''}`}>
                    <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                      <div className="w-10 h-10 rounded-full bg-orange-50 text-primary flex items-center justify-center">
                        <span className="material-symbols-outlined">stethoscope</span>
                      </div>
                      <h3 className="font-headline-sm text-on-surface uppercase tracking-widest text-xs font-black">Doctor Specialization</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                      <div className="flex flex-col gap-1.5">
                        <label className="font-label-sm text-gray-700 uppercase">Specialization <span className="text-primary">*</span></label>
                        <input className={`form-input ${validationErrors.specialization ? 'border-error' : ''}`} type="text" value={formData.doctorInfo.specialization} onChange={(e) => setFormData({ ...formData, doctorInfo: { ...formData.doctorInfo!, specialization: e.target.value } })} />
                        {renderFieldError('specialization')}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="font-label-sm text-gray-700 uppercase">License No.</label>
                        <input className="form-input" type="text" value={formData.doctorInfo.licenseNumber} onChange={(e) => setFormData({ ...formData, doctorInfo: { ...formData.doctorInfo!, licenseNumber: e.target.value } })} />
                      </div>
                    </div>

                    <div className="space-y-4 pt-4">
                      <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Medical Education & Qualifications</h4>
                        <button 
                          type="button"
                          onClick={() => {
                            const quals = [...(formData.doctorInfo?.education?.qualifications || [])];
                            quals.push({ degree: '', institution: '', year: new Date().getFullYear(), specialization: '' });
                            setFormData({ ...formData, doctorInfo: { ...formData.doctorInfo!, education: { qualifications: quals } } });
                          }}
                          className="text-primary text-[10px] font-bold flex items-center gap-1 hover:underline"
                        >
                          <span className="material-symbols-outlined text-sm">add_circle</span> Add Qualification
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-4">
                        {formData.doctorInfo.education?.qualifications.map((q, qIdx) => (
                          <div key={qIdx} className="p-4 bg-gray-50 rounded-xl border border-gray-100 relative group">
                            <button 
                              type="button"
                              onClick={() => {
                                const quals = [...(formData.doctorInfo?.education?.qualifications || [])];
                                quals.splice(qIdx, 1);
                                setFormData({ ...formData, doctorInfo: { ...formData.doctorInfo!, education: { qualifications: quals } } });
                              }}
                              className="absolute top-2 right-2 text-gray-400 hover:text-error opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <span className="material-symbols-outlined text-sm">delete</span>
                            </button>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                              <div>
                                <label className="text-[9px] font-black text-gray-500 uppercase block mb-1">Degree</label>
                                <input 
                                  type="text" 
                                  className="form-input py-1 text-xs" 
                                  value={q.degree} 
                                  onChange={(e) => {
                                    const quals = [...(formData.doctorInfo?.education?.qualifications || [])];
                                    quals[qIdx].degree = e.target.value;
                                    setFormData({ ...formData, doctorInfo: { ...formData.doctorInfo!, education: { qualifications: quals } } });
                                  }}
                                />
                              </div>
                              <div>
                                <label className="text-[9px] font-black text-gray-500 uppercase block mb-1">Institution</label>
                                <input 
                                  type="text" 
                                  className="form-input py-1 text-xs" 
                                  value={q.institution} 
                                  onChange={(e) => {
                                    const quals = [...(formData.doctorInfo?.education?.qualifications || [])];
                                    quals[qIdx].institution = e.target.value;
                                    setFormData({ ...formData, doctorInfo: { ...formData.doctorInfo!, education: { qualifications: quals } } });
                                  }}
                                />
                              </div>
                              <div>
                                <label className="text-[9px] font-black text-gray-500 uppercase block mb-1">Year</label>
                                <input 
                                  type="number" 
                                  className="form-input py-1 text-xs" 
                                  value={q.year} 
                                  onChange={(e) => {
                                    const quals = [...(formData.doctorInfo?.education?.qualifications || [])];
                                    quals[qIdx].year = Number(e.target.value);
                                    setFormData({ ...formData, doctorInfo: { ...formData.doctorInfo!, education: { qualifications: quals } } });
                                  }}
                                />
                              </div>
                              <div>
                                <label className="text-[9px] font-black text-gray-500 uppercase block mb-1">Specialization</label>
                                <input 
                                  type="text" 
                                  className="form-input py-1 text-xs" 
                                  value={q.specialization} 
                                  onChange={(e) => {
                                    const quals = [...(formData.doctorInfo?.education?.qualifications || [])];
                                    quals[qIdx].specialization = e.target.value;
                                    setFormData({ ...formData, doctorInfo: { ...formData.doctorInfo!, education: { qualifications: quals } } });
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                        {(!formData.doctorInfo.education?.qualifications || formData.doctorInfo.education.qualifications.length === 0) && (
                          <p className="text-[11px] text-gray-400 italic text-center py-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">No qualifications listed.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {assignedRoles.includes('NURSE') && formData.nurseInfo && (
                  <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-6 shadow-sm">
                    <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                      <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                        <span className="material-symbols-outlined">medical_services</span>
                      </div>
                      <h3 className="font-headline-sm text-on-surface uppercase tracking-widest text-xs font-black">Nursing Credentials</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                      <div className="flex flex-col gap-1.5">
                        <label className="font-label-sm text-gray-700 uppercase">License No.</label>
                        <input className="form-input" type="text" value={formData.nurseInfo.nursingLicenseNo} onChange={(e) => setFormData({ ...formData, nurseInfo: { ...formData.nurseInfo!, nursingLicenseNo: e.target.value } })} />
                      </div>
                    </div>
                  </div>
                )}

                {assignedRoles.includes('PHARMACIST') && formData.pharmacistInfo && (
                  <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-6 shadow-sm">
                    <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                      <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
                        <span className="material-symbols-outlined">medication</span>
                      </div>
                      <h3 className="font-headline-sm text-on-surface uppercase tracking-widest text-xs font-black">Pharmacist Credentials</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                      <div className="flex flex-col gap-1.5">
                        <label className="font-label-sm text-gray-700 uppercase">PCI Reg No.</label>
                        <input className="form-input" type="text" value={formData.pharmacistInfo.pciRegNo} onChange={(e) => setFormData({ ...formData, pharmacistInfo: { ...formData.pharmacistInfo!, pciRegNo: e.target.value } })} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="font-label-sm text-gray-700 uppercase">Qualification</label>
                        <input className="form-input" type="text" value={formData.pharmacistInfo.qualification} onChange={(e) => setFormData({ ...formData, pharmacistInfo: { ...formData.pharmacistInfo!, qualification: e.target.value } })} />
                      </div>
                    </div>
                  </div>
                )}

                {assignedRoles.includes('RECEPTIONIST') && formData.receptionistInfo && (
                  <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-6 shadow-sm">
                    <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                      <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <span className="material-symbols-outlined">desk</span>
                      </div>
                      <h3 className="font-headline-sm text-on-surface uppercase tracking-widest text-xs font-black">Receptionist Profile</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                      <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                        <input 
                          type="checkbox" 
                          className="w-5 h-5 accent-indigo-600"
                          checked={formData.receptionistInfo.insuranceSpecialist}
                          onChange={(e) => setFormData({ ...formData, receptionistInfo: { ...formData.receptionistInfo!, insuranceSpecialist: e.target.checked } })}
                        />
                        <div>
                          <p className="font-bold text-sm text-on-surface">Insurance Specialist</p>
                          <p className="text-xs text-secondary">Is this staff member trained for insurance claims?</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 pt-4">
                      <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Languages Spoken</h4>
                        <button 
                          type="button"
                          onClick={() => {
                            const fluencies = [...(formData.receptionistInfo?.languagesSpoken?.fluencies || [])];
                            fluencies.push({ language: '', proficiency: 'BASIC' });
                            setFormData({ ...formData, receptionistInfo: { ...formData.receptionistInfo!, languagesSpoken: { fluencies } } });
                          }}
                          className="text-indigo-600 text-[10px] font-bold flex items-center gap-1 hover:underline"
                        >
                          <span className="material-symbols-outlined text-sm">add_circle</span> Add Language
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {formData.receptionistInfo.languagesSpoken?.fluencies.map((f, fIdx) => (
                          <div key={fIdx} className="p-3 bg-gray-50 rounded-xl border border-gray-100 relative group flex items-center gap-3">
                            <button 
                              type="button"
                              onClick={() => {
                                const fluencies = [...(formData.receptionistInfo?.languagesSpoken?.fluencies || [])];
                                fluencies.splice(fIdx, 1);
                                setFormData({ ...formData, receptionistInfo: { ...formData.receptionistInfo!, languagesSpoken: { fluencies } } });
                              }}
                              className="absolute -top-2 -right-2 bg-white text-gray-400 hover:text-error opacity-0 group-hover:opacity-100 transition-all rounded-full shadow-sm border border-gray-100 p-0.5"
                            >
                              <span className="material-symbols-outlined text-xs">close</span>
                            </button>
                            <input 
                              type="text" 
                              className="form-input py-1 text-xs" 
                              placeholder="Language..."
                              value={f.language} 
                              onChange={(e) => {
                                const fluencies = [...(formData.receptionistInfo?.languagesSpoken?.fluencies || [])];
                                fluencies[fIdx].language = e.target.value;
                                setFormData({ ...formData, receptionistInfo: { ...formData.receptionistInfo!, languagesSpoken: { fluencies } } });
                              }}
                            />
                            <select 
                              className="form-input py-1 text-xs w-32"
                              value={f.proficiency}
                              onChange={(e) => {
                                const fluencies = [...(formData.receptionistInfo?.languagesSpoken?.fluencies || [])];
                                fluencies[fIdx].proficiency = e.target.value as any;
                                setFormData({ ...formData, receptionistInfo: { ...formData.receptionistInfo!, languagesSpoken: { fluencies } } });
                              }}
                            >
                              <option value="NATIVE">Native</option>
                              <option value="FLUENT">Fluent</option>
                              <option value="INTERMEDIATE">Intermediate</option>
                              <option value="BASIC">Basic</option>
                            </select>
                          </div>
                        ))}
                        {(!formData.receptionistInfo.languagesSpoken?.fluencies || formData.receptionistInfo.languagesSpoken.fluencies.length === 0) && (
                          <p className="text-[11px] text-gray-400 italic md:col-span-2 text-center py-2">No languages added.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Action Bar */}
        <div className="fixed bottom-0 right-0 left-64 bg-white/95 backdrop-blur-md border-t border-gray-200 px-8 py-4 flex justify-between items-center z-40">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="material-symbols-outlined text-green-500">cloud_done</span> All Changes Tracked
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => router.back()} className="btn-secondary">Discard</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Processing...' : isAddingContract ? 'Confirm Contract & Save All' : 'Save Changes'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default UserForm;
