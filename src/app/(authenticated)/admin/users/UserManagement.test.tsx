import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import UserManagement from './page';
import { userService } from '@/services/userService';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/state/authSlice';
import { LayoutProvider } from '@/context/LayoutContext';

vi.mock('@/services/userService', () => ({
  userService: {
    listUsers: vi.fn(),
  },
}));

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: vi.fn(),
  }),
  usePathname: () => '/admin/users',
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
  preloadedState: { auth: { user: { hospitalId: "1" } } as any }
});

describe('UserManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders and fetches users', async () => {
    (userService.listUsers as any).mockResolvedValue({
      success: true,
      data: {
        content: [{ id: "1", username: 'user1', roles: ['DOCTOR'] }],
        totalElements: 1,
        totalPages: 1,
        size: 20,
        number: 0
      }
    });

    render(
      <Provider store={createMockStore()}>
        <LayoutProvider>
          <UserManagement />
        </LayoutProvider>
      </Provider>
    );

    expect(screen.getByPlaceholderText(/Search by name, email, or role.../i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('user1')).toBeInTheDocument();
    });
  });

  it('contains a button to create user page', async () => {
    (userService.listUsers as any).mockResolvedValue({
      success: true,
      data: { content: [], totalElements: 0 }
    });

    render(
      <Provider store={createMockStore()}>
        <LayoutProvider>
          <UserManagement />
        </LayoutProvider>
      </Provider>
    );

    const createBtn = screen.getByText(/Create User/i);
    expect(createBtn).toBeInTheDocument();
  });
});
