import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: '0.0.0.0',
    allowedHosts: ['.e2b.app', 'localhost', '127.0.0.1']
  },
  preview: {
    host: '0.0.0.0',
    allowedHosts: ['.e2b.app', 'localhost', '127.0.0.1']
  },
  // The lazily-loaded Three.js scene is 139 KB gzipped; report its real transfer size.
  build: {
    chunkSizeWarningLimit: 600
  }
});
