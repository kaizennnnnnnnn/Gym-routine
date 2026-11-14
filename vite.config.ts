import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Repository Pages needs its subfolder; Vercel and local builds use the root.
  base: process.env.GITHUB_PAGES === 'true' ? '/Gym-routine/' : '/',
});
