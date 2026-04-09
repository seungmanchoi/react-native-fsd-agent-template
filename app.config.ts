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
      // TODO: Replace with actual AdMob App IDs from AdMob Console
      [
        'react-native-google-mobile-ads',
        {
          androidAppId: 'ca-app-pub-XXXXX~YYYYY',
          iosAppId: 'ca-app-pub-XXXXX~ZZZZZ',
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
