import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SelectRolePage from './page';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/state/authSlice';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

const mockUser = {
  id: 'user-1',
  fullName: 'Test User',
  roles: ['DOCTOR', 'ADMIN'],
  memberships: [
    { hospitalId: '1', hospitalName: 'Hospital One', hospitalCode: 'H1', roleAssignments: [] }
  ],
};

const renderWithRedux = (initialState = {}) => {
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState: { 
      auth: { 
        user: mockUser, 
        isAuthenticated: true, 
        isLoading: false, 
        error: null, 
        isSuperMode: false, 
        activeRole: null, 
        ...initialState 
      } as any 
    },
  });
  return render(
    <Provider store={store}>
      <SelectRolePage />
    </Provider>
  );
};

describe('SelectRolePage', () => {
  it('renders and allows selection of common roles', () => {
    renderWithRedux();
    
    expect(screen.getByText('Doctor')).toBeInTheDocument();
    expect(screen.getByText('Administrator')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('Doctor'));
  });

  it('renders and allows selection of LAB_ADMIN role', () => {
    renderWithRedux({
      user: { ...mockUser, roles: ['LAB_ADMIN'] }
    });
    
    expect(screen.getByText('Lab Admin')).toBeInTheDocument();
    expect(screen.getByText('Laboratory tests, sample analysis, and diagnostic reporting.')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('Lab Admin'));
  });

  it('renders and allows selection of SUPER_ADMIN role', () => {
    renderWithRedux({
      user: { ...mockUser, roles: ['SUPER_ADMIN'] }
    });
    
    expect(screen.getByText('Super Admin')).toBeInTheDocument();
    expect(screen.getByText('System-wide configuration, multi-facility oversight, and security.')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('Super Admin'));
  });
});
