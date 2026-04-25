import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider } from './AuthProvider';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/state/authSlice';
import { authService } from '@/services/authService';
import { useRouter, usePathname } from 'next/navigation';

vi.mock('@/services/authService');
vi.mock('next/navigation');

const createMockStore = (initialState?: any) => {
  return configureStore({
    reducer: {
      auth: authReducer,
    },
    preloadedState: {
      auth: initialState,
    },
  });
};

describe('AuthProvider', () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue({ push: mockPush });
  });

  it('shows loader while loading', async () => {
    (authService.me as any).mockReturnValue(new Promise(() => {})); // Never resolves
    (usePathname as any).mockReturnValue('/dashboard');
    
    const store = createMockStore({ isLoading: true });
    render(
      <Provider store={store}>
        <AuthProvider>
          <div>Children</div>
        </AuthProvider>
      </Provider>
    );
    
    expect(screen.getByTestId('loader')).toBeInTheDocument();
  });

  it('redirects to login if not authenticated', async () => {
    (authService.me as any).mockResolvedValue({ success: false });
    (usePathname as any).mockReturnValue('/dashboard');

    const store = createMockStore({ isAuthenticated: false, isLoading: false });
    render(
      <Provider store={store}>
        <AuthProvider>
          <div>Children</div>
        </AuthProvider>
      </Provider>
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  it('redirects to dashboard if authenticated and on login page', async () => {
    const mockUser = {
      id: "user-1",
      userId: 1,
      username: 'doctor1',
      currentHospitalId: "101",
      roles: ['DOCTOR'],
      memberships: [{ hospitalId: "101", roles: ['DOCTOR'] }]
    };
    (authService.me as any).mockResolvedValue({ success: true, data: mockUser });
    (usePathname as any).mockReturnValue('/login');

    const store = createMockStore({ 
      isAuthenticated: true, 
      isLoading: false, 
      user: { ...mockUser, roles: ['DOCTOR'] },
      activeRole: 'DOCTOR' 
    });
    
    render(
      <Provider store={store}>
        <AuthProvider>
          <div>Children</div>
        </AuthProvider>
      </Provider>
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/doctor/dashboard');
    });
  });
});
