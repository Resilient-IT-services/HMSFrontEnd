'use client';

import React, { useEffect, useState } from 'react';
import MainLayout from '@/components/ui/MainLayout';
import { Card } from '@/components/ui/Card';
import { userService } from '@/services/userService';
import { hospitalService } from '@/services/hospitalService';
import { 
  UserFullProfileDTO, 
  HospitalResponse, 
  HospitalMembershipDTO,
  RoleAssignmentDTO,
  DoctorHospitalDetailsDTO,
  NurseHospitalDetailsDTO,
  AdminHospitalDetailsDTO,
  PharmacistHospitalDetailsDTO,
  ReceptionistHospitalDetailsDTO
} from '@/types/api';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  ShieldCheck, 
  Stethoscope, 
  ArrowLeft,
  Save,
  Plus
} from 'lucide-react';
import Link from 'next/link';
import { triggerGlobalToast } from '@/components/ui/Toast';

type ContractRole = 'DOCTOR' | 'NURSE' | 'RECEPTIONIST' | 'PHARMACIST' | 'ADMIN';

export const AddContractPage = ({ id }: { id: string }) => {
  const router = useRouter();
  const [userData, setUserData] = useState<UserFullProfileDTO | null>(null);
  const [hospitals, setHospitals] = useState<HospitalResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>('');
  const [selectedRoles, setSelectedRoles] = useState<ContractRole[]>([]);
  
  // Role Details State
  const [doctorDetails, setDoctorDetails] = useState<Partial<DoctorHospitalDetailsDTO>>({
    consultationFee: 0,
    commissionType: 'PERCENTAGE',
    commissionValue: 0,
    visitingConsultant: false,
    followUpDays: 7
  });
  
  const [nurseDetails, setNurseDetails] = useState<Partial<NurseHospitalDetailsDTO>>({
    floorLocation: '',
    shiftType: 'DAY'
  });
  
  const [adminDetails, setAdminDetails] = useState<Partial<AdminHospitalDetailsDTO>>({
    officeLocation: '',
    departmentHead: false
  });
  
  const [pharmacistDetails, setPharmacistDetails] = useState<Partial<PharmacistHospitalDetailsDTO>>({
    counterLocation: '',
    pharmacyWing: ''
  });

  const [receptionistDetails, setReceptionistDetails] = useState<Partial<ReceptionistHospitalDetailsDTO>>({
    deskLocation: '',
    emergencyContactNumber: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [userRes, hospRes] = await Promise.all([
          userService.getFullProfile(id),
          hospitalService.list()
        ]);
        
        if (userRes.success && userRes.data) {
          setUserData(userRes.data);
        }
        if (hospRes.success && hospRes.data) {
          setHospitals(hospRes.data.content || []);
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
      triggerGlobalToast('Please select a hospital before saving the contract', 'error');
      return;
    }

    if (selectedRoles.length === 0) {
      triggerGlobalToast('Please select at least one role', 'error');
      return;
    }

    try {
      setSubmitting(true);
      
      const roleAssignments: RoleAssignmentDTO[] = selectedRoles.map(role => ({
        assignmentId: '', // Server will generate
        roleCode: role,
        departmentName: 'General',
        active: true,
        doctorDetails: role === 'DOCTOR' ? doctorDetails as DoctorHospitalDetailsDTO : undefined,
        nurseDetails: role === 'NURSE' ? nurseDetails as NurseHospitalDetailsDTO : undefined,
        adminDetails: role === 'ADMIN' ? adminDetails as AdminHospitalDetailsDTO : undefined,
        pharmacistDetails: role === 'PHARMACIST' ? pharmacistDetails as PharmacistHospitalDetailsDTO : undefined,
        receptionistDetails: role === 'RECEPTIONIST' ? receptionistDetails as ReceptionistHospitalDetailsDTO : undefined
      }));

      const newMembership: HospitalMembershipDTO = {
        hospitalId: selectedHospitalId,
        roleAssignments
      };

      const updatedMemberships = [...(userData?.memberships || []), newMembership];

      const res = await userService.updateUser(id, {
        fullName: userData?.fullName || '',
        username: userData?.username || '',
        email: userData?.email || '',
        gender: userData?.gender || 'MALE',
        dob: userData?.dob || '',
        phone: userData?.phone || '',
        superuser: userData?.superuser || false,
        memberships: updatedMemberships
      });

      if (res.success) {
        router.push(`/admin/users/${id}`);
      }
    } catch (error) {
      console.error('Failed to save contract', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <MainLayout title="Loading..."><div className="p-8">Loading details...</div></MainLayout>;
  if (!userData) return <MainLayout title="Error"><div className="p-8">User not found.</div></MainLayout>;

  return (
    <MainLayout title="Add Hospital Contract">
      <div className="max-w-4xl mx-auto space-y-6 pb-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/admin/users/${id}`} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ArrowLeft className="size-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">New Contract</h1>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">For {userData.fullName}</p>
            </div>
          </div>
          <button 
            onClick={handleSave}
            disabled={submitting}
            className="flex items-center gap-2 bg-[var(--primary)] text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[var(--primary-hover)] transition-all shadow-lg disabled:opacity-50"
          >
            {submitting ? 'Saving...' : <><Save className="size-4" /> Save Contract</>}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-6">
            <Card>
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">1. Select Hospital</h3>
              <div className="space-y-3">
                {hospitals.map(h => (
                  <button
                    key={h.id}
                    onClick={() => setSelectedHospitalId(h.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                      selectedHospitalId === h.id 
                      ? 'border-[var(--primary)] bg-[var(--primary-light)]/30' 
                      : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <Building2 className={`size-5 ${selectedHospitalId === h.id ? 'text-[var(--primary)]' : 'text-gray-400'}`} />
                    <div>
                      <p className="text-sm font-bold text-gray-900">{h.name}</p>
                      <p className="text-[10px] font-black text-gray-400 uppercase">{h.code}</p>
                    </div>
                  </button>
                ))}
              </div>
            </Card>

            <Card>
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">2. Select Roles</h3>
              <div className="grid grid-cols-1 gap-2">
                {(['DOCTOR', 'NURSE', 'RECEPTIONIST', 'PHARMACIST', 'ADMIN'] as ContractRole[]).map(role => (
                  <button
                    key={role}
                    onClick={() => toggleRole(role)}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                      selectedRoles.includes(role)
                      ? 'border-[var(--primary)] bg-[var(--primary-light)]/30 text-[var(--primary)]'
                      : 'border-gray-100 text-gray-500 hover:border-gray-200'
                    }`}
                  >
                    <ShieldCheck className="size-5" />
                    <span className="text-xs font-black uppercase tracking-widest">{role}</span>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          <div className="md:col-span-2 space-y-6">
            {selectedRoles.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-3xl text-gray-400">
                <Plus className="size-12 opacity-20 mb-4" />
                <p className="font-bold text-sm">Select roles to configure details</p>
              </div>
            ) : (
              selectedRoles.map(role => (
                <Card key={role} className="border-l-4 border-l-[var(--primary)]">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-[var(--primary-light)] text-[var(--primary)] rounded-lg">
                      <Stethoscope className="size-5" />
                    </div>
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">{role} Details</h3>
                  </div>

                  {role === 'DOCTOR' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Consultation Fee ($)</label>
                        <input 
                          type="number" 
                          className="w-full p-3 bg-gray-50 border-2 border-transparent focus:border-[var(--primary)] rounded-xl outline-none font-bold transition-all"
                          value={doctorDetails.consultationFee}
                          onChange={e => setDoctorDetails({...doctorDetails, consultationFee: Number(e.target.value)})}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Commission Type</label>
                        <select 
                          className="w-full p-3 bg-gray-50 border-2 border-transparent focus:border-[var(--primary)] rounded-xl outline-none font-bold transition-all"
                          value={doctorDetails.commissionType}
                          onChange={e => setDoctorDetails({...doctorDetails, commissionType: e.target.value as any})}
                        >
                          <option value="PERCENTAGE">Percentage (%)</option>
                          <option value="FIXED">Fixed Amount ($)</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Commission Value</label>
                        <input 
                          type="number" 
                          className="w-full p-3 bg-gray-50 border-2 border-transparent focus:border-[var(--primary)] rounded-xl outline-none font-bold transition-all"
                          value={doctorDetails.commissionValue}
                          onChange={e => setDoctorDetails({...doctorDetails, commissionValue: Number(e.target.value)})}
                        />
                      </div>
                      <div className="flex items-center gap-3 pt-6">
                        <input 
                          type="checkbox" 
                          id="visiting"
                          className="size-5 rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                          checked={doctorDetails.visitingConsultant}
                          onChange={e => setDoctorDetails({...doctorDetails, visitingConsultant: e.target.checked})}
                        />
                        <label htmlFor="visiting" className="text-xs font-bold text-gray-700 uppercase tracking-widest">Visiting Consultant</label>
                      </div>
                    </div>
                  )}

                  {role === 'NURSE' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Floor Location</label>
                        <input 
                          className="w-full p-3 bg-gray-50 border-2 border-transparent focus:border-[var(--primary)] rounded-xl outline-none font-bold transition-all"
                          value={nurseDetails.floorLocation}
                          onChange={e => setNurseDetails({...nurseDetails, floorLocation: e.target.value})}
                          placeholder="e.g. 3rd Floor, West Wing"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Shift Type</label>
                        <select 
                          className="w-full p-3 bg-gray-50 border-2 border-transparent focus:border-[var(--primary)] rounded-xl outline-none font-bold transition-all"
                          value={nurseDetails.shiftType}
                          onChange={e => setNurseDetails({...nurseDetails, shiftType: e.target.value as any})}
                        >
                          <option value="DAY">Day Shift</option>
                          <option value="NIGHT">Night Shift</option>
                          <option value="ROTATIONAL">Rotational</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {role === 'RECEPTIONIST' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Desk Location</label>
                        <input 
                          className="w-full p-3 bg-gray-50 border-2 border-transparent focus:border-[var(--primary)] rounded-xl outline-none font-bold transition-all"
                          value={receptionistDetails.deskLocation}
                          onChange={e => setReceptionistDetails({...receptionistDetails, deskLocation: e.target.value})}
                          placeholder="e.g. Main Lobby"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Emergency Contact</label>
                        <input 
                          className="w-full p-3 bg-gray-50 border-2 border-transparent focus:border-[var(--primary)] rounded-xl outline-none font-bold transition-all"
                          value={receptionistDetails.emergencyContactNumber}
                          onChange={e => setReceptionistDetails({...receptionistDetails, emergencyContactNumber: e.target.value})}
                        />
                      </div>
                    </div>
                  )}
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};
