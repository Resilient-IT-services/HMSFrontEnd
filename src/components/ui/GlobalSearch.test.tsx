import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import GlobalSearch from './GlobalSearch';
import { searchService } from '@/services/searchService';
import { useRouter } from 'next/navigation';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
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

  it('does not trigger search on mount when query is empty', async () => {
    render(<GlobalSearch />);
    
    // Wait a bit to ensure debounce timeout would have fired
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    expect(searchService.search).not.toHaveBeenCalled();
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
    
    expect(searchService.search).toHaveBeenCalledWith('Test');
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
