'use client';

import React, { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/state/store';
import { setUser, setLoading, setError, setActiveRole, setSuperMode } from '@/state/authSlice';
import { authService } from '@/services/authService';
import { usePathname, useRouter } from 'next/navigation';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, isSuperMode, activeRole } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        dispatch(setLoading(true));
        const response = await authService.me();
        if (response.success && response.data) {
          dispatch(setUser(response.data));
        } else {
          dispatch(setUser(null));
        }
      } catch {
        dispatch(setError('Failed to authenticate'));
        dispatch(setUser(null));
      }
    };

    checkAuth();
  }, [dispatch]);

  const handleUnauthenticated = useCallback(() => {
    if (pathname !== '/login') {
      router.push('/login');
    }
  }, [pathname, router]);

  const handleSuperUserFlow = useCallback((roles: string[]) => {
    if (roles.length === 1 && !isSuperMode) {
      dispatch(setSuperMode(true));
      return true;
    }

    if (isSuperMode) {
      // Only redirect to dashboard if we are at a "gate" page
      if (pathname === '/login' || pathname === '/' || pathname === '/select-role') {
        router.push('/super_admin/dashboard');
        return true;
      }
      // Allow navigation to other pages if we are already in super mode
      return false;
    }
    return false;
  }, [dispatch, isSuperMode, pathname, router]);

  const handleHospitalSelection = useCallback((roles: string[]) => {
    if (user?.hospitals && user.hospitals.length > 1) {
      if (pathname !== '/select-hospital') {
        router.push('/select-hospital');
      }
    } else if (user?.hospitals && user.hospitals.length === 1) {
      const targetHospitalId = user.hospitals[0].hospitalId;
      // Prevent loop if hospitalId is already what we want
      if (user.hospitalId === targetHospitalId) {
        // If we have a hospitalId (or it's intended null) but no activeRole, let role selection handle it
        return;
      }
      authService.selectHospital(targetHospitalId).then(res => {
        if (res.success && res.data) dispatch(setUser(res.data));
      });
    } else if (roles.includes('SUPER_ADMIN')) {
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
      dispatch(setActiveRole(roles[0] as any));
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
      router.push(`/${path}/dashboard`);
    }
  }, [activeRole, pathname, router]);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      handleUnauthenticated();
      return;
    }

    const roles = user?.roles || [];
    const isSuperUser = roles.includes('SUPER_ADMIN');

    if (isSuperUser && handleSuperUserFlow(roles)) return;
    
    // If we are in super mode, we don't need hospitalId or activeRole
    if (isSuperMode) return;

    if (!user?.hospitalId) {
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
    handleUnauthenticated,
    handleSuperUserFlow,
    handleHospitalSelection,
    handleRoleSelection,
    handleAuthenticatedRedirect
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
