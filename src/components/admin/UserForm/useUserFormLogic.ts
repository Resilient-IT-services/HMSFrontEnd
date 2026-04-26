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

export const useUserFormLogic = (initialData?: UserFullProfileDTO, isEdit?: boolean) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'personal' | 'contracts' | 'profile'>('personal');
  const [currentStep, setCurrentStep] = useState(1);
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
    doctorInfo: initialData?.doctorInfo || { specialization: '', licenseNumber: '', bio: '', education: { qualifications: [] } },
    nurseInfo: initialData?.nurseInfo || { nursingLicenseNo: '', certificationLevel: 'RN' },
    pharmacistInfo: initialData?.pharmacistInfo || { pciRegNo: '', qualification: '' },
    receptionistInfo: initialData?.receptionistInfo || { languagesSpoken: { fluencies: [] }, insuranceSpecialist: false },
  });

  const [isAddingContract, setIsAddingContract] = useState(false);
  const [editingContractIndex, setEditingContractIndex] = useState<number | null>(null);
  const [newContract, setNewContract] = useState<HospitalMembershipDTO>({ hospitalId: '', roleAssignments: [] });

  const assignedRoles = useMemo(() => {
    const roles = new Set<string>();
    formData.memberships?.forEach(m => {
      m.roleAssignments?.forEach(ra => roles.add(ra.roleCode));
    });
    return Array.from(roles);
  }, [formData.memberships]);

  useEffect(() => {
    hospitalService.list().then(res => {
      if (res.success && res.data) setHospitals(res.data.content || []);
    });
  }, []);

  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};
    if (step === 1) {
      if (!formData.fullName?.trim()) errors.fullName = 'Full name is required';
      if (!formData.username?.trim()) errors.username = 'Username is required';
      if (!isEdit && !formData.password?.trim()) errors.password = 'Password is required';
      if (!formData.dob) errors.dob = 'DOB is required';
    } else if (step === 2) {
      if (!formData.email?.trim()) errors.email = 'Email is required';
      if (!formData.phone?.trim()) errors.phone = 'Phone is required';
    } else if (step === 3) {
      if (!formData.superuser && (!formData.memberships || formData.memberships.length === 0)) {
        errors.memberships = 'At least one hospital contract is required.';
      }
      if (assignedRoles.includes('DOCTOR') && !formData.doctorInfo?.specialization?.trim()) {
        errors.specialization = 'Doctor specialization is required';
      }
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
        // If final validation fails, jump to first step with errors
        if (!validateStep(1)) setCurrentStep(1);
        else if (!validateStep(2)) setCurrentStep(2);
        return;
    }

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
    if (editingContractIndex !== null) updatedMemberships[editingContractIndex] = { ...newContract, hospitalName: hosp?.name };
    else updatedMemberships.push({ ...newContract, hospitalName: hosp?.name });
    
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
    formData, setFormData, currentStep, setCurrentStep, loading, validationErrors,
    hospitals, isAddingContract, setIsAddingContract, editingContractIndex, setEditingContractIndex,
    newContract, setNewContract, assignedRoles, handleSubmit, confirmAddContract, duplicateContract, router,
    nextStep, prevStep
  };
};
