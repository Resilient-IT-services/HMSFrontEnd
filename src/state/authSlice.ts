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
  if (typeof window !== 'undefined') {
    return localStorage.getItem('isSuperMode') === 'true';
  }
  return false;
};

const getInitialActiveRole = () => {
  if (typeof window !== 'undefined') {
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
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
      state.isLoading = false;
      state.error = null;
      
      // If user is not super admin, force super mode off
      const isSuperUser = action.payload?.roles.includes('SUPER_ADMIN');
      if (!isSuperUser) {
        state.isSuperMode = false;
        if (typeof window !== 'undefined') localStorage.removeItem('isSuperMode');
      }

      // If active role is not in current roles, reset it
      if (state.activeRole && action.payload && !action.payload.roles.includes(state.activeRole)) {
        state.activeRole = null;
        if (typeof window !== 'undefined') localStorage.removeItem('activeRole');
      }
      
      // Auto-set active role if only one exists
      if (action.payload && action.payload.roles.length === 1 && !state.activeRole) {
        state.activeRole = action.payload.roles[0];
        if (typeof window !== 'undefined') localStorage.setItem('activeRole', state.activeRole);
      }
    },
    setSuperMode: (state, action: PayloadAction<boolean>) => {
      state.isSuperMode = action.payload;
      if (typeof window !== 'undefined') {
        localStorage.setItem('isSuperMode', String(action.payload));
      }
    },
    setActiveRole: (state, action: PayloadAction<Role | null>) => {
      state.activeRole = action.payload;
      if (typeof window !== 'undefined') {
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
      if (typeof window !== 'undefined') {
        localStorage.removeItem('activeRole');
        localStorage.removeItem('isSuperMode');
      }
    },
  },
});

export const { setUser, setLoading, setError, logout, setSuperMode, setActiveRole } = authSlice.actions;
export default authSlice.reducer;
