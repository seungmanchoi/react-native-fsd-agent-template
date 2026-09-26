// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  {
    ignores: [
      'node_modules/**',
      '.expo/**',
      '.idea/**',
      '.vscode/**',
      'ios/**',
      'android/**',
      'build-output/**',
      'dist/**',
      '.claude/**',
      'plugins/**',
      '_workspace/**',
    ],
  },
]);
