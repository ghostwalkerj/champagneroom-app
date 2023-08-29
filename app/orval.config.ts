import { defineConfig } from 'orval';

export default defineConfig({
  bitcart: {
    input: 'src/lib/util/bitcart/bitcart.yml',
    output: {
      target: 'src/lib/util/bitcart/index.ts',
      mock: false,
      schemas: 'src/lib/util/bitcart/models'
    },
    hooks: {
      afterAllFilesWrite: 'prettier --write'
    }
  }
});
