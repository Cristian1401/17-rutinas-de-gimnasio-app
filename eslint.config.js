const expoConfig = require('eslint-config-expo/flat');
const { defineConfig } = require('eslint/config');

module.exports = defineConfig(
  expoConfig,
  {
    ignores: ['.expo/**', 'coverage/**'],
  },
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/*.test.js'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        expect: 'readonly',
        it: 'readonly',
      },
    },
  },
);
