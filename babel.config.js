// babel-preset-expo already adds the worklets (Reanimated) plugin and resolves the
// tsconfig `paths` aliases through Metro — don't add them here again.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
  };
};
