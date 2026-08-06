import { defineConfig } from 'vite';

// The preview harness assigns a port via PORT when 5173 is taken.
export default defineConfig({
  root: 'web',
  server: process.env.PORT ? { port: Number(process.env.PORT), strictPort: true } : {},
});
