import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import GlobalSearch from './GlobalSearch';
import { searchService } from '@/services/searchService';

// Mock searchService
vi.mock('@/services/searchService', () => ({
  searchService: {
    search: vi.fn(),
  },
}));

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('GlobalSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly', () => {
    render(<GlobalSearch />);
    expect(screen.getByPlaceholderText(/Search Hospitals, Users, Patients/i)).toBeInTheDocument();
  });

  it('triggers search after debounce when typing', async () => {
    const mockResults = [
        { id: '1', type: 'HOSPITAL', title: 'Test Hospital', subtitle: 'TEST', link: '/hospitals/1' }
    ];
    (searchService.search as any).mockResolvedValue({
      success: true,
      data: mockResults
    });

    render(<GlobalSearch />);
    const input = screen.getByPlaceholderText(/Search Hospitals, Users, Patients/i);
    
    fireEvent.change(input, { target: { value: 'Test' } });

    // Wait for debounce and search result
    await waitFor(() => {
      expect(searchService.search).toHaveBeenCalledWith('Test');
    }, { timeout: 3000 });

    await waitFor(() => {
      expect(screen.getByText('Test Hospital')).toBeInTheDocument();
    });
  });

  it('navigates to link when clicking a result', async () => {
    (searchService.search as any).mockResolvedValue({
      success: true,
      data: [
        { id: '1', type: 'PATIENT', title: 'John Doe', subtitle: '123456', link: '/patients/1' }
      ]
    });

    render(<GlobalSearch />);
    const input = screen.getByPlaceholderText(/Search Hospitals, Users, Patients/i);
    
    fireEvent.change(input, { target: { value: 'John' } });

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('John Doe'));

    expect(mockPush).toHaveBeenCalledWith('/patients/1');
  });
});
