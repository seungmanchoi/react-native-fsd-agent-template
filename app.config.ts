import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  const API_URL = process.env.API_URL || 'http://localhost:3000/api/v1';
  const NODE_ENV = process.env.NODE_ENV || 'development';
  const DEBUG = process.env.DEBUG === 'true';
  const LOG_LEVEL = process.env.LOG_LEVEL || 'debug';
  const APP_VERSION = process.env.APP_VERSION || '1.0.0';

  return {
    ...config,
    name: 'MyApp',
    slug: 'my-app',
    version: APP_VERSION,
    orientation: 'portrait',
    userInterfaceStyle: 'automatic',
    scheme: 'myapp',
    icon: './assets/images/icon.png',
    splash: {
      image: './assets/images/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#0a0a0a',
    },
    web: {
      bundler: 'metro',
      output: 'static',
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'com.myapp.app',
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSAppTransportSecurity: {
          NSAllowsArbitraryLoads: true,
          NSAllowsLocalNetworking: true,
        },
        // Required for App Tracking Transparency (ATT) prompt on iOS 14.5+.
        // Customize the wording per app — Apple reviews this string.
        NSUserTrackingUsageDescription:
          'This identifier will be used to deliver personalized ads to you.',
      },
    },
    android: {
      package: 'com.myapp.app',
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#0a0a0a',
      },
    },
    plugins: [
      // Google AdMob test app IDs — safe for development/simulator
      // Replace with real IDs from AdMob Console before production build
      [
        'react-native-google-mobile-ads',
        {
          androidAppId: 'ca-app-pub-3940256099942544~3347511713',
          iosAppId: 'ca-app-pub-3940256099942544~1458002511',
          userTrackingUsageDescription:
            'This identifier will be used to deliver personalized ads to you.',
        },
      ],
      // ATT prompt on iOS 14.5+ — required so AdMob can serve personalized ads.
      [
        'expo-tracking-transparency',
        {
          userTrackingPermission:
            'This identifier will be used to deliver personalized ads to you.',
        },
      ],
      'expo-router',
      'expo-secure-store',
      // Localized app name — shown on home screen matching store listing
      // Add/remove languages as needed. Keys are locale codes.
      ['./plugins/withLocalizedAppName', {
        en: 'MyApp',
        ko: '마이앱',
        ja: 'マイアプリ',
        'zh-Hans': '我的应用',
      }],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: false,
    },
    newArchEnabled: true,
    extra: {
      apiUrl: API_URL,
      nodeEnv: NODE_ENV,
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
