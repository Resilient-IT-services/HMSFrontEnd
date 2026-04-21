import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import UserManagement from './page';
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

vi.mock('@/components/ui/MainLayout', () => ({
  default: ({ children, title }: any) => (
    <div data-testid="main-layout">
      <h1>{title}</h1>
      {children}
    </div>
  )
}));

const createMockStore = () => configureStore({ 
  reducer: { auth: authReducer },
  preloadedState: { auth: { user: { hospitalId: 1 } } as any }
});

describe('UserManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders and fetches users', async () => {
    (apiClient.get as any).mockResolvedValue({
      data: { success: true, data: [{ id: 1, username: 'user1', roles: ['DOCTOR'] }] }
    });

    render(
      <Provider store={createMockStore()}>
        <UserManagement />
      </Provider>
    );

    expect(screen.getByPlaceholderText(/Search users.../i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('user1')).toBeInTheDocument();
    });
  });

  it('opens creation modal when clicking create button', async () => {
    (apiClient.get as any).mockResolvedValue({
      data: { success: true, data: [] }
    });

    render(
      <Provider store={createMockStore()}>
        <UserManagement />
      </Provider>
    );

    const createBtn = screen.getByText(/Create User/i);
    fireEvent.click(createBtn);
    expect(screen.getByText('Create New User')).toBeInTheDocument();
  });

  it('opens allocation modal when clicking allocate button', async () => {
    (apiClient.get as any).mockResolvedValue({
      data: { success: true, data: [{ id: 1, username: 'user1', roles: ['DOCTOR'], memberships: [] }] }
    });

    const store = configureStore({ 
      reducer: { auth: authReducer },
      preloadedState: { auth: { user: { hospitalId: 1 }, isSuperMode: true } as any }
    });

    render(
      <Provider store={store}>
        <UserManagement />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('user1')).toBeInTheDocument();
    });

    const allocateBtn = screen.getByText(/Allocate/i);
    fireEvent.click(allocateBtn);
    expect(screen.getByText(/Allocate Roles: user1/i)).toBeInTheDocument();
  });
});
