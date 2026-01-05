import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      'gan-web-bluetooth': path.resolve(
        import.meta.dirname,
        'node_modules/gan-web-bluetooth/src/index.ts',
      ),
    },
  },
  worker: {
    format: 'es',
  },
})
