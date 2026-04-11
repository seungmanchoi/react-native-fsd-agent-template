const expo = require('eslint-config-expo/flat');

module.exports = [
  ...expo,
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      'react/react-in-jsx-scope': 'off',
    },
  },
  {
    ignores: [
      'node_modules/**',
      '.expo/**',
      '.idea/**',
      '.vscode/**',
      'build-output/**',
      'dist/**',
      '.claude/**',
      'plugins/**',
      '_workspace/**',
    ],
  },
];
