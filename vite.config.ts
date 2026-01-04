import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      // Resolve gan-web-bluetooth to source files since dist may not be built
      'gan-web-bluetooth': path.resolve(import.meta.dirname, 'node_modules/gan-web-bluetooth/src/index.ts'),
    },
  },
  worker: {
    format: 'es',
  },
})
