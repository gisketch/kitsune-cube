import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    server: {
      deps: {
        inline: ['btcube-web', 'gan-web-bluetooth', 'aes-js'],
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      'gan-web-bluetooth': path.resolve(
        import.meta.dirname,
        'node_modules/gan-web-bluetooth/src/index.ts',
      ),
    },
  },
})
