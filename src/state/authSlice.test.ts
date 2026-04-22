import { describe, it, expect, beforeEach, vi } from 'vitest';
import authReducer, { setUser, setSuperMode, setActiveRole, logout } from './authSlice';
import { UserProfileResponse } from '@/types/api';

describe('authSlice', () => {
  const mockUser: UserProfileResponse = {
    userId: 1,
    hospitalId: 101,
    username: 'testuser',
    roles: ['DOCTOR', 'ADMIN'], // ✅ YE LINE ADD KAR
    hospitals: [
      { hospitalId: 101, hospitalName: 'Hospital A', hospitalCode: 'HA', roles: ['DOCTOR', 'ADMIN'] }
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
    expect(state.user).toEqual({
      ...mockUser,
      roles: ['DOCTOR', 'ADMIN']
    });
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

  it('should auto-set activeRole if user has only one effective role', () => {
    const singleRoleUser: UserProfileResponse = { 
      ...mockUser, 
      hospitals: [{ hospitalId: 101, hospitalName: 'Hospital A', hospitalCode: 'HA', roles: ['RECEPTIONIST'] }] 
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
        activeRole: null 
      }, 
      setUser(mockUser) // mockUser has DOCTOR, ADMIN, but not SUPER_ADMIN in its hospitals
    );
    expect(state.isSuperMode).toBe(false);
  });
});
