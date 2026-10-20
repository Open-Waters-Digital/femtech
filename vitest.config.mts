import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    // Unit tests only. Anything needing Postgres lives in vitest.int.config.mts,
    // so this half of the gate runs anywhere.
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
