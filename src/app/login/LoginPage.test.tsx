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

  it('toggles password visibility', () => {
    render(
      <Provider store={createMockStore()}>
        <LoginPage />
      </Provider>
    );

    const passwordInput = screen.getByLabelText(/password/i);
    const toggleButton = screen.getByRole('button', { name: /visibility/i });

    expect(passwordInput).toHaveAttribute('type', 'password');
    
    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');

    fireEvent.click(screen.getByRole('button', { name: /visibility_off/i }));
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('opens and closes help desk modal', () => {
    render(
      <Provider store={createMockStore()}>
        <LoginPage />
      </Provider>
    );

    const helpButton = screen.getByRole('button', { name: /help desk/i });
    fireEvent.click(helpButton);
    
    expect(screen.getByText(/Support Center/i)).toBeInTheDocument();
    
    const closeButton = screen.getByText('✕');
    fireEvent.click(closeButton);
    
    expect(screen.queryByText(/Support Center/i)).not.toBeInTheDocument();
  });

  it('handles generic error in handleSubmit', async () => {
    (authService.login as any).mockRejectedValue({ 
      response: { data: { error: { message: 'Network error' } } } 
    });

    render(
      <Provider store={createMockStore()}>
        <LoginPage />
      </Provider>
    );

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'user' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'pass' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      // Assuming triggerGlobalToast was called or error state was set.
      // If it's a generic error handled by interceptor, the component might not show it directly.
      // But usually we show a fallback.
      expect(screen.getByText(/Invalid credentials|error/i)).toBeInTheDocument();
    });
  });
});
