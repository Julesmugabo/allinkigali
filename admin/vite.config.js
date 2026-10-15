import { resolve } from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Two sites from one codebase (they share the design pieces):
//   index.html   — Staff Portal       (admin.allinkigali.rw)
//   clients.html — client dashboard   (allinclients.allinkigali.rw)
// The customer's Ku Meza table page has its own light build: vite.table.config.js.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  build: {
    rollupOptions: {
      input: { main: resolve(__dirname, 'index.html'), clients: resolve(__dirname, 'clients.html') },
    },
  },
});
