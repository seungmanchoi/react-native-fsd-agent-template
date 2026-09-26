/// <reference types="nativewind/types" />
// TS 6 no longer auto-includes @types packages and checks side-effect imports,
// so `import '../global.css'` needs Expo's asset declarations even before
// `expo start` generates expo-env.d.ts.
/// <reference types="expo/types" />
