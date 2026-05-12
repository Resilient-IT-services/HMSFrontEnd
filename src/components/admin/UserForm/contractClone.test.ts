import { describe, expect, it } from 'vitest';
import { HospitalMembershipDTO } from '@/types/api';
import { cloneHospitalMembership } from './contractClone';

describe('cloneHospitalMembership', () => {
  const contract: HospitalMembershipDTO = {
    hospitalId: 'hospital-1',
    hospitalName: 'City Hospital',
    roles: ['DOCTOR'],
    roleAssignments: [
      {
        assignmentId: 'assignment-1',
        roleCode: 'DOCTOR',
        departmentName: 'Cardiology',
        active: true,
        schedules: [
          {
            id: 'schedule-1',
            dayOfWeek: 1,
            startTime: '09:00',
            endTime: '12:00',
            slotDurationMinutes: 15,
            maxPatients: 10
          }
        ],
        doctorDetails: {
          consultationFee: 500,
          followUpDays: 7,
          commissionType: 'PERCENTAGE',
          commissionValue: 10,
          visitingConsultant: false,
          updatedAt: '2026-05-12T00:00:00Z'
        }
      }
    ]
  };

  it('creates independent copied contracts with separate nested schedules and reset ids', () => {
    const firstCopy = cloneHospitalMembership(contract, { resetEntityIds: true });
    const secondCopy = cloneHospitalMembership(contract, { resetEntityIds: true });

    firstCopy.roleAssignments![0].schedules![0].startTime = '10:30';

    expect(contract.roleAssignments![0].schedules![0].startTime).toBe('09:00');
    expect(secondCopy.roleAssignments![0].schedules![0].startTime).toBe('09:00');
    expect(firstCopy.roleAssignments![0].assignmentId).toBe('');
    expect(firstCopy.roleAssignments![0].schedules![0].id).toBeUndefined();
  });
});
