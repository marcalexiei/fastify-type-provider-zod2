import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    watch: false,
    reporters: ['verbose'],
    coverage: {
      provider: 'v8',
      all: true,
      reporter: ['text', 'lcov'],
      thresholds: {
        statements: 95,
        branches: 95,
        functions: 95,
        lines: 95,
      },
    },
    projects: [
      {
        test: {
          name: 'runtime',
          dir: './test',
        },
      },
      // Creating separate project for typechecking because in the future I might add one project for each module resolution
      {
        test: {
          name: 'typecheck',
          dir: './test-types',
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
