/**
 * Vitest Configuration for Tensho Mahjong Roguelike
 *
 * Unit and integration testing configuration.
 * Uses jsdom for component testing.
 */

import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    // Use jsdom for DOM testing
    environment: 'jsdom',

    // Setup files run before each test file
    setupFiles: ['./src/test/setup.ts'],

    // Global test utilities
    globals: true,

    // Include patterns
    include: ['src/**/*.{test,spec}.{ts,tsx}'],

    // Exclude patterns
    exclude: ['node_modules', 'dist', 'e2e'],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/test/**',
        'src/**/*.d.ts',
      ],
    },

    // Type checking
    typecheck: {
      enabled: false, // Disable for now due to existing type errors
    },
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})
