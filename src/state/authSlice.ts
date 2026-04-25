import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UserProfileResponse, Role } from '@/types/api';

interface AuthState {
  user: UserProfileResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isSuperMode: boolean;
  activeRole: Role | null;
}

const getInitialSuperMode = () => {
  if (globalThis.window !== undefined) {
    return localStorage.getItem('isSuperMode') === 'true';
  }
  return false;
};

const getInitialActiveRole = () => {
  if (globalThis.window !== undefined) {
    return localStorage.getItem('activeRole') as Role | null;
  }
  return null;
};

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  isSuperMode: getInitialSuperMode(),
  activeRole: getInitialActiveRole(),
};

const computeRoles = (user: UserProfileResponse, hospitalId: string | null): Role[] => {
  const effectiveRolesSet = new Set<Role>();
  
  if (user.superuser) {
    effectiveRolesSet.add('SUPER_ADMIN');
  }

  // Global/Detailed memberships processing
  user.memberships.forEach(m => {
    // If no hospitalId filter or it matches, add roles
    if (!hospitalId || m.hospitalId === hospitalId) {
      if (m.roleAssignments) {
        m.roleAssignments.forEach(ra => {
          if (ra.active) {
            effectiveRolesSet.add(ra.roleCode as Role);
          }
        });
      }
      if (m.roles) {
        m.roles.forEach(r => {
          effectiveRolesSet.add(r as Role);
        });
      }
    }
  });

  return Array.from(effectiveRolesSet);
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<UserProfileResponse | null>) => {
      if (!action.payload) {
        state.user = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        state.error = null;
        state.isSuperMode = false;
        state.activeRole = null;
        return;
      }

      // Restore hospitalId from localStorage if not provided in payload
      let hospitalId = action.payload.currentHospitalId;
      if (!hospitalId && globalThis.window !== undefined) {
        hospitalId = localStorage.getItem('currentHospitalId');
      }

      // Validate restored hospitalId against memberships
      if (hospitalId && !action.payload.memberships.some(m => m.hospitalId === hospitalId)) {
        hospitalId = null;
        if (globalThis.window !== undefined) localStorage.removeItem('currentHospitalId');
      }

      const rolesArray = computeRoles(action.payload, hospitalId || null);

      state.user = {
        ...action.payload,
        currentHospitalId: hospitalId,
        roles: rolesArray
      };
      
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;

      const isSuperUser = rolesArray.includes('SUPER_ADMIN');
      if (!isSuperUser) {
        state.isSuperMode = false;
        if (globalThis.window !== undefined) localStorage.removeItem('isSuperMode');
      }

      // If active role is not in current effective roles, reset it
      if (state.activeRole && !rolesArray.includes(state.activeRole)) {
        state.activeRole = null;
        if (globalThis.window !== undefined) localStorage.removeItem('activeRole');
      }
      
      // Auto-set active role ONLY if exactly one exists
      if (rolesArray.length === 1) {
        state.activeRole = rolesArray[0];
        if (globalThis.window !== undefined) localStorage.setItem('activeRole', state.activeRole);
      }
    },
    setCurrentHospitalId: (state, action: PayloadAction<string | null>) => {
      if (state.user) {
        state.user.currentHospitalId = action.payload;
        if (globalThis.window !== undefined) {
          if (action.payload) localStorage.setItem('currentHospitalId', action.payload);
          else localStorage.removeItem('currentHospitalId');
        }
        const rolesArray = computeRoles(state.user, action.payload);
        state.user.roles = rolesArray;

        if (state.activeRole && !rolesArray.includes(state.activeRole)) {
          state.activeRole = null;
          if (globalThis.window !== undefined) localStorage.removeItem('activeRole');
        }

        if (rolesArray.length === 1 && !state.activeRole) {
          state.activeRole = rolesArray[0];
          if (globalThis.window !== undefined) localStorage.setItem('activeRole', state.activeRole);
        }
      }
    },
    setSuperMode: (state, action: PayloadAction<boolean>) => {
      state.isSuperMode = action.payload;
      if (globalThis.window !== undefined) {
        localStorage.setItem('isSuperMode', String(action.payload));
      }
    },
    setActiveRole: (state, action: PayloadAction<Role | null>) => {
      state.activeRole = action.payload;
      if (globalThis.window !== undefined) {
        if (action.payload) localStorage.setItem('activeRole', action.payload);
        else localStorage.removeItem('activeRole');
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
      state.activeRole = null;
      state.isSuperMode = false;
      if (globalThis.window !== undefined) {
        localStorage.removeItem('activeRole');
        localStorage.removeItem('isSuperMode');
        localStorage.removeItem('currentHospitalId');
        localStorage.removeItem('token');
      }
    },
    clearAuthSession: (state) => {
      state.activeRole = null;
      if (globalThis.window !== undefined) {
        localStorage.removeItem('activeRole');
        localStorage.removeItem('currentHospitalId');
      }
    },
  },
});

export const { setUser, setLoading, setError, logout, setSuperMode, setActiveRole, setCurrentHospitalId, clearAuthSession } = authSlice.actions;
export default authSlice.reducer;
