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
import { catalogService } from '@/services/catalogService';
import { triggerGlobalToast } from '@/components/ui/Toast';
import { validateDOB } from '@/utils/dateValidator';
import { cloneHospitalMembership } from './contractClone';
import { DAY_OF_WEEK_OPTIONS } from '@/utils/enumOptions';

export const useUserFormLogic = (initialData?: UserFullProfileDTO, isEdit?: boolean) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'personal' | 'contracts' | 'profile'>('personal');
  const [hospitals, setHospitals] = useState<HospitalResponse[]>([]);
  const [specializations, setSpecializations] = useState<string[]>([]);
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
    doctorInfo: initialData?.doctorInfo ? {
        ...initialData.doctorInfo,
        specialization: initialData.doctorInfo.specializations?.[0] || initialData.doctorInfo.specialization || '',
        specializations: initialData.doctorInfo.specializations || [],
        education: {
          qualifications: initialData.doctorInfo.education?.qualifications || []
        }
    } : undefined,
    nurseInfo: initialData?.nurseInfo,
    pharmacistInfo: initialData?.pharmacistInfo,
    receptionistInfo: initialData?.receptionistInfo ? {
      ...initialData.receptionistInfo,
      languagesSpoken: {
        fluencies: initialData.receptionistInfo.languagesSpoken?.fluencies || []
      }
    } : undefined,
  });

  const [isAddingContract, setIsAddingContract] = useState(false);
  const [editingContractIndex, setEditingContractIndex] = useState<number | null>(null);
  const [newContract, setNewContract] = useState<HospitalMembershipDTO>({ hospitalId: '', roleAssignments: [] });

  const getAssignedRoles = (memberships: HospitalMembershipDTO[]) => {
    const roles = new Set<string>();
    if (memberships) for (const m of memberships) {
      if (m.roleAssignments) for (const ra of m.roleAssignments) roles.add(ra.roleCode);
      if ((m as any).roles) (m as any).roles.forEach((r: string) => roles.add(r));
    }
    return [...roles];
  };

  const assignedRoles = useMemo(() => getAssignedRoles(formData.memberships || []), [formData.memberships]);

  const getProfileInfoUpdates = (memberships: HospitalMembershipDTO[], currentFormData: UserRequestDTO) => {
    const roles = getAssignedRoles(memberships);
    const updates: Partial<UserRequestDTO> = {};
    
    if (roles.includes('DOCTOR') && !currentFormData.doctorInfo) {
      updates.doctorInfo = { specialization: '', specializations: [], licenseNumber: '', bio: '', education: { qualifications: [] } };
    }
    if (roles.includes('NURSE') && !currentFormData.nurseInfo) {
      updates.nurseInfo = { nursingLicenseNo: '', certificationLevel: 'RN' };
    }
    if (roles.includes('PHARMACIST') && !currentFormData.pharmacistInfo) {
      updates.pharmacistInfo = { pciRegNo: '', qualification: '' };
    }
    if (roles.includes('RECEPTIONIST') && !currentFormData.receptionistInfo) {
      updates.receptionistInfo = { languagesSpoken: { fluencies: [] }, insuranceSpecialist: false };
    }
    return updates;
  };

  const clearContractErrors = () => {
    setValidationErrors(prev => {
      const next = { ...prev };
      delete next.contractHospital;
      delete next.contractRoles;
      Object.keys(next).forEach(key => {
        if (key.startsWith('department_') || key.startsWith('departments_') || key.startsWith('fee_')) {
          delete next[key];
        }
      });
      return next;
    });
  };

  const openAddContract = () => {
    clearContractErrors();
    setNewContract({ hospitalId: '', roleAssignments: [] });
    setEditingContractIndex(null);
    setIsAddingContract(true);
  };

  const openEditContract = (index: number, contract: HospitalMembershipDTO) => {
    clearContractErrors();
    setNewContract(cloneHospitalMembership(contract));
    setEditingContractIndex(index);
    setIsAddingContract(true);
  };

  useEffect(() => {
    hospitalService.list().then(res => {
      if (res.success && res.data) setHospitals(res.data.content || []);
    });
    catalogService.getSpecializations().then(res => {
      if (res.success && res.data) setSpecializations(res.data);
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
      if ((!formData.doctorInfo.specializations || formData.doctorInfo.specializations.length === 0) && !formData.doctorInfo.specialization?.trim()) {
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
        specializations: formData.doctorInfo.specializations?.length ? formData.doctorInfo.specializations : (formData.doctorInfo.specialization ? [formData.doctorInfo.specialization] : []),
        specialization: formData.doctorInfo.specialization?.trim(),
        licenseNumber: formData.doctorInfo.licenseNumber?.trim(),
        registrationNumber: formData.doctorInfo.registrationNumber?.trim() || undefined,
        bio: formData.doctorInfo.bio?.trim() || '',
        education: {
          qualifications: (formData.doctorInfo.education?.qualifications || [])
            .map((qualification) => ({
              degree: qualification.degree?.trim(),
              institution: qualification.institution?.trim(),
              year: qualification.year,
              specialization: qualification.specialization?.trim(),
            }))
            .filter((qualification) => qualification.degree || qualification.institution || qualification.specialization || qualification.year)
            .map((qualification) => ({
              degree: qualification.degree || '',
              institution: qualification.institution || '',
              year: qualification.year || 0,
              specialization: qualification.specialization || '',
            }))
        }
      } : undefined;

      const cleanedNurseInfo = formData.nurseInfo ? {
        ...formData.nurseInfo,
        nursingLicenseNo: formData.nurseInfo.nursingLicenseNo?.trim()
      } : undefined;

      const cleanedPharmacistInfo = formData.pharmacistInfo ? {
        ...formData.pharmacistInfo,
        pciRegNo: formData.pharmacistInfo.pciRegNo?.trim()
      } : undefined;

      const cleanedReceptionistInfo = formData.receptionistInfo ? {
        ...formData.receptionistInfo,
        languagesSpoken: {
          fluencies: (formData.receptionistInfo.languagesSpoken?.fluencies || [])
            .map((fluency) => ({
              language: fluency.language?.trim(),
              proficiency: fluency.proficiency
            }))
            .filter((fluency) => fluency.language)
            .map((fluency) => ({
              language: fluency.language || '',
              proficiency: fluency.proficiency || 'BASIC'
            }))
        }
      } : undefined;

      const userPayload: UserRequestDTO = {
        ...formData,
        doctorInfo: cleanedDoctorInfo,
        nurseInfo: cleanedNurseInfo,
        pharmacistInfo: cleanedPharmacistInfo,
        receptionistInfo: cleanedReceptionistInfo,
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
    const dayNames = DAY_OF_WEEK_OPTIONS.map((option) => option.value) as Array<NonNullable<ScheduleDTO['dayOfWeek']>>;
    const dayOrder: Record<string, number> = {
      MONDAY: 1,
      TUESDAY: 2,
      WEDNESDAY: 3,
      THURSDAY: 4,
      FRIDAY: 5,
      SATURDAY: 6,
      SUNDAY: 7
    };
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
      const aDay = dayOrder[a.dayOfWeek] || 99;
      const bDay = dayOrder[b.dayOfWeek] || 99;
      if (aDay !== bDay) return aDay - bDay;
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
        const dayName = current.dayOfWeek || dayNames[0];
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
        if (!ra.departments || ra.departments.length === 0) {
          errors[`departments_${ra.roleCode}`] = 'At least one department is required';
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

    const profileUpdates = getProfileInfoUpdates(updatedMemberships, formData);
    setFormData({ ...formData, memberships: updatedMemberships, ...profileUpdates });

    setValidationErrors(prev => {
      const next = { ...prev };
      delete next.contractHospital;
      delete next.contractRoles;
      // Clear all department and fee errors
      Object.keys(next).forEach(key => {
        if (key.startsWith('department_') || key.startsWith('departments_') || key.startsWith('fee_')) {
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
    clearContractErrors();
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
    hospitals, specializations, isAddingContract, openAddContract, openEditContract, setIsAddingContract, editingContractIndex, setEditingContractIndex,
    newContract, setNewContract, assignedRoles, handleSubmit, confirmAddContract, duplicateContract, router
  };
};
