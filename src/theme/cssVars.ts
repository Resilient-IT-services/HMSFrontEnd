'use client';

export const applyTheme = (theme: Record<string, string>) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  for (const [key, value] of Object.entries(theme)) {
    // Convert camelCase to kebab-case for CSS variables
    const cssKey = key.replaceAll(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
    root.style.setProperty(`--${cssKey}`, value);
  }
};
