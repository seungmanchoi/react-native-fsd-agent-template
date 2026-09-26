import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Same @shared/@features/... aliases as tsconfig.json (Metro reads them from there too).
  resolve: { tsconfigPaths: true },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    exclude: ['node_modules/**', '.expo/**', '.claude/**', '_workspace/**', 'plugins/**'],
  },
});
