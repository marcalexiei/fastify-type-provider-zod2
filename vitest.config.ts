import { defineConfig, type TestProjectConfiguration } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    watch: false,
    reporters: ['verbose'],
    coverage: {
      provider: 'v8',
      include: ['src'],
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
          name: { label: 'runtime', color: 'cyan' },
          dir: './test',
        },
      },
      // Creating separate project for typechecking because in the future I might add one project for each module resolution
      ...(
        [
          ['tsconfig.bundler.json', 'green'],
          ['tsconfig.node.json', 'magenta'],
          ['tsconfig.node16.json', 'white'],
        ] as const
      ).map<TestProjectConfiguration>(([it, color]) => ({
        test: {
          name: {
            label: `typecheck ${it.split('.')[1]}`,
            color,
          },
          dir: './test-types',
          typecheck: {
            enabled: true,
            only: true,
            tsconfig: `./test-types/${it}`,
          },
        },
      })),
    ],
  },
});
