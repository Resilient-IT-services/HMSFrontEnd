import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LoginPage from './page';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/state/authSlice';
import { authService } from '@/services/authService';
import { useRouter } from 'next/navigation';

vi.mock('@/services/authService');
vi.mock('next/navigation');

const createMockStore = () => {
  return configureStore({
    reducer: {
      auth: authReducer,
    },
  });
};

describe('LoginPage', () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue({ push: mockPush });
  });

  it('renders login form', () => {
    render(
      <Provider store={createMockStore()}>
        <LoginPage />
      </Provider>
    );
    
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('handles successful login', async () => {
    (authService.login as any).mockResolvedValue({ success: true });
    (authService.me as any).mockResolvedValue({ 
      success: true, 
      data: { userId: 1, roles: ['DOCTOR'], hospitals: [{ hospitalId: 101 }] } 
    });

    render(
      <Provider store={createMockStore()}>
        <LoginPage />
      </Provider>
    );

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith('testuser', 'password123');
      expect(authService.me).toHaveBeenCalled();
    });
  });

  it('shows error on failed login', async () => {
    (authService.login as any).mockResolvedValue({ 
      success: false, 
      error: { message: 'Invalid credentials' } 
    });

    render(
      <Provider store={createMockStore()}>
        <LoginPage />
      </Provider>
    );

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'wronguser' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });
});
