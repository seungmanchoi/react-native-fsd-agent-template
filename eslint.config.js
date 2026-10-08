// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

// Hard Thresholds: each SDK is only reachable through its wrapper directory.
const WRAPPED_SDKS = [
  {
    wrapper: 'src/shared/lib/analytics/**',
    group: ['@react-native-firebase/*'],
    message: 'Use the @shared/lib/analytics wrapper.',
  },
  {
    wrapper: 'src/shared/store-review/**',
    group: ['expo-store-review'],
    message: 'Use useStoreReview().maybeRequest(REVIEW_TRIGGERS.X).',
  },
  {
    wrapper: 'src/features/ads/**',
    group: ['react-native-google-mobile-ads', 'expo-tracking-transparency'],
    message: 'Use @features/ads (initializeAdsWithConsent, AdBanner, use*Ad hooks).',
  },
];
// A file gets the restrictions of every SDK whose wrapper it is not part of.
// (Config objects override the same rule, so each wrapper needs its own complete list.)
const restrictImports = (sdks) => ({
  '@typescript-eslint/no-restricted-imports': [
    'error',
    { patterns: sdks.map(({ group, message }) => ({ group, message, allowTypeImports: true })) },
  ],
});

module.exports = defineConfig([
  expoConfig,
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      'no-restricted-syntax': [
        'error',
        {
          // x.toISOString().split('T')[0] — a UTC date, "yesterday" in KST before 09:00.
          selector:
            "MemberExpression[property.value=0] > CallExpression.object[callee.property.name='split'] > MemberExpression.callee > CallExpression.object[callee.property.name='toISOString']",
          message:
            "UTC date key — use dayjs().format('YYYY-MM-DD') for a local date (CLAUDE.md 날짜/시간 처리).",
        },
      ],
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    ignores: WRAPPED_SDKS.map((s) => s.wrapper),
    rules: restrictImports(WRAPPED_SDKS),
  },
  ...WRAPPED_SDKS.map((sdk) => ({
    files: [`${sdk.wrapper}/*.ts`, `${sdk.wrapper}/*.tsx`],
    rules: restrictImports(WRAPPED_SDKS.filter((other) => other !== sdk)),
  })),
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
