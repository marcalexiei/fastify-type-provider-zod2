import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    watch: false,
    reporters: ['verbose'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['test/**/*.ts'],
      reporter: ['text', 'lcov'],
      all: true,
      thresholds: {
        statements: 94,
        branches: 90,
        functions: 91,
        lines: 94,
      },
    },
    projects: [
      {
        test: {
          name: 'runtime',
          include: ['./test/**.spec.ts'],
        },
      },
      // Creating separate project for typechecking because in the future I might add one project for each module resolution
      {
        test: {
          name: 'typecheck',
          include: ['./types/*.test-d.ts'],
          typecheck: {
            enabled: true,
            only: true,
            tsconfig: './tsconfig.test.json',
          },
        },
      },
    ],
  },
});
