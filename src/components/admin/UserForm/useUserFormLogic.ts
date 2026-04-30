'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  UserRequestDTO, 
  UserFullProfileDTO, 
  HospitalResponse,
  HospitalMembershipDTO
} from '@/types/api';
import { hospitalService } from '@/services/hospitalService';
import { userService } from '@/services/userService';
import { triggerGlobalToast } from '@/components/ui/Toast';

export const useUserFormLogic = (initialData?: UserFullProfileDTO, isEdit?: boolean) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'personal' | 'contracts' | 'profile'>('personal');
  const [hospitals, setHospitals] = useState<HospitalResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
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

  const [isAddingContract, setIsAddingContract] = useState(false);
  const [editingContractIndex, setEditingContractIndex] = useState<number | null>(null);
  const [newContract, setNewContract] = useState<HospitalMembershipDTO>({ hospitalId: '', roleAssignments: [] });

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
    if (formData.dob) {
      const dobDate = new Date(formData.dob);
      const today = new Date();
      if (dobDate >= today) {
        errors.dob = 'Date of birth cannot be in the future';
      }
    } else {
      errors.dob = 'Date of birth is required';
    }
    
    if (!formData.superuser && (!formData.memberships || formData.memberships.length === 0)) {
      errors.memberships = 'At least one hospital contract is required for non-superusers.';
    }

    setValidationErrors(errors);
    if (Object.keys(errors).length > 0) {
      triggerGlobalToast('Please fix the validation errors', 'error');
    }
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validate()) return;

    try {
      setLoading(true);
      const response = isEdit && initialData?.id
        ? await userService.updateUser(initialData.id, formData)
        : await userService.createUser(formData);

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

  const confirmAddContract = () => {
    if (!newContract.hospitalId) return;
    const hosp = hospitals.find(h => String(h.id) === String(newContract.hospitalId));
    const updatedMemberships = [...(formData.memberships || [])];
    if (editingContractIndex === null) {updatedMemberships.push({ ...newContract, hospitalName: hosp?.name });}
    else {updatedMemberships[editingContractIndex] = { ...newContract, hospitalName: hosp?.name };}
    
    setFormData({ ...formData, memberships: updatedMemberships });
    setIsAddingContract(false);
    setEditingContractIndex(null);
    setNewContract({ hospitalId: '', roleAssignments: [] });
  };

  const duplicateContract = (contract: HospitalMembershipDTO) => {
    setNewContract({ ...contract, hospitalId: '', hospitalName: undefined });
    setEditingContractIndex(null);
    setIsAddingContract(true);
  };

  return {
    formData, setFormData, activeTab, setActiveTab, loading, validationErrors,
    hospitals, isAddingContract, setIsAddingContract, editingContractIndex, setEditingContractIndex,
    newContract, setNewContract, assignedRoles, handleSubmit, confirmAddContract, duplicateContract, router
  };
};
