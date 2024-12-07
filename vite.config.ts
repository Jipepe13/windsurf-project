import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/windsurf-project/',
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
