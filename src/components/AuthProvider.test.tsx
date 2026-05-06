import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider } from './AuthProvider';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/state/authSlice';
import { authService } from '@/services/authService';
import { usePathname } from 'next/navigation';

// Mock services and navigation
vi.mock('@/services/authService');

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: vi.fn(),
}));

// Mock window.location
const mockLocation = { href: '' };
vi.stubGlobal('location', mockLocation);

const mockUser = {
  id: 'user-1',
  username: 'doctor_user',
  roles: ['DOCTOR'],
  memberships: [
    { hospitalId: 'h1', hospitalName: 'Hosp 1', hospitalCode: 'H1', roleAssignments: [{ roleCode: 'DOCTOR', active: true }] }
  ],
  currentHospitalId: 'h1'
};

const renderWithRedux = (children: React.ReactNode, initialState = {}) => {
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState: { 
      auth: { 
        user: null, 
        isAuthenticated: false, 
        isLoading: true, 
        activeRole: null, 
        error: null, 
        isSuperMode: false, 
        ...initialState 
      } as any
    },
  });
  return render(<Provider store={store}>{children}</Provider>);
};

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.href = '';
    mockPush.mockClear();
  });

  it('shows loader while fetching user', () => {
    (authService.me as any).mockReturnValue(new Promise(() => {})); // Never resolves
    renderWithRedux(<AuthProvider>Children</AuthProvider>);
    expect(screen.getByTestId('loader')).toBeInTheDocument();
  });

  it('renders children if not authenticated and on public page', () => {
    (authService.me as any).mockResolvedValue({ success: false });
    (usePathname as any).mockReturnValue('/login');
    
    renderWithRedux(<AuthProvider>Children</AuthProvider>, { isLoading: false });
    
    waitFor(() => {
      expect(screen.getByText('Children')).toBeInTheDocument();
    });
  });

  it('redirects to dashboard if authenticated and on login page', async () => {
    (authService.me as any).mockResolvedValue({ success: true, data: mockUser });
    (usePathname as any).mockReturnValue('/login');
    
    renderWithRedux(<AuthProvider>Children</AuthProvider>, { 
      user: mockUser, 
      isAuthenticated: true, 
      isLoading: false, 
      activeRole: 'DOCTOR' 
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/doctor/dashboard');
    });
  });
});
