'use client';

export const applyTheme = (theme: Record<string, string>) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  Object.entries(theme).forEach(([key, value]) => {
    // Convert camelCase to kebab-case for CSS variables
    const cssKey = key.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
    root.style.setProperty(`--${cssKey}`, value);
  });
};
