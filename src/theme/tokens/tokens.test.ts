import { describe, it, expect } from 'vitest';
import { radius } from './radius';
import { shadows } from './shadows';
import { spacing } from './spacing';
import { typography } from './typography';

describe('Theme Tokens', () => {
  it('radius tokens are defined', () => {
    expect(radius).toBeDefined();
    expect(radius.md).toBeDefined();
  });

  it('shadows tokens are defined', () => {
    expect(shadows).toBeDefined();
    expect(shadows.md).toBeDefined();
  });

  it('spacing tokens are defined', () => {
    expect(spacing).toBeDefined();
    expect(spacing.md).toBeDefined();
  });

  it('typography tokens are defined', () => {
    expect(typography).toBeDefined();
    expect(typography.sizes.md).toBeDefined();
  });
});
