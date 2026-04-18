import { describe, it, expect, beforeEach, vi } from 'vitest';
import authReducer, { setUser, setSuperMode, setActiveRole, logout } from './authSlice';
import { UserProfileResponse } from '@/types/api';

describe('authSlice', () => {
  const mockUser: UserProfileResponse = {
    userId: 1,
    hospitalId: 101,
    username: 'testuser',
    roles: ['DOCTOR', 'ADMIN'],
    hospitals: [
      { hospitalId: 101, hospitalName: 'Hospital A', hospitalCode: 'HA', roles: ['DOCTOR'] }
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
    expect(state.user).toEqual(mockUser);
    expect(state.isAuthenticated).toBe(true);
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
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
      error: null,
      isSuperMode: true,
      activeRole: 'DOCTOR'
    }, logout());

    expect(state.user).toBe(null);
    expect(state.isAuthenticated).toBe(false);
    expect(state.activeRole).toBe(null);
    expect(localStorage.getItem('activeRole')).toBe(null);
    expect(localStorage.getItem('isSuperMode')).toBe(null);
  });

  it('should auto-set activeRole if user has only one role', () => {
    const singleRoleUser = { ...mockUser, roles: ['RECEPTIONIST'] as any };
    const state = authReducer(undefined, setUser(singleRoleUser));
    expect(state.activeRole).toBe('RECEPTIONIST');
    expect(localStorage.getItem('activeRole')).toBe('RECEPTIONIST');
  });

  it('should disable superMode if non-super-admin user is set', () => {
    const state = authReducer(
      { ...undefined as any, isSuperMode: true }, 
      setUser(mockUser) // mockUser has DOCTOR, ADMIN, but not SUPER_ADMIN
    );
    expect(state.isSuperMode).toBe(false);
  });
});
