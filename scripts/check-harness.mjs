#!/usr/bin/env node
// Hard Threshold checks that ESLint/tsc can't see (config files, git state, harness copies).
// Wrapper-bypass imports and UTC date keys are ESLint rules (eslint.config.js).
// Part of `npm run verify`; exits 1 on any violation.
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const read = (p) => (existsSync(join(root, p)) ? readFileSync(join(root, p), 'utf8') : '');
const failures = [];
const expect = (ok, message) => ok || failures.push(message);

function walk(dir) {
  return readdirSync(join(root, dir)).flatMap((name) => {
    const p = join(dir, name);
    return statSync(join(root, p)).isDirectory() ? walk(p) : [p];
  });
}

// Codex copies match the .claude sources.
try {
  execFileSync(process.execPath, [join(root, 'scripts/sync-codex-harness.mjs'), '--check'], {
    stdio: 'pipe',
  });
} catch (e) {
  failures.push(e.stderr.toString().trim());
}

// NativeWind — one missing piece silently drops every className.
expect(
  /jsxImportSource:\s*'nativewind'/.test(read('babel.config.js')),
  "babel.config.js: babel-preset-expo needs { jsxImportSource: 'nativewind' }",
);
expect(
  read('babel.config.js').includes("'nativewind/babel'"),
  "babel.config.js: missing 'nativewind/babel' preset",
);
expect(
  read('metro.config.js').includes('withNativeWind('),
  'metro.config.js: missing withNativeWind(config, { input: ./global.css })',
);
expect(
  read('tailwind.config.js').includes("require('nativewind/preset')"),
  'tailwind.config.js: missing nativewind/preset',
);
for (const d of ['base', 'components', 'utilities'])
  expect(read('global.css').includes(`@tailwind ${d};`), `global.css: missing @tailwind ${d};`);
expect(
  read('app/_layout.tsx').includes("import '../global.css'"),
  "app/_layout.tsx: missing import '../global.css'",
);
expect(
  read('nativewind-env.d.ts').includes('nativewind/types'),
  'nativewind-env.d.ts: missing nativewind/types reference',
);

// Screens are wrapped in a safe area (layouts and non-UI routes are exempt). Comments are
// stripped so a "// TODO: SafeAreaView" does not count.
const stripComments = (src) =>
  src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
for (const file of walk('app').filter(
  (f) => f.endsWith('.tsx') && !/(^|\/)(_layout|\+html|\+native-intent)\.tsx$/.test(f),
)) {
  const code = stripComments(read(file));
  if (/<Redirect\b/.test(code) && !/<(View|ScrollView|Text)\b/.test(code)) continue;
  expect(
    /SafeAreaView|useSafeAreaInsets/.test(code),
    `${file}: screen has no SafeAreaView / useSafeAreaInsets`,
  );
}

// Firebase: native Analytics collection stays off until initAnalytics() (IS_PROD), config files
// never committed. Each check applies only while that SDK is installed.
const deps = JSON.parse(read('package.json')).dependencies ?? {};
const rnFirebase = existsSync(join(root, 'firebase.json'))
  ? (JSON.parse(read('firebase.json'))['react-native'] ?? {})
  : {};
if (deps['@react-native-firebase/analytics']) {
  expect(
    rnFirebase.analytics_auto_collection_enabled === false,
    'firebase.json: analytics_auto_collection_enabled must be false (initAnalytics() enables it in production)',
  );
}
if (deps['@react-native-firebase/crashlytics']) {
  expect(
    rnFirebase.crashlytics_auto_collection_enabled !== false,
    'firebase.json: do not disable crashlytics_auto_collection_enabled',
  );
}
const tracked = execFileSync('git', ['ls-files'], { cwd: root }).toString().split('\n');
for (const f of tracked.filter((f) =>
  /(^|\/)(GoogleService-Info\.plist|google-services\.json)$/.test(f),
)) {
  failures.push(`${f}: Firebase config must not be committed`);
}

// Expo SDK 57: UIScene support is opt-in, and apps built with the iOS 27 SDK need it to launch.
if (/^[~^]?57\./.test(deps.expo ?? '')) {
  expect(
    /enableSceneSupport:\s*true/.test(stripComments(read('app.config.ts'))),
    'app.config.ts: expo-build-properties ios.enableSceneSupport must stay true (iOS 27 SDK builds)',
  );
}

// Pins (CLAUDE.md): AdMob 17.1–17.2 break the Android Gradle config with the Expo plugin.
if (deps['react-native-google-mobile-ads']) {
  expect(
    deps['react-native-google-mobile-ads'] === '17.0.0',
    'package.json: react-native-google-mobile-ads must be pinned to exactly 17.0.0',
  );
}

// ATT purpose string that Apple auto-rejects as placeholder text.
for (const f of ['app.config.ts', ...walk('plugins')]) {
  expect(
    !read(f).includes('deliver personalized ads to you'),
    `${f}: generic ATT purpose string (auto-rejected) — rewrite it per app`,
  );
}

if (failures.length) {
  console.error(`check-harness: ${failures.length} violation(s)\n  - ${failures.join('\n  - ')}`);
  process.exit(1);
}
console.log('check-harness: OK');
