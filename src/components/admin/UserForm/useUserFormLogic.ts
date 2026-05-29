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
import { catalogService } from '@/services/catalogService';
import { triggerGlobalToast } from '@/components/ui/Toast';
import { validateDOB } from '@/utils/dateValidator';
import { cloneHospitalMembership } from './contractClone';

const cleanDoctorInfo = (info: UserRequestDTO['doctorInfo']) => {
  if (!info) return;
  return {
    ...info,
    specializations: info.specializations?.length ? info.specializations : (info.specialization ? [info.specialization] : []),
    specialization: info.specialization?.trim(),
    licenseNumber: info.licenseNumber?.trim(),
    registrationNumber: info.registrationNumber?.trim() || undefined,
    bio: info.bio?.trim() || '',
    education: {
      qualifications: (info.education?.qualifications || [])
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
  };
};

const cleanNurseInfo = (info: UserRequestDTO['nurseInfo']) => {
  if (!info) return;
  return { ...info, nursingLicenseNo: info.nursingLicenseNo?.trim() };
};

const cleanPharmacistInfo = (info: UserRequestDTO['pharmacistInfo']) => {
  if (!info) return;
  return { ...info, pciRegNo: info.pciRegNo?.trim() };
};

const cleanLabTechInfo = (info: UserRequestDTO['labTechInfo']) => {
  if (!info) return;
  return { ...info, licenseNo: info.licenseNo?.trim(), specialty: info.specialty?.trim() };
};

const cleanReceptionistInfo = (info: UserRequestDTO['receptionistInfo']) => {
  if (!info) return;
  return {
    ...info,
    languagesSpoken: {
      fluencies: (info.languagesSpoken?.fluencies || [])
        .map((fluency) => ({ language: fluency.language?.trim(), proficiency: fluency.proficiency }))
        .filter((fluency) => fluency.language)
        .map((fluency) => ({ language: fluency.language || '', proficiency: fluency.proficiency || 'BASIC' }))
    }
  };
};

const mapInitialDataToForm = (initialData?: UserFullProfileDTO): UserRequestDTO => ({
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
    education: { qualifications: initialData.doctorInfo.education?.qualifications || [] }
  } : undefined,
  nurseInfo: initialData?.nurseInfo,
  pharmacistInfo: initialData?.pharmacistInfo,
  labTechInfo: initialData?.labTechInfo,
  receptionistInfo: initialData?.receptionistInfo ? {
    ...initialData.receptionistInfo,
    languagesSpoken: { fluencies: initialData.receptionistInfo.languagesSpoken?.fluencies || [] }
  } : undefined,
});

const validateProfessionalDetails = (assignedRoles: string[], formData: UserRequestDTO, errors: Record<string, string>) => {
  if (assignedRoles.includes('DOCTOR') && formData.doctorInfo) {
    if ((!formData.doctorInfo.specializations || formData.doctorInfo.specializations.length === 0) && !formData.doctorInfo.specialization?.trim()) {
      errors.specialization = 'Specialization is required';
    }
    if (!formData.doctorInfo.licenseNumber?.trim()) errors.licenseNumber = 'License number is required';
  }
  if (assignedRoles.includes('NURSE') && formData.nurseInfo && !formData.nurseInfo.nursingLicenseNo?.trim()) {
    errors.nursingLicenseNo = 'Nurse license number is required';
  }
  if (assignedRoles.includes('PHARMACIST') && formData.pharmacistInfo && !formData.pharmacistInfo.pciRegNo?.trim()) {
    errors.pciRegNo = 'PCI Registration number is required';
  }
  if (assignedRoles.includes('LAB_TECHNICIAN') && formData.labTechInfo && !formData.labTechInfo.licenseNo?.trim()) {
    errors.licenseNo = 'License number is required';
  }
};

