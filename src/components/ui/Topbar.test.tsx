import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Topbar from './Topbar';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/state/authSlice';
import { authService } from '@/services/authService';

vi.mock('@/services/authService');

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
    hospitalId: 101,
    roles: ['DOCTOR', 'ADMIN'],
    hospitals: [
      { hospitalId: 101, hospitalName: 'City Clinic', hospitalCode: 'CC', roles: ['DOCTOR'] },
      { hospitalId: 102, hospitalName: 'Metro Hospital', hospitalCode: 'MH', roles: ['ADMIN'] }
    ]
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders title and username', () => {
    const store = createMockStore({ user: mockUser, activeRole: 'DOCTOR' });
    render(
      <Provider store={store}>
        <Topbar title="Dashboard" />
      </Provider>
    );
    
    expect(screen.getByText('john_doe')).toBeInTheDocument();
    expect(screen.getByText('DOCTOR')).toBeInTheDocument();
  });

  it('opens profile dropdown on click', () => {
    const store = createMockStore({ user: mockUser, activeRole: 'DOCTOR' });
    render(
      <Provider store={store}>
        <Topbar title="Dashboard" />
      </Provider>
    );
    
    fireEvent.click(screen.getByText('john_doe'));
    expect(screen.getByText('Available Roles')).toBeInTheDocument();
    expect(screen.getByText('Switch Hospital')).toBeInTheDocument();
  });

  it('handles hospital switch', async () => {
    const store = createMockStore({ user: mockUser, activeRole: 'DOCTOR' });
    (authService.selectHospital as any).mockResolvedValue({ success: true, data: { ...mockUser, hospitalId: 102 } });

    render(
      <Provider store={store}>
        <Topbar title="Dashboard" />
      </Provider>
    );
    
    fireEvent.click(screen.getByText('john_doe'));
    fireEvent.click(screen.getByText('Metro Hospital'));
    
    expect(authService.selectHospital).toHaveBeenCalledWith(102);
  });
});
