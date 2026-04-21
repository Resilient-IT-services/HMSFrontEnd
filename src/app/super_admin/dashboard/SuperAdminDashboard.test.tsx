import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SuperAdminDashboard from './page';
import apiClient from '@/services/apiClient';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/state/authSlice';

vi.mock('@/services/apiClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

// Mock MainLayout to avoid complexity
vi.mock('@/components/ui/MainLayout', () => ({
  default: ({ children, title }: any) => (
    <div data-testid="main-layout">
      <h1>{title}</h1>
      {children}
    </div>
  )
}));

const createMockStore = () => configureStore({ reducer: { auth: authReducer } });

describe('SuperAdminDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders stats and welcome message', async () => {
    (apiClient.get as any).mockImplementation((url: string) => {
      if (url === '/hospitals') {
        return Promise.resolve({ data: { success: true, data: [{ id: 1, name: 'Hospital A', code: 'HA' }] } });
      }
      if (url === '/users') {
        return Promise.resolve({ data: { success: true, data: [{ id: 1, username: 'user1' }] } });
      }
      return Promise.reject(new Error('not found'));
    });

    render(
      <Provider store={createMockStore()}>
        <SuperAdminDashboard />
      </Provider>
    );

    expect(screen.getByText('System Administration')).toBeInTheDocument();
    expect(screen.getByText('Welcome, Super Administrator')).toBeInTheDocument();
    
    await waitFor(() => {
      // Check for stats counts
      // Since '1' might appear twice (one for hospital, one for user), we use getAllByText
      const countElements = screen.getAllByText('1');
      expect(countElements.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('renders navigation links', () => {
    render(
      <Provider store={createMockStore()}>
        <SuperAdminDashboard />
      </Provider>
    );

    expect(screen.getByText('Manage Hospitals')).toHaveAttribute('href', '/super_admin/hospitals');
    expect(screen.getByText('Manage Users')).toHaveAttribute('href', '/admin/users');
  });
});