export const useUserFormLogic = (initialData?: UserFullProfileDTO, isEdit?: boolean) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'personal' | 'contracts' | 'profile'>('personal');
  const [hospitals, setHospitals] = useState<HospitalResponse[]>([]);
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<UserRequestDTO>(() => mapInitialDataToForm(initialData));

  const [isAddingContract, setIsAddingContract] = useState(false);
  const [editingContractIndex, setEditingContractIndex] = useState<number | null>(null);
  const [newContract, setNewContract] = useState<HospitalMembershipDTO>({ hospitalId: '', roleAssignments: [] });

  const assignedRoles = useMemo(() => {
    const roles = new Set<string>();
    if (formData.memberships) for (const m of formData.memberships) {
      if (m.roleAssignments) for (const ra of m.roleAssignments) roles.add(ra.roleCode);
      if ((m as any).roles) (m as any).roles.forEach((r: string) => roles.add(r));
    }
    return [...roles];
  }, [formData.memberships]);

  useEffect(() => {
    hospitalService.list().then(res => { if (res.success && res.data) setHospitals(res.data.content || []); });
    catalogService.getSpecializations().then(res => { if (res.success && res.data) setSpecializations(res.data); });
  }, []);

  // Initialize professional info objects when roles are assigned
   
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFormData(prev => {
      let updated = false;
      const next = { ...prev };

      if (assignedRoles.includes('DOCTOR') && !next.doctorInfo) {
        next.doctorInfo = { specializations: [], education: { qualifications: [] }, bio: '', licenseNumber: '' };
        updated = true;
      }
      if (assignedRoles.includes('NURSE') && !next.nurseInfo) {
        next.nurseInfo = { nursingLicenseNo: '', certificationLevel: 'RN' };
        updated = true;
      }
      if (assignedRoles.includes('PHARMACIST') && !next.pharmacistInfo) {
        next.pharmacistInfo = { pciRegNo: '', qualification: '' };
        updated = true;
      }
      if (assignedRoles.includes('LAB_TECHNICIAN') && !next.labTechInfo) {
        next.labTechInfo = { licenseNo: '', specialty: '' };
        updated = true;
      }
      if (assignedRoles.includes('RECEPTIONIST') && !next.receptionistInfo) {
        next.receptionistInfo = { languagesSpoken: { fluencies: [] }, insuranceSpecialist: false };
        updated = true;
      }

      return updated ? next : prev;
    });
  }, [assignedRoles]);

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.fullName?.trim()) errors.fullName = 'Full name is required';
    if (!formData.username?.trim()) errors.username = 'Username is required';
    if (!isEdit && !formData.password?.trim()) errors.password = 'Password is required';
    
    const emailRegex = /^[\w.%+-]+@[\w.-]+\.[A-Za-z]{2,}$/;
    if (!formData.email?.trim()) errors.email = 'Email is required';
    else if (!emailRegex.test(formData.email)) errors.email = 'Invalid email format';

    const phoneRegex = /^\+?[0-9]{10,15}$/;
    if (!formData.phone?.trim()) errors.phone = 'Phone number is required';
    else if (!phoneRegex.test(formData.phone.replaceAll(/\s/g, ''))) errors.phone = 'Invalid phone number';

    const dobValidation = validateDOB(formData.dob);
    if (!dobValidation.isValid) errors.dob = dobValidation.message || 'Invalid DOB';
    if (!formData.superuser && (!formData.memberships || formData.memberships.length === 0)) errors.memberships = 'Hospital contract required';

    validateProfessionalDetails(assignedRoles, formData, errors);
    setValidationErrors(errors);
    if (Object.keys(errors).length > 0) triggerGlobalToast('Please fix validation errors', 'error');
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validate()) return;
    try {
      setLoading(true);
      const userPayload: UserRequestDTO = {
        ...formData,
        doctorInfo: cleanDoctorInfo(formData.doctorInfo),
        nurseInfo: cleanNurseInfo(formData.nurseInfo),
        pharmacistInfo: cleanPharmacistInfo(formData.pharmacistInfo),
        labTechInfo: cleanLabTechInfo(formData.labTechInfo),
        receptionistInfo: cleanReceptionistInfo(formData.receptionistInfo),
        status: formData.active ? 'ACTIVE' : 'INACTIVE'
      };
      const response = isEdit && initialData?.id ? await userService.updateUser(initialData.id, userPayload) : await userService.createUser(userPayload);
      if (response.success) router.push('/admin/users');
    } catch (error: any) {
      if (error.response?.data?.details) setValidationErrors(error.response.data.details);
    } finally { setLoading(false); }
  };

  const confirmAddContract = () => {
    if (!newContract.hospitalId || !newContract.roleAssignments?.length) {
      triggerGlobalToast('Hospital and Roles are required', 'error');
      return;
    }
    const hosp = hospitals.find(h => String(h.id) === String(newContract.hospitalId));
    const updatedMemberships = [...(formData.memberships || [])];
    const contractWithHospitalName = cloneHospitalMembership({ ...newContract, hospitalName: hosp?.name || newContract.hospitalName });
    if (editingContractIndex === null) updatedMemberships.push(contractWithHospitalName);
    else updatedMemberships[editingContractIndex] = contractWithHospitalName;
    setFormData({ ...formData, memberships: updatedMemberships });
    setIsAddingContract(false);
  };

  return {
    formData, setFormData, activeTab, setActiveTab, loading, validationErrors,
    hospitals, specializations, isAddingContract, setIsAddingContract, editingContractIndex,
    newContract, setNewContract, assignedRoles, handleSubmit, confirmAddContract,
    openAddContract: () => { setNewContract({ hospitalId: '', roleAssignments: [] }); setIsAddingContract(true); },
    openEditContract: (i: number, c: HospitalMembershipDTO) => { setNewContract(cloneHospitalMembership(c)); setEditingContractIndex(i); setIsAddingContract(true); },
    duplicateContract: (c: HospitalMembershipDTO) => { setNewContract({ ...cloneHospitalMembership(c, { resetEntityIds: true }), hospitalId: '' }); setIsAddingContract(true); },
    router
  };
};
