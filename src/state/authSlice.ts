import { createSlice, PayloadAction, Reducer, UnknownAction } from '@reduxjs/toolkit';
import { UserProfileResponse, Role } from '@/types/api';

export interface AuthState {
  user: UserProfileResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isSuperMode: boolean;
  activeRole: Role | null;
  hospitalTimezone: string | null;
}

export type AuthAction = PayloadAction<UserProfileResponse | null> 
  | PayloadAction<string | null> 
  | PayloadAction<boolean> 
  | PayloadAction<Role | null> 
  | PayloadAction<void>
  | UnknownAction;

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  isSuperMode: false,
  activeRole: null,
  hospitalTimezone: null,
};

const computeRoles = (user: UserProfileResponse, hospitalId: string | null): Role[] => {
  const effectiveRolesSet = new Set<Role>();
  
  if (user.superuser) {
    effectiveRolesSet.add('SUPER_ADMIN');
  }

  for (const m of user.memberships) {
    if ((!hospitalId || m.hospitalId === hospitalId) && m.roleAssignments) {
        for (const ra of m.roleAssignments) {
          if (ra.active) {
            effectiveRolesSet.add(ra.roleCode as Role);
          }
        }
      }
  }

  return [...effectiveRolesSet];
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    hydrateAuth: (state) => {
      if (globalThis.window !== undefined) {
        state.isSuperMode = localStorage.getItem('isSuperMode') === 'true';
        state.activeRole = (localStorage.getItem('activeRole') as Role) || null;
        state.hospitalTimezone = localStorage.getItem('hospitalTimezone');
      }
    },
    setUser: (state, action: PayloadAction<UserProfileResponse | null>) => {
      if (!action.payload) {
        state.user = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        state.error = null;
        state.isSuperMode = false;
        state.activeRole = null;
        state.hospitalTimezone = null;
        return;
      }

      let hospitalId = action.payload.currentHospitalId;
      if (!hospitalId && globalThis.window !== undefined) {
        hospitalId = localStorage.getItem('currentHospitalId');
      }

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

      if (state.activeRole && !rolesArray.includes(state.activeRole)) {
        state.activeRole = null;
        if (globalThis.window !== undefined) localStorage.removeItem('activeRole');
      }
      
      if (rolesArray.length === 1) {
        state.activeRole = rolesArray[0];
        if (globalThis.window !== undefined) localStorage.setItem('activeRole', state.activeRole);
      }

      if (globalThis.window !== undefined) {
        state.hospitalTimezone = localStorage.getItem('hospitalTimezone');
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
    setHospitalTimezone: (state, action: PayloadAction<string | null>) => {
      state.hospitalTimezone = action.payload;
      if (globalThis.window !== undefined) {
        if (action.payload) localStorage.setItem('hospitalTimezone', action.payload);
        else localStorage.removeItem('hospitalTimezone');
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
      state.hospitalTimezone = null;
      if (globalThis.window !== undefined) {
        localStorage.removeItem('activeRole');
        localStorage.removeItem('isSuperMode');
        localStorage.removeItem('currentHospitalId');
        localStorage.removeItem('hospitalTimezone');
        localStorage.removeItem('token');
      }
    },
    clearAuthSession: (state) => {
      state.activeRole = null;
      state.hospitalTimezone = null;
      if (globalThis.window !== undefined) {
        localStorage.removeItem('activeRole');
        localStorage.removeItem('currentHospitalId');
        localStorage.removeItem('hospitalTimezone');
      }
    },
  },
});

export const { hydrateAuth, setUser, setLoading, setError, logout, setSuperMode, setActiveRole, setCurrentHospitalId, setHospitalTimezone, clearAuthSession } = authSlice.actions;

export const authReducer: Reducer<AuthState, AuthAction> = authSlice.reducer as Reducer<AuthState, AuthAction>;
export default authReducer;
