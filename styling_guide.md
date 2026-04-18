# 🎨 HMS Frontend – Styling Guide (Theme System)

## 📌 Purpose
This document defines a **strict, centralized, and flexible styling system** for the HMS Next.js frontend.

Goal: enable **complete UI re-theming** (colors, typography, spacing) **without changing component code**.

---

# 🚨 NON-NEGOTIABLE RULES

- ❌ No hardcoded colors (hex/rgb/named) in components
- ❌ No inline styles for colors/spacing/typography
- ❌ No Tailwind color utilities (e.g., `bg-blue-500`, `text-gray-700`)
- ❌ No component-specific color definitions

- ✅ Use **design tokens only**
- ✅ Use **CSS variables** as the runtime source of truth
- ✅ All components must be **theme-agnostic**

---

# 🧱 ARCHITECTURE

## 📁 Folder Structure

```
src/
 ├── theme/
 │    ├── tokens/
 │    │    ├── colors.ts
 │    │    ├── spacing.ts
 │    │    ├── typography.ts
 │    │    ├── radius.ts
 │    │    ├── shadows.ts
 │    │    └── index.ts
 │    ├── themes/
 │    │    ├── light.ts
 │    │    ├── dark.ts
 │    │    └── index.ts
 │    ├── cssVars.ts
 │    └── ThemeProvider.tsx
 │
 ├── styles/
 │    ├── globals.css
 │    └── variables.css
```

---

# 🎨 DESIGN TOKENS

## Colors (tokens/colors.ts)

```ts
export const colorTokens = {
  primary: '#1E3A8A',
  primaryHover: '#1D4ED8',

  background: '#F8FAFC',
  surface: '#FFFFFF',

  textPrimary: '#111827',
  textSecondary: '#6B7280',

  border: '#E5E7EB',

  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
}
```

## Spacing (tokens/spacing.ts)

```ts
export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  xxl: '32px',
}
```

## Typography (tokens/typography.ts)

```ts
export const typography = {
  fontFamily: 'Inter, sans-serif',

  sizes: {
    sm: '12px',
    md: '14px',
    lg: '16px',
    xl: '20px',
    xxl: '24px',
  },

  weights: {
    normal: 400,
    medium: 500,
    bold: 600,
  },
}
```

## Radius & Shadows

```ts
export const radius = {
  sm: '6px',
  md: '8px',
  lg: '12px',
}

export const shadows = {
  sm: '0 1px 2px rgba(0,0,0,0.05)',
  md: '0 4px 6px rgba(0,0,0,0.1)',
}
```

---

# 🌈 THEMES

## Light Theme (themes/light.ts)

```ts
import { colorTokens } from '../tokens/colors'

export const lightTheme = {
  ...colorTokens,
}
```

## Dark Theme (themes/dark.ts)

```ts
export const darkTheme = {
  primary: '#3B82F6',
  background: '#111827',
  surface: '#1F2933',
  textPrimary: '#F9FAFB',
  textSecondary: '#9CA3AF',
}
```

---

# 🔄 CSS VARIABLES (RUNTIME LAYER)

## variables.css

```css
:root {
  --color-primary: #1E3A8A;
  --color-bg: #F8FAFC;
  --color-surface: #FFFFFF;

  --text-primary: #111827;
  --text-secondary: #6B7280;

  --border: #E5E7EB;
}
```

---

# 🔧 APPLYING THEME

## cssVars.ts

```ts
export const applyTheme = (theme: Record<string, string>) => {
  const root = document.documentElement

  Object.entries(theme).forEach(([key, value]) => {
    root.style.setProperty(`--${key}`, value)
  })
}
```

---

# 🧩 COMPONENT USAGE RULES

## ❌ WRONG

```tsx
<div style={{ background: '#fff' }} />
```

```tsx
<div className="bg-blue-500 text-white" />
```

---

## ✅ CORRECT

```tsx
<div className="card" />
```

```css
.card {
  background: var(--color-surface);
  color: var(--text-primary);
  padding: var(--spacing-lg);
  border-radius: var(--radius-md);
}
```

---

# 🧱 BASE COMPONENT STYLING CONTRACT

All UI components MUST:

- Use CSS variables
- Be theme-independent
- Avoid inline styling

---

# 🔄 THEME SWITCH SUPPORT (FUTURE READY)

System must support:

- Light / Dark mode
- Hospital-specific branding
- Runtime theme switching

---

# 🎯 TAILWIND (IF USED)

If Tailwind is used:

- Extend config with CSS variables
- DO NOT use default color palette

Example:

```js
colors: {
  primary: 'var(--color-primary)',
}
```

---

# 🧪 TESTING STYLING

- Verify components render with correct variables
- Snapshot tests for theme changes

---

# ⚠️ FAILURE CONDITIONS

Your implementation is WRONG if:

- Any color is hardcoded
- Components break when theme changes
- UI is not consistent across screens

---

# 🧠 FINAL DIRECTIVE

> Styling must be controlled from ONE place.

Components are consumers.
Theme is the authority.
