import { ExpoConfig, ConfigContext } from 'expo/config';

const SLUG = 'my-app';
// Owner rule: com.seungmanchoi.{slug}. Android package segments cannot contain '-'.
// Check it is unused on both stores before the first upload, then never change it.
const BUNDLE_ID = `com.seungmanchoi.${SLUG.replace(/-/g, '')}`;

// ATT purpose string — rewrite per app. Apple auto-rejects generic wording
// (CLAUDE.md "ATT 목적 문자열 규칙"). Also update plugins/withLocalizedAttDescription.js.
const TRACKING_PERMISSION_TEXT =
  "MyApp uses your device's advertising identifier to make the ads shown in this app more relevant — " +
  'for example, showing ads for apps and games similar to MyApp instead of unrelated products — ' +
  'and to measure how many people install an app after seeing its ad. ' +
  "Ads still appear if you decline; they just won't be personalized.";

export default ({ config }: ConfigContext): ExpoConfig => {
  const API_URL = process.env.API_URL || 'http://localhost:3000/api/v1';
  // Left undefined when unset: src/shared/config/env.ts then treats release
  // bundles as production (local fastlane builds have no EAS profile env).
  const APP_ENV = process.env.APP_ENV;
  const DEBUG = process.env.DEBUG === 'true';
  const LOG_LEVEL = process.env.LOG_LEVEL || 'debug';
  const APP_VERSION = process.env.APP_VERSION || '1.0.0';

  return {
    ...config,
    name: 'MyApp',
    slug: SLUG,
    version: APP_VERSION,
    orientation: 'portrait',
    // The theme is dark-only (src/shared/config/theme.ts) — keep native UI (keyboard, alerts) dark too.
    userInterfaceStyle: 'dark',
    scheme: 'myapp',
    icon: './assets/images/icon.png',
    ios: {
      supportsTablet: false,
      bundleIdentifier: BUNDLE_ID,
      googleServicesFile:
        process.env.GOOGLE_SERVICE_INFO_PLIST ?? './firebase/GoogleService-Info.plist',
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        // Plain HTTP only for local dev servers; everything else must be HTTPS.
        NSAppTransportSecurity: {
          NSAllowsLocalNetworking: true,
        },
        // Required for the App Tracking Transparency (ATT) prompt on iOS 14.5+.
        NSUserTrackingUsageDescription: TRACKING_PERMISSION_TEXT,
      },
    },
    android: {
      package: BUNDLE_ID,
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? './firebase/google-services.json',
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#0a0a0a',
      },
    },
    plugins: [
      [
        'expo-splash-screen',
        {
          image: './assets/images/splash-icon.png',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#0a0a0a',
        },
      ],
      // ATT prompt 문구 다국어 (InfoPlist.strings). plugins 배열 순서와 무관.
      './plugins/withLocalizedAttDescription',
      // Google AdMob test app IDs — safe for development/simulator.
      // Replace with real IDs from AdMob Console before production build.
      [
        'react-native-google-mobile-ads',
        {
          androidAppId: 'ca-app-pub-3940256099942544~3347511713',
          iosAppId: 'ca-app-pub-3940256099942544~1458002511',
          userTrackingUsageDescription: TRACKING_PERMISSION_TEXT,
          // Keep Google app measurement off until mobileAds().initialize(), which only
          // runs after UMP consent (src/features/ads/lib/consent.ts).
          delayAppMeasurementInit: true,
        },
      ],
      ['expo-tracking-transparency', { userTrackingPermission: TRACKING_PERMISSION_TEXT }],
      // Firebase Analytics + Crashlytics. Place GoogleService-Info.plist and
      // google-services.json in ./firebase/ (gitignored) or inject them as EAS file env vars.
      '@react-native-firebase/app',
      '@react-native-firebase/crashlytics',
      [
        'expo-build-properties',
        {
          ios: {
            // RN Firebase 26 pulls the Firebase iOS SDK via Swift Package Manager, which
            // requires dynamic frameworks. Never set 'static' alone — pod install fails.
            // Static opt-out: RNFB app plugin { ios: { disableSPM: true } } + 'static'
            // + forceStaticLinking listing every RNFB pod (RNFBApp, RNFBAnalytics, ...).
            useFrameworks: 'dynamic',
            // UIScene life cycle (opt-in on SDK 57, default on SDK 58). Apps built with the
            // iOS 27 SDK (Xcode 27) don't launch correctly without it.
            enableSceneSupport: true,
          },
        },
      ],
      'expo-router',
      'expo-secure-store',
      // Localized app name — shown on home screen matching store listing
      // Add/remove languages as needed. Keys are locale codes.
      [
        './plugins/withLocalizedAppName',
        {
          en: 'MyApp',
          ko: '마이앱',
          ja: 'マイアプリ',
          'zh-Hans': '我的应用',
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: false,
    },
    extra: {
      apiUrl: API_URL,
      appEnv: APP_ENV,
      debug: DEBUG,
      logLevel: LOG_LEVEL,
      appVersion: APP_VERSION,
      router: {},
      eas: {
        projectId: '',
      },
    },
  };
};
