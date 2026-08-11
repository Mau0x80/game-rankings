import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// VITE_BASE_PATH is set by the GitHub Actions workflow (Task 10) so the
// built site works under https://<user>.github.io/<repo>/. Defaults to
// '/' for local dev.
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH ?? '/',
  // Emit imported JSON as a JSON.parse("...") call rather than an inlined
  // JS object-literal expression. For a payload this size (~28,865 game
  // records), JSON.parse is meaningfully faster for engines to parse than
  // an equivalent object-literal expression, which speeds up first paint.
  json: { stringify: true },
});
