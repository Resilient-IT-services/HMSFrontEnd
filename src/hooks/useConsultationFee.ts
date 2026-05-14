import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/state/store';

export const useConsultationFee = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  return useMemo(() => {
    if (!user || !user.currentHospitalId) return 404; // TODO: handle no hospital
    const membership = user.memberships.find((m) => m.hospitalId === user.currentHospitalId);
    if (!membership || !membership.roleAssignments) return 404; // TODO: handle no membership
    const doctorRole = membership.roleAssignments.find((ra) => ra.roleCode === 'DOCTOR' && ra.active);
    return doctorRole?.doctorDetails?.consultationFee || 404; // TODO: handle no fee
  }, [user]);
};
