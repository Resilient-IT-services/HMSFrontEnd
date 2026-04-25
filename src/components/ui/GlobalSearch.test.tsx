import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import GlobalSearch from './GlobalSearch';
import { searchService } from '@/services/searchService';
import { useRouter } from 'next/navigation';

// Mock navigation and services
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
}));

vi.mock('@/services/searchService', () => ({
  searchService: {
    search: vi.fn(),
  },
}));

describe('GlobalSearch', () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue({ push: mockPush });
  });

  it('triggers search after debounce when typing', async () => {
    (searchService.search as any).mockResolvedValue({
      success: true,
      data: {
        content: [
          { id: '1', type: 'HOSPITAL', title: 'Test Hospital', subtitle: 'H1', link: '/hospitals/1' }
        ]
      }
    });

    render(<GlobalSearch />);
    const input = screen.getByPlaceholderText(/Search Hospitals/i);
    fireEvent.change(input, { target: { value: 'Test' } });

    await waitFor(() => {
      expect(screen.getByText('Test Hospital')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('navigates to link when clicking a result', async () => {
    (searchService.search as any).mockResolvedValue({
      success: true,
      data: {
        content: [
          { id: '1', type: 'USER', title: 'John Doe', subtitle: 'Doctor', link: '/users/1' }
        ]
      }
    });

    render(<GlobalSearch />);
    const input = screen.getByPlaceholderText(/Search Hospitals/i);
    fireEvent.change(input, { target: { value: 'John' } });

    const result = await screen.findByText('John Doe');
    fireEvent.click(result);

    expect(mockPush).toHaveBeenCalledWith('/users/1');
  });
});
