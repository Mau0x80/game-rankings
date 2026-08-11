import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// VITE_BASE_PATH is set by the GitHub Actions workflow (Task 10) so the
// built site works under https://<user>.github.io/<repo>/. Defaults to
// '/' for local dev.
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH ?? '/',
});
