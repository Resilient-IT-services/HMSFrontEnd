import { describe, it, expect, beforeEach, vi } from 'vitest';
import authReducer, { setUser, setSuperMode, setActiveRole, logout } from './authSlice';
import { UserProfileResponse } from '@/types/api';

describe('authSlice', () => {
  const mockUser: UserProfileResponse = {
    id: "user-1",
    username: 'testuser',
    fullName: 'Test User',
    email: 'test@example.com',
    phone: '1234567890',
    dob: '1990-01-01',
    gender: 'MALE',
    active: true,
    deleted: false,
    superuser: false,
    createdAt: new Date().toISOString(),
    roles: [],
    currentHospitalId: "hosp-1",
    memberships: [
      { 
        hospitalId: "hosp-1", 
        hospitalName: 'Hospital A', 
        hospitalCode: 'HA', 
        roleAssignments: [
          { assignmentId: 'a1', roleCode: 'DOCTOR', departments: ['OPD'], active: true },
          { assignmentId: 'a2', roleCode: 'ADMIN', departments: ['Admin'], active: true }
        ] 
      }
    ]
  };

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should return the initial state', () => {
    const initialState = authReducer(undefined, { type: 'unknown' });
    expect(initialState.isAuthenticated).toBe(false);
    expect(initialState.user).toBe(null);
    expect(initialState.activeRole).toBe(null);
  });

  it('should handle setUser', () => {
    const state = authReducer(undefined, setUser(mockUser));
    expect(state.user?.roles).toContain('DOCTOR');
    expect(state.user?.roles).toContain('ADMIN');
    expect(state.isAuthenticated).toBe(true);
  });

  it('should include SUPER_ADMIN role if user is superuser', () => {
    const superUser = { ...mockUser, superuser: true, memberships: [] };
    const state = authReducer(undefined, setUser(superUser));
    expect(state.user?.roles).toContain('SUPER_ADMIN');
  });

  it('should handle setSuperMode', () => {
    let state = authReducer(undefined, setSuperMode(true));
    expect(state.isSuperMode).toBe(true);
    expect(localStorage.getItem('isSuperMode')).toBe('true');

    state = authReducer(state, setSuperMode(false));
    expect(state.isSuperMode).toBe(false);
    expect(localStorage.getItem('isSuperMode')).toBe('false');
  });

  it('should handle setActiveRole', () => {
    const state = authReducer(undefined, setActiveRole('DOCTOR'));
    expect(state.activeRole).toBe('DOCTOR');
    expect(localStorage.getItem('activeRole')).toBe('DOCTOR');
  });

  it('should handle logout', () => {
    localStorage.setItem('activeRole', 'DOCTOR');
    localStorage.setItem('isSuperMode', 'true');
    
    const state = authReducer({
      user: { ...mockUser, roles: ['DOCTOR'] },
      isAuthenticated: true,
      isLoading: false,
      error: null,
      isSuperMode: true,
      activeRole: 'DOCTOR',
      hospitalTimezone: null
    }, logout());

    expect(state.user).toBe(null);
    expect(state.isAuthenticated).toBe(false);
    expect(state.activeRole).toBe(null);
    expect(localStorage.getItem('activeRole')).toBe(null);
    expect(localStorage.getItem('isSuperMode')).toBe(null);
  });

  it('should auto-set activeRole if user has only one effective role', () => {
    const singleRoleUser: UserProfileResponse = { 
      ...mockUser, 
      memberships: [{ 
        hospitalId: "hosp-1", 
        hospitalName: 'Hospital A', 
        hospitalCode: 'HA', 
        roleAssignments: [{ assignmentId: 'a1', roleCode: 'RECEPTIONIST', departments: ['Front'], active: true }]
      }] 
    };
    const state = authReducer(undefined, setUser(singleRoleUser));
    expect(state.activeRole).toBe('RECEPTIONIST');
    expect(localStorage.getItem('activeRole')).toBe('RECEPTIONIST');
  });

  it('should disable superMode if non-super-admin user is set', () => {
    const state = authReducer(
      { 
        user: null,
        isAuthenticated: false,
        isLoading: true,
        error: null,
        isSuperMode: true,
        activeRole: null,
        hospitalTimezone: null 
      }, 
      setUser(mockUser) 
    );
    expect(state.isSuperMode).toBe(false);
  });
});
