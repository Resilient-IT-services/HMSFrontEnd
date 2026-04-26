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
    }
    return [...roles];
  }, [formData.memberships]);

  useEffect(() => {
    hospitalService.list().then(res => {
      if (res.success && res.data) setHospitals(res.data.content || []);
    });
  }, []);

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.fullName?.trim()) errors.fullName = 'Full name is required';
    if (!formData.username?.trim()) errors.username = 'Username is required';
    if (!isEdit && !formData.password?.trim()) errors.password = 'Password is required';
    if (!formData.email?.trim()) errors.email = 'Email is required';
    if (!formData.phone?.trim()) errors.phone = 'Phone is required';
    if (!formData.dob) errors.dob = 'DOB is required';
    
    if (!formData.superuser && (!formData.memberships || formData.memberships.length === 0)) {
      errors.memberships = 'At least one hospital contract is required.';
    }
    setValidationErrors(errors);
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
