import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SuperAdminDashboard from './page';
import { adminService } from '@/services/adminService';
import { hospitalService } from '@/services/hospitalService';

// Mock services
vi.mock('@/services/adminService', () => ({
  adminService: {
    getAdminStats: vi.fn(),
  },
}));

vi.mock('@/services/hospitalService', () => ({
  hospitalService: {
    list: vi.fn(),
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
    vi.mocked(adminService.getAdminStats).mockResolvedValue({
      success: true,
      data: {
        totalHospitals: 5,
        totalUsers: 10,
        activeUsers: 2,
        totalDoctors: 3
      }
    } as any);

    vi.mocked(hospitalService.list).mockResolvedValue({
      success: true,
      data: { 
        totalElements: 5, 
        content: Array.from({length: 5}).fill({
          id: '1',
          name: 'Hospital 1',
          code: 'H1',
          status: 'ACTIVE',
          createdAt: new Date().toISOString()
        }) 
      }
    } as any);

    render(<SuperAdminDashboard />);

    await waitFor(() => {
      // Metric values are displayed in multiple places (desktop and mobile grids)
      // We check for presence of at least one instance of each key stat
      expect(screen.getAllByText('05').length).toBeGreaterThan(0);
      expect(screen.getAllByText('10').length).toBeGreaterThan(0);
      
      // Check for Admin Overview in the MainLayout mock
      const mainLayout = screen.getByTestId('main-layout');
      expect(mainLayout.querySelector('h1')).toHaveTextContent('Admin Overview');
    });
  });
});
