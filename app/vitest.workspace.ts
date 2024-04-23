import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  {
    extends: './vite.config.ts',
    test: {
      globals: true,
      include: ['tests/unit/*.{test,spec}.ts'],
      setupFiles: ['./setup/setupTests.ts', './setup/mongoMemoryServer.ts'],
      name: 'unit',
      environment: 'node'
    }
  },
  {
    extends: './vite.config.ts',
    test: {
      name: 'integration',
      environment: 'node',
      include: ['tests/integration/*.{test,spec}.ts'],
      globals: true
    }
  },
  {
    extends: './vite.config.ts',
    test: {
      name: 'e2e',
      environment: 'happy-dom',
      include: ['tests/e2e/*.{test,spec}.ts'],
      globals: true
    }
  }
]);
