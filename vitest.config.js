import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: { include: ['test/convex/**/*.test.ts'], environment: 'edge-runtime' },
})
