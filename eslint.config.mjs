import { defineConfig } from 'eslint/config';

export default defineConfig({
  root: true,
  ignorePatterns: ['node_modules/', 'dist/', 'coverage/', '.next/'],
});
