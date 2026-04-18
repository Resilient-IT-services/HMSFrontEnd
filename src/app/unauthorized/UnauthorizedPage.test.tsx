import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import UnauthorizedPage from './page';

describe('UnauthorizedPage', () => {
  it('renders correctly', () => {
    render(<UnauthorizedPage />);
    expect(screen.getByText(/Unauthorized Access/i)).toBeInTheDocument();
  });
});
