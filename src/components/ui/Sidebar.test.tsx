import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Sidebar from './Sidebar';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/state/authSlice';
import { authService } from '@/services/authService';
import { usePathname } from 'next/navigation';
import { LayoutProvider } from '@/context/LayoutContext';

vi.mock('@/services/authService');
vi.mock('next/navigation');

const createMockStore = (initialState?: any) => {
  return configureStore({
    reducer: {
      auth: authReducer,
    },
    preloadedState: {
      auth: {
        user: null,
        isAuthenticated: false,
        isLoading: false,
        activeRole: null,
        isSuperMode: false,
        error: null,
        ...initialState
      },
    },
  });
};

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (usePathname as any).mockReturnValue('/dashboard');
  });

  it('renders menu items based on activeRole', () => {
    const store = createMockStore({ 
      activeRole: 'DOCTOR',
      user: { roles: ['DOCTOR'] } 
    });
    render(
      <Provider store={store}>
        <LayoutProvider>
          <Sidebar />
        </LayoutProvider>
      </Provider>
    );
    
    expect(screen.getAllByText('Dashboard')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Queue')[0]).toBeInTheDocument();
    expect(screen.getAllByText('History')[0]).toBeInTheDocument();
    expect(screen.queryByText('Token Queue')).not.toBeInTheDocument();
    expect(screen.queryByText('Patients')).not.toBeInTheDocument();
    expect(screen.queryByText('Doctors')).not.toBeInTheDocument();
    expect(screen.queryByText('Users')).not.toBeInTheDocument();
  });

  it('renders super admin items in super mode', () => {
    const store = createMockStore({ 
      isSuperMode: true,
      user: { roles: ['SUPER_ADMIN'] } 
    });
    render(
      <Provider store={store}>
        <LayoutProvider>
          <Sidebar />
        </LayoutProvider>
      </Provider>
    );
    
    expect(screen.getAllByText('Hospitals')[0]).toBeInTheDocument();
  });

  it('calls logout on click', async () => {
    const store = createMockStore({ activeRole: 'DOCTOR' });
    (authService.logout as any).mockResolvedValue({ success: true });

    render(
      <Provider store={store}>
        <LayoutProvider>
          <Sidebar />
        </LayoutProvider>
      </Provider>
    );
    
    fireEvent.click(screen.getAllByText('Logout')[0]);
    expect(authService.logout).toHaveBeenCalled();
  });
});
