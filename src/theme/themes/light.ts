import { colorTokens, spacing, radius, shadows, typography } from '../tokens';

export const lightTheme = {
  ...colorTokens,
  ...spacing,
  ...radius,
  ...shadows,
  // Flat typography if needed, but usually we handle it in CSS
};
