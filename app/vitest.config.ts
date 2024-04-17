import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['tests/unit/*.{test,spec}.ts'],

    setupFiles: ['./setup/setupTests.ts', './setup/mongoMemoryServer.ts']
  }
});
