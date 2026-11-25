import { defineConfig } from 'vite';

const base = process.env.GITHUB_PAGES === 'true' ? '/sampled-website/' : '/';

export default defineConfig({
  base,
  server: {
    host: '0.0.0.0',
    allowedHosts: ['.e2b.app', 'localhost', '127.0.0.1']
  },
  preview: {
    host: '0.0.0.0',
    allowedHosts: ['.e2b.app', 'localhost', '127.0.0.1']
  }
});
