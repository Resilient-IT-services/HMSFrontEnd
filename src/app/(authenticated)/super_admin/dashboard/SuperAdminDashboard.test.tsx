import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SuperAdminDashboard from './page';
import { hospitalService } from '@/services/hospitalService';
import { userService } from '@/services/userService';

// Mock services
vi.mock('@/services/hospitalService', () => ({
  hospitalService: {
    list: vi.fn(),
  },
}));

vi.mock('@/services/userService', () => ({
  userService: {
    listUsers: vi.fn(),
  },
}));

// Mock MainLayout
vi.mock('@/components/ui/MainLayout', () => ({
  __esModule: true,
  default: ({ children, title }: { children: React.ReactNode, title: string }) => (
    <div data-testid="main-layout">
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));

describe('SuperAdminDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders stats and welcome message', async () => {
    vi.mocked(hospitalService.list).mockResolvedValue({
      success: true,
      data: { totalElements: 5, content: Array.from({length: 5}).fill({}) }
    } as any);
    
    vi.mocked(userService.listUsers).mockResolvedValue({
      success: true,
      data: { totalElements: 10, content: Array.from({length: 10}).fill({}) }
    } as any);

    render(<SuperAdminDashboard />);

    await waitFor(() => {
      expect(screen.getByTestId('hospitals-count')).toHaveTextContent('5');
      expect(screen.getByTestId('users-count')).toHaveTextContent('10');
      expect(screen.getByText(/Welcome, Super Administrator/i)).toBeInTheDocument();
    });
  });
});
