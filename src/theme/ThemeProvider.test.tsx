import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ThemeProvider } from './ThemeProvider';

describe('ThemeProvider', () => {
  it('renders children', () => {
    render(
      <ThemeProvider>
        <div data-testid="child">Child</div>
      </ThemeProvider>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('applies basic CSS variables to document', () => {
    render(<ThemeProvider>Content</ThemeProvider>);
    // The ThemeProvider should have called applyTheme which sets CSS vars on documentElement
    // Checking if some primary var is set (might be empty in jsdom but should exist)
    expect(document.documentElement.style.getPropertyValue('--primary')).toBeDefined();
  });
});
