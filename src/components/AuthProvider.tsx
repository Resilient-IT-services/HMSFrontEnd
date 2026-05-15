'use client';

import React, { useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/state/store';
import { hydrateAuth, setUser, setLoading, setActiveRole, setSuperMode, setCurrentHospitalId } from '@/state/authSlice';
import { authService } from '@/services/authService';
import { usePathname, useRouter } from 'next/navigation';
import { Role } from '@/types/api';

const PUBLIC_ROUTES = new Set(['/login', '/privacy', '/terms', '/forgot-password']);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, isSuperMode, activeRole } = useSelector((state: RootState) => state.auth);
  const checkInProgress = useRef(false);

  // 1. Initial hydration on mount
  useEffect(() => {
    dispatch(hydrateAuth());
  }, [dispatch]);

  // 2. Fetch user profile if missing
  useEffect(() => {
    const checkAuth = async () => {
      if (checkInProgress.current) return;
      
      try {
        checkInProgress.current = true;
        dispatch(setLoading(true));
        const response = await authService.me();

        if (response.success && response.data) {
          dispatch(setUser(response.data));
        } else {
          dispatch(setUser(null));
        }
      } catch {
        dispatch(setUser(null));
      } finally {
        dispatch(setLoading(false));
        checkInProgress.current = false;
      }
    };

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    if (isAuthenticated) {
      if (isLoading) dispatch(setLoading(false));
      return;
    }

    // On public routes, only check auth if we have a token
    if (PUBLIC_ROUTES.has(pathname)) {
      if (token) {
        checkAuth();
      } else {
        if (isLoading) dispatch(setLoading(false));
      }
      return;
    }

    // On private routes, always attempt to check auth
    checkAuth();
  }, [dispatch, isAuthenticated, pathname]);

  const handleUnauthenticated = useCallback(() => {
    if (!PUBLIC_ROUTES.has(pathname)) {
      router.push('/login');
    }
  }, [pathname, router]);

  const handleSuperUserFlow = useCallback((roles: string[]) => {
    const isSuperUser = roles.includes('SUPER_ADMIN');
    if (!isSuperUser) return false;

    if (!isSuperMode) {
      dispatch(setSuperMode(true));
      return true;
    }

    if (pathname === '/login' || pathname === '/' || pathname === '/select-role' || pathname === '/select-hospital') {
      router.push('/super_admin/dashboard');
      return true;
    }
    return false;
  }, [dispatch, isSuperMode, pathname, router]);

  const handleHospitalSelection = useCallback((roles: string[]) => {
    if (user?.memberships && user.memberships.length > 1) {
      if (pathname !== '/select-hospital') {
        router.push('/select-hospital');
      }
    } else if (user?.memberships && user.memberships.length === 1) {
      const targetHospitalId = user.memberships[0].hospitalId;

      if (user.currentHospitalId === targetHospitalId) {
        return;
      }

      dispatch(setCurrentHospitalId(targetHospitalId));

    } else if (roles.includes('SUPER_ADMIN')) {
      // Super admins don't necessarily need a hospitalId
      dispatch(setSuperMode(true));
    } else if (pathname !== '/unauthorized') {
      router.push('/unauthorized');
    }
  }, [dispatch, pathname, router, user]);

  const handleRoleSelection = useCallback((roles: string[]) => {
    if (roles.length > 1) {
      if (pathname !== '/select-role') {
        router.push('/select-role');
      }
    } else if (roles.length === 1) {
      if (activeRole === roles[0]) return;
      dispatch(setActiveRole(roles[0] as Role));
    } else if (pathname !== '/unauthorized') {
      router.push('/unauthorized');
    }
  }, [activeRole, dispatch, pathname, router]);

  const handleAuthenticatedRedirect = useCallback(() => {
    if (pathname === '/login' || pathname === '/select-hospital' || pathname === '/select-role') {
      const rolePathMap: Record<string, string> = {
        'RECEPTIONIST': 'reception',
        'DOCTOR': 'doctor',
        'PHARMACIST': 'pharmacy',
        'ADMIN': 'admin',
        'SUPER_ADMIN': 'super_admin',
        'NURSE': 'nurse'
      };

      const path = rolePathMap[activeRole!] || activeRole!.toLowerCase();
      const targetPath = `/${path}/dashboard`;
      
      if (pathname !== targetPath) {
        router.push(targetPath);
      }
    }
  }, [activeRole, pathname, router]);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      if (!PUBLIC_ROUTES.has(pathname)) {
        handleUnauthenticated();
      }
      return;
    }

    const roles = user?.roles || [];
    const isSuperUser = roles.includes('SUPER_ADMIN');

    if (isSuperUser && handleSuperUserFlow(roles)) return;

    if (isSuperMode) return;

    if (!user?.currentHospitalId) {
      handleHospitalSelection(roles);
      return;
    }

    if (!activeRole) {
      handleRoleSelection(roles);
      return;
    }

    handleAuthenticatedRedirect();
  }, [
    isLoading,
    isAuthenticated,
    user,
    activeRole,
    isSuperMode,
    handleUnauthenticated,
    handleSuperUserFlow,
    handleHospitalSelection,
    handleRoleSelection,
    handleAuthenticatedRedirect,
    pathname
  ]);

  if (isLoading) {
    return (
        <div className="flex items-center justify-center h-screen bg-[var(--background)]">
          <div data-testid="loader" className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)]"></div>
        </div>
    );
  }

  return <>{children}</>;
};
