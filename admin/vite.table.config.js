import { resolve } from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The guests' Ku Meza page (allinkigali.rw/t/<token> from a table's QR code,
// allinkigali.rw/table to type the code), built on its own so it stays small
// and quick on a cheap phone. Output: dist-table/, assets under /kumeza/.
export default defineConfig({
  plugins: [react()],
  base: '/kumeza/',
  publicDir: false,
  server: { port: 5174 },
  build: {
    outDir: 'dist-table',
    rollupOptions: { input: { table: resolve(__dirname, 'table.html') } },
  },
});
