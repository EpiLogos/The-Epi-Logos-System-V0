import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    css: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@epi-logos/shared-types': path.resolve(__dirname, '../packages/shared-types/src'),
      '@epi-logos/ui-components': path.resolve(__dirname, '../packages/ui-components/src'),
    },
  },
});
