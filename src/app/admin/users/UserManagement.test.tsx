import { render, screen, waitFor } from '@testing-library/react';
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
  default: ({ children }: any) => <div data-testid="main-layout">{children}</div>
}));

const createMockStore = () => configureStore({ 
  reducer: { auth: authReducer },
  preloadedState: { auth: { user: { hospital_id: 1 } } as any }
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
});
