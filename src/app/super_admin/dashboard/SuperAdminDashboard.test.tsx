import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
  default: ({ children }: any) => <div data-testid="main-layout">{children}</div>
}));

const createMockStore = () => configureStore({ reducer: { auth: authReducer } });

describe('SuperAdminDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders and fetches hospitals', async () => {
    (apiClient.get as any).mockResolvedValue({
      data: { success: true, data: [{ id: 1, name: 'Hospital A', code: 'HA' }] }
    });

    render(
      <Provider store={createMockStore()}>
        <SuperAdminDashboard />
      </Provider>
    );

    expect(screen.getAllByText('Registered Hospitals').length).toBeGreaterThan(0);
    await waitFor(() => {
      expect(screen.getByText('Hospital A')).toBeInTheDocument();
    });
  });

  it('switches to users tab', async () => {
    (apiClient.get as any).mockResolvedValue({
      data: { success: true, data: [] }
    });

    render(
      <Provider store={createMockStore()}>
        <SuperAdminDashboard />
      </Provider>
    );

    fireEvent.click(screen.getByText('Global User Directory'));
    
    await waitFor(() => {
      expect(screen.getByText('All System Users')).toBeInTheDocument();
    });
  });

  it('opens hospital creation modal', () => {
    render(
      <Provider store={createMockStore()}>
        <SuperAdminDashboard />
      </Provider>
    );

    fireEvent.click(screen.getByText('Register Hospital'));
    expect(screen.getByText('Register New Hospital')).toBeInTheDocument();
  });

  it('handles role toggle in user form', async () => {
    render(
      <Provider store={createMockStore()}>
        <SuperAdminDashboard />
      </Provider>
    );

    // Must switch to users tab first to see the button
    fireEvent.click(screen.getByText('Global User Directory'));
    
    await waitFor(() => {
      expect(screen.getByText('Create System User')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Create System User'));
    const doctorCheckbox = screen.getByLabelText('DOCTOR');
    fireEvent.click(doctorCheckbox);
    expect(doctorCheckbox).toBeChecked();
  });
});
