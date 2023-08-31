import { defineConfig } from 'orval';

export default defineConfig({
  bitcart: {
    input: 'src/lib/bitcart/bitcart.yml',
    output: {
      target: 'src/lib/bitcart/index.ts',
      mock: false,
      schemas: 'src/lib/bitcart/models'
    },
    hooks: {
      afterAllFilesWrite: 'prettier zd--write'
    }
  }
});
