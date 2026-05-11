import { colorTokens, spacing, radius, shadows } from '../tokens';

export const darkTheme = {
  ...colorTokens,
  ...spacing,
  ...radius,
  ...shadows,
  // Overrides for Dark Mode
  primary: '#ec5b13',
  background: '#221610',
  surface: '#2d1d15',
  textPrimary: '#f8fafc',
  textSecondary: '#94a3b8',
  primaryHover: '#f07436',
  border: '#3e2c23',
  success: '#34d399',
  error: '#f87171',
  warning: '#fbbf24',
  info: '#a78bfa',
};
