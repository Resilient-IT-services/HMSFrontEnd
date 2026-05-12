'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  UserRequestDTO,
  UserFullProfileDTO,
  HospitalResponse,
  HospitalMembershipDTO, ScheduleDTO
} from '@/types/api';
import { hospitalService } from '@/services/hospitalService';
import { userService } from '@/services/userService';
import { triggerGlobalToast } from '@/components/ui/Toast';
import { validateDOB } from '@/utils/dateValidator';
import { cloneHospitalMembership } from './contractClone';

export const useUserFormLogic = (initialData?: UserFullProfileDTO, isEdit?: boolean) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'personal' | 'contracts' | 'profile'>('personal');
  const [hospitals, setHospitals] = useState<HospitalResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState<UserRequestDTO>({
    id: initialData?.id,
    username: initialData?.username || '',
    fullName: initialData?.fullName || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    dob: initialData?.dob || '',
    gender: (initialData?.gender as any) || 'MALE',
    password: '',
    superuser: initialData?.superuser || false,
    active: initialData?.status ? initialData.status === 'ACTIVE' : initialData?.active ?? true,
    status: initialData?.status || (initialData?.active === false ? 'INACTIVE' : 'ACTIVE'),
    memberships: initialData?.memberships?.map(membership => cloneHospitalMembership(membership)) || [],
    doctorInfo: initialData?.doctorInfo,
    nurseInfo: initialData?.nurseInfo,
    pharmacistInfo: initialData?.pharmacistInfo,
    receptionistInfo: initialData?.receptionistInfo,
  });

  const [isAddingContract, setIsAddingContract] = useState(false);
  const [editingContractIndex, setEditingContractIndex] = useState<number | null>(null);
  const [newContract, setNewContract] = useState<HospitalMembershipDTO>({ hospitalId: '', roleAssignments: [] });

  // Clear contract-related errors when editor is opened
  useEffect(() => {
    if (isAddingContract) {
      setValidationErrors(prev => {
        const next = { ...prev };
        delete next.contractHospital;
        delete next.contractRoles;
        Object.keys(next).forEach(key => {
          if (key.startsWith('department_') || key.startsWith('fee_')) {
            delete next[key];
          }
        });
        return next;
      });
    }
  }, [isAddingContract]);

  const assignedRoles = useMemo(() => {
    const roles = new Set<string>();
    if (formData.memberships) for (const m of formData.memberships) {
      if (m.roleAssignments) for (const ra of m.roleAssignments) roles.add(ra.roleCode);
      // Also check direct roles array if present (matches API response)
      if ((m as any).roles) (m as any).roles.forEach((r: string) => roles.add(r));
    }
    return [...roles];
  }, [formData.memberships]);

  // Automatically initialize profile info objects when roles are assigned
  useEffect(() => {
    const updatedInfo: Partial<UserRequestDTO> = {};
    let changed = false;

    if (assignedRoles.includes('DOCTOR') && !formData.doctorInfo) {
      updatedInfo.doctorInfo = { specialization: '', licenseNumber: '', bio: '', education: { qualifications: [] } };
      changed = true;
    }
    if (assignedRoles.includes('NURSE') && !formData.nurseInfo) {
      updatedInfo.nurseInfo = { nursingLicenseNo: '', certificationLevel: 'RN' };
      changed = true;
    }
    if (assignedRoles.includes('PHARMACIST') && !formData.pharmacistInfo) {
      updatedInfo.pharmacistInfo = { pciRegNo: '', qualification: '' };
      changed = true;
    }
    if (assignedRoles.includes('RECEPTIONIST') && !formData.receptionistInfo) {
      updatedInfo.receptionistInfo = { languagesSpoken: { fluencies: [] }, insuranceSpecialist: false };
      changed = true;
    }

    if (changed) {
      setFormData(prev => ({ ...prev, ...updatedInfo }));
    }
  }, [assignedRoles, formData.doctorInfo, formData.nurseInfo, formData.pharmacistInfo, formData.receptionistInfo]);

  useEffect(() => {
    hospitalService.list().then(res => {
      if (res.success && res.data) setHospitals(res.data.content || []);
    });
  }, []);

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    
    // Full Name
    if (!formData.fullName?.trim()) {
      errors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 3) {
      errors.fullName = 'Full name must be at least 3 characters';
    }

    // Username
    if (!formData.username?.trim()) {
      errors.username = 'Username is required';
    } else if (formData.username.trim().length < 4) {
      errors.username = 'Username must be at least 4 characters';
    }

    // Password (only for new users)
    if (!isEdit && !formData.password?.trim()) {
      errors.password = 'Password is required';
    } else if (!isEdit && formData.password && formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    // Email
    // eslint-disable-next-line sonarjs/slow-regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email?.trim()) {
      errors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      errors.email = 'Invalid email format';
    }

    // Phone
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    if (!formData.phone?.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!phoneRegex.test(formData.phone.replaceAll(/\s/g, ''))) {
      errors.phone = 'Invalid phone number (10-15 digits)';
    }

    // DOB
    const dobValidation = validateDOB(formData.dob);
    if (!dobValidation.isValid) {
      errors.dob = dobValidation.message || 'Invalid date of birth';
    }
    
    if (!formData.superuser && (!formData.memberships || formData.memberships.length === 0)) {
      errors.memberships = 'At least one hospital contract is required for non-superusers.';
    }

    // Doctor Specific Validation
    if (assignedRoles.includes('DOCTOR') && formData.doctorInfo) {
      if (!formData.doctorInfo.specialization?.trim()) {
        errors.specialization = 'Specialization is required';
      }
      if (!formData.doctorInfo.licenseNumber?.trim()) {
        errors.licenseNumber = 'License number is required';
      }
    }

    // Nurse Specific Validation
    if (assignedRoles.includes('NURSE') && formData.nurseInfo) {
      const nurseLicense = formData.nurseInfo.nursingLicenseNo?.trim();
      if (!nurseLicense) {
        errors.nursingLicenseNo = 'Nurse license number is required';
      }
    }

    // Pharmacist Specific Validation
    if (assignedRoles.includes('PHARMACIST') && formData.pharmacistInfo) {
      const pciRegNo = formData.pharmacistInfo.pciRegNo?.trim();
      if (!pciRegNo) {
        errors.pciRegNo = 'PCI Registration number is required';
      }
    }

    setValidationErrors(errors);
    if (Object.keys(errors).length > 0) {
      triggerGlobalToast('Please fill all required professional details', 'error');
    }
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validate()) return;

    try {
      setLoading(true);
      
      // Clean data before submission to ensure no empty unique fields are sent
      const cleanedDoctorInfo = formData.doctorInfo ? {
        ...formData.doctorInfo,
        specialization: formData.doctorInfo.specialization?.trim(),
        licenseNumber: formData.doctorInfo.licenseNumber?.trim()
      } : undefined;

      const cleanedNurseInfo = formData.nurseInfo ? {
        ...formData.nurseInfo,
        nursingLicenseNo: formData.nurseInfo.nursingLicenseNo?.trim()
      } : undefined;

      const cleanedPharmacistInfo = formData.pharmacistInfo ? {
        ...formData.pharmacistInfo,
        pciRegNo: formData.pharmacistInfo.pciRegNo?.trim()
      } : undefined;

      const userPayload: UserRequestDTO = {
        ...formData,
        doctorInfo: cleanedDoctorInfo,
        nurseInfo: cleanedNurseInfo,
        pharmacistInfo: cleanedPharmacistInfo,
        status: formData.active ? 'ACTIVE' : 'INACTIVE'
      };
      const response = isEdit && initialData?.id
        ? await userService.updateUser(initialData.id, userPayload)
        : await userService.createUser(userPayload);

      if (response.success) {
        router.push('/admin/users');
      }
    } catch (error: unknown) {
      const apiError = error as {
        response?: {
          data?: {
            details?: Record<string, string>;
          };
        };
      };

      if (apiError.response?.data?.details) {
        setValidationErrors(apiError.response.data.details);
      }
    } finally {
      setLoading(false);
    }
  };

  const checkScheduleOverlaps = (memberships: HospitalMembershipDTO[]) => {
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const allSchedules: Array<ScheduleDTO & { hospitalName: string; roleCode: string }> = [];
    
    for (const m of memberships) {
      for (const ra of m.roleAssignments || []) {
        if (ra.schedules) {
          for (const s of ra.schedules) {
            allSchedules.push({ ...s, hospitalName: m.hospitalName || 'Unknown Hospital', roleCode: ra.roleCode });
          }
        }
      }
    }

    allSchedules.sort((a, b) => {
      if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
      return a.startTime.localeCompare(b.startTime);
    });

    const timeToMinutes = (time: string) => {
      const [h, m] = time.split(':').map(Number);
      return (h || 0) * 60 + (m || 0);
    };

    for (let i = 0; i < allSchedules.length - 1; i++) {
      const current = allSchedules[i];
      const next = allSchedules[i + 1];

      if (current.dayOfWeek === next.dayOfWeek && timeToMinutes(current.endTime) > timeToMinutes(next.startTime)) {
        const dayName = dayNames[current.dayOfWeek - 1] || `Day ${current.dayOfWeek}`;
        triggerGlobalToast(
          `Overlapping schedules on ${dayName}: ${current.startTime}-${current.endTime} (${current.hospitalName}) and ${next.startTime}-${next.endTime} (${next.hospitalName})`,
          'error'
        );
        return true;
      }
    }
    return false;
  };

  const confirmAddContract = () => {
    const errors: Record<string, string> = {};
    if (!newContract.hospitalId) {
      errors.contractHospital = 'Please select a hospital facility';
    }
    if (!newContract.roleAssignments || newContract.roleAssignments.length === 0) {
      errors.contractRoles = 'Please select at least one role for this contract';
    } else {
      newContract.roleAssignments.forEach((ra) => {
        if (!ra.departmentName?.trim()) {
          errors[`department_${ra.roleCode}`] = 'Department is required';
        }
        if (ra.roleCode === 'DOCTOR') {
          if (ra.doctorDetails?.consultationFee === undefined || ra.doctorDetails?.consultationFee === null) {
            errors[`fee_${ra.roleCode}`] = 'Consultation fee is required';
          } else if (ra.doctorDetails.consultationFee < 500) {
            errors[`fee_${ra.roleCode}`] = 'Consultation fee must be at least ₹500';
          }
        }
      });
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(prev => ({ ...prev, ...errors }));
      return;
    }

    const hosp = hospitals.find(h => String(h.id) === String(newContract.hospitalId));
    const updatedMemberships = [...(formData.memberships || [])];
    // Keep a private copy in form state. The previous shallow copy reused nested schedule
    // objects, so changing appointment times in one copied contract mutated the others too.
    const contractWithHospitalName = cloneHospitalMembership({
      ...newContract,
      hospitalName: hosp?.name || newContract.hospitalName
    });

    if (editingContractIndex === null) {
      updatedMemberships.push(contractWithHospitalName);
    } else {
      updatedMemberships[editingContractIndex] = contractWithHospitalName;
    }

    if (checkScheduleOverlaps(updatedMemberships)) return;

    setFormData({ ...formData, memberships: updatedMemberships });

    setValidationErrors(prev => {
      const next = { ...prev };
      delete next.contractHospital;
      delete next.contractRoles;
      // Clear all department and fee errors
      Object.keys(next).forEach(key => {
        if (key.startsWith('department_') || key.startsWith('fee_')) {
          delete next[key];
        }
      });
      return next;
    });

    setIsAddingContract(false);
    setEditingContractIndex(null);
    setNewContract({ hospitalId: '', roleAssignments: [] });
  };


  const duplicateContract = (contract: HospitalMembershipDTO) => {
    setNewContract({
      ...cloneHospitalMembership(contract, { resetEntityIds: true }),
      hospitalId: '',
      hospitalName: undefined
    });
    setEditingContractIndex(null);
    setIsAddingContract(true);
  };

  return {
    formData, setFormData, activeTab, setActiveTab, loading, validationErrors,
    hospitals, isAddingContract, setIsAddingContract, editingContractIndex, setEditingContractIndex,
    newContract, setNewContract, assignedRoles, handleSubmit, confirmAddContract, duplicateContract, router
  };
};
