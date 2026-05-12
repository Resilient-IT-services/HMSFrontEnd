import { HospitalMembershipDTO, RoleAssignmentDTO } from '@/types/api';

interface CloneOptions {
  resetEntityIds?: boolean;
}

const cloneRoleAssignment = (roleAssignment: RoleAssignmentDTO, resetEntityIds: boolean): RoleAssignmentDTO => ({
  ...roleAssignment,
  // Duplicated contracts must not keep child entity ids; otherwise backend saves can target
  // the same schedule/assignment records and edits in one copy appear in another copy.
  assignmentId: resetEntityIds ? '' : roleAssignment.assignmentId,
  schedules: roleAssignment.schedules?.map(schedule => ({
    ...schedule,
    id: resetEntityIds ? undefined : schedule.id
  })),
  availabilityExceptions: roleAssignment.availabilityExceptions?.map(exception => ({
    ...exception,
    id: resetEntityIds ? undefined : exception.id
  })),
  doctorDetails: roleAssignment.doctorDetails ? { ...roleAssignment.doctorDetails } : undefined,
  nurseDetails: roleAssignment.nurseDetails ? { ...roleAssignment.nurseDetails } : undefined,
  adminDetails: roleAssignment.adminDetails ? { ...roleAssignment.adminDetails } : undefined,
  pharmacistDetails: roleAssignment.pharmacistDetails ? { ...roleAssignment.pharmacistDetails } : undefined,
  receptionistDetails: roleAssignment.receptionistDetails ? { ...roleAssignment.receptionistDetails } : undefined
});

export const cloneHospitalMembership = (
  contract: HospitalMembershipDTO,
  options: CloneOptions = {}
): HospitalMembershipDTO => {
  const resetEntityIds = options.resetEntityIds ?? false;

  return {
    ...contract,
    roles: contract.roles ? [...contract.roles] : undefined,
    roleAssignments: contract.roleAssignments?.map(roleAssignment =>
      cloneRoleAssignment(roleAssignment, resetEntityIds)
    )
  };
};
