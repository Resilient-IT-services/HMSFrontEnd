import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'src/app/login/page.tsx',
        'src/app/select-hospital/page.tsx',
        'src/app/select-role/page.tsx',
        'src/app/(authenticated)/doctor/dashboard/page.tsx',
        'src/app/(authenticated)/pharmacy/dashboard/page.tsx',
        'src/app/(authenticated)/reception/appointments/page.tsx',
        'src/app/(authenticated)/reception/appointments/create/page.tsx',
        'src/app/(authenticated)/reception/dashboard/page.tsx',
        'src/app/(authenticated)/reception/patients/page.tsx',
        'src/app/(authenticated)/reception/queue/page.tsx',
        'src/app/(authenticated)/super_admin/dashboard/page.tsx',
        'src/app/(authenticated)/unauthorized/page.tsx',
        'src/components/reception/appointments/DoctorSelector.tsx',
        'src/components/reception/appointments/SessionGrid.tsx',
        'src/components/ui/Card.tsx',
        'src/components/ui/FormField.tsx',
        'src/components/ui/GlobalSearch.tsx',
        'src/components/ui/Modal.tsx',
        'src/components/ui/Sidebar.tsx',
        'src/context/LayoutContext.tsx',
        'src/hooks/useDebounce.ts',
        'src/theme/cssVars.ts',
        'src/theme/tokens/**/*.ts',
      ],
      exclude: ['src/test/**'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 65,
        statements: 80
      }
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(currentDirectory, './src'),
    },
  },
});
