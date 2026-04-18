import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import HomePage from './page';
import { redirect } from 'next/navigation';

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

describe('HomePage', () => {
  it('redirects to login', () => {
    render(<HomePage />);
    expect(redirect).toHaveBeenCalledWith('/login');
  });
});
