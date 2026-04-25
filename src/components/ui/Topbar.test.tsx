import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Topbar from './Topbar';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/state/authSlice';
import { authService } from '@/services/authService';
import { LayoutProvider } from '@/context/LayoutContext';

vi.mock('@/services/authService');
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

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

describe('Topbar', () => {
  const mockUser = {
    username: 'john_doe',
    currentHospitalId: "101",
    roles: ['DOCTOR', 'ADMIN'],
    memberships: [
      { hospitalId: "101", hospitalName: 'City Clinic', hospitalCode: 'CC', roles: ['DOCTOR'] },
      { hospitalId: "102", hospitalName: 'Metro Hospital', hospitalCode: 'MH', roles: ['ADMIN'] }
    ]
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders title and username', () => {
    const store = createMockStore({ user: mockUser, activeRole: 'DOCTOR' });
    render(
      <Provider store={store}>
        <LayoutProvider>
          <Topbar />
        </LayoutProvider>
      </Provider>
    );
    
    expect(screen.getByText('john_doe')).toBeInTheDocument();
  });

  it('opens profile dropdown on click', () => {
    const store = createMockStore({ user: mockUser, activeRole: 'DOCTOR' });
    render(
      <Provider store={store}>
        <LayoutProvider>
          <Topbar />
        </LayoutProvider>
      </Provider>
    );
    
    fireEvent.click(screen.getByRole('button', { name: /account_circle/i }));
    expect(screen.getByText('Available Roles')).toBeInTheDocument();
    expect(screen.getByText('Switch Hospital')).toBeInTheDocument();
  });

  it('handles hospital switch', async () => {
    const store = createMockStore({ user: mockUser, activeRole: 'DOCTOR', isAuthenticated: true });

    render(
      <Provider store={store}>
        <LayoutProvider>
          <Topbar />
        </LayoutProvider>
      </Provider>
    );
    
    fireEvent.click(screen.getByRole('button', { name: /account_circle/i }));
    fireEvent.click(screen.getByText('Metro Hospital'));
    
    expect(store.getState().auth.user?.currentHospitalId).toBe("102");
  });
});
