import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { sigmatSqlitePlugin } from './db/viteSqlitePlugin.ts';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), sigmatSqlitePlugin()],
});
