import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    watch: false,
    reporters: ['verbose'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['test/**/*.ts', 'src/index.ts'],
      reporter: ['text', 'lcov'],
      all: true,
      thresholds: {
        statements: 94,
        branches: 90,
        functions: 91,
        lines: 94,
      },
    },
  },
});
