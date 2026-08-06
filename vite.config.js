import { defineConfig } from 'vite';

// The preview harness assigns a port via PORT when 5173 is taken.
export default defineConfig({
  root: 'web',
  // Relative asset paths: GitHub Pages serves this as a project site at
  // /forward-deployed-game-web/, not at the domain root, so absolute
  // "/assets/..." paths would 404.
  base: './',
  server: process.env.PORT ? { port: Number(process.env.PORT), strictPort: true } : {},
});
