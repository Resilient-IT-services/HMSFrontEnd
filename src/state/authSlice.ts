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

      // Compute effective roles for the current hospital context
      const effectiveRolesSet = new Set<Role>();
      action.payload.hospitals.forEach(h => {
        if (h.hospitalId === null || h.hospitalId === action.payload?.hospitalId) {
          h.roles.forEach(r => effectiveRolesSet.add(r));
        }
      });
      const rolesArray = Array.from(effectiveRolesSet);

      // Attach roles to the user object for convenience in components
      state.user = {
        ...action.payload,
        roles: rolesArray
      };
      
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;

      // If user is not super admin, force super mode off
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
      
      // Auto-set active role if only one exists
      if (rolesArray.length === 1 && !state.activeRole) {
        state.activeRole = rolesArray[0];
        if (globalThis.window !== undefined) localStorage.setItem('activeRole', state.activeRole);
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
      if (globalThis.window !== undefined) {
        localStorage.removeItem('activeRole');
        localStorage.removeItem('isSuperMode');
      }
    },
  },
});

export const { setUser, setLoading, setError, logout, setSuperMode, setActiveRole } = authSlice.actions;
export default authSlice.reducer;
