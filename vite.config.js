import { defineConfig } from 'vite'

export default defineConfig({
  esbuild: { jsx: 'automatic' },
  server: { port: 5174, strictPort: true },
  preview: { port: 4174, strictPort: true },
  build: { assetsInlineLimit: 0 },
})
