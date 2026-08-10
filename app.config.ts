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
      // RN Firebase + AdMob 호환성 (Expo issue #39607). 신규 앱은 jsc 유지 권장.
      jsEngine: 'jsc',
      bundleIdentifier: 'com.myapp.app',
      googleServicesFile:
        process.env.GOOGLE_SERVICE_INFO_PLIST ??
        './firebase/GoogleService-Info.plist',
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSAppTransportSecurity: {
          NSAllowsArbitraryLoads: true,
          NSAllowsLocalNetworking: true,
        },
        // Required for App Tracking Transparency (ATT) prompt on iOS 14.5+.
        // Customize the wording per app — Apple reviews this string.
        NSUserTrackingUsageDescription:
          "MyApp uses your device's advertising identifier to make the ads shown in this app more relevant — for example, showing ads for apps and games similar to MyApp instead of unrelated products — and to measure how many people install an app after seeing its ad. Ads still appear if you decline; they just won't be personalized.",
      },
    },
    android: {
      package: 'com.myapp.app',
      googleServicesFile:
        process.env.GOOGLE_SERVICES_JSON ?? './firebase/google-services.json',
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#0a0a0a',
      },
    },
    plugins: [
      // ATT 프롬프트 문구 다국어 (InfoPlist.strings). plugins 배열 순서와 무관.
      './plugins/withLocalizedAttDescription',
      // Google AdMob test app IDs — safe for development/simulator
      // Replace with real IDs from AdMob Console before production build
      [
        'react-native-google-mobile-ads',
        {
          androidAppId: 'ca-app-pub-3940256099942544~3347511713',
          iosAppId: 'ca-app-pub-3940256099942544~1458002511',
          userTrackingUsageDescription:
            "MyApp uses your device's advertising identifier to make the ads shown in this app more relevant — for example, showing ads for apps and games similar to MyApp instead of unrelated products — and to measure how many people install an app after seeing its ad. Ads still appear if you decline; they just won't be personalized.",
        },
      ],
      // ATT prompt on iOS 14.5+ — required so AdMob can serve personalized ads.
      [
        'expo-tracking-transparency',
        {
          userTrackingPermission:
            "MyApp uses your device's advertising identifier to make the ads shown in this app more relevant — for example, showing ads for apps and games similar to MyApp instead of unrelated products — and to measure how many people install an app after seeing its ad. Ads still appear if you decline; they just won't be personalized.",
        },
      ],
      // Firebase Analytics — restores AdMob audience signals for higher eCPM.
      // Without this, ads default to non-personalized (NPA) and eCPM drops 3-5x.
      // Place GoogleService-Info.plist + google-services.json in ./firebase/.
      '@react-native-firebase/app',
      [
        'expo-build-properties',
        {
          ios: {
            // RN Firebase v24 + Expo SDK 54 + RN 0.81 호환성 (Expo issue #39607):
            // - useFrameworks: 'static' → AdMob(react-native-google-mobile-ads) 요구사항
            // - forceStaticLinking: RNFB pod들을 prebuilt React framework 대신
            //   static link 로 빌드 → "include of non-modular header inside
            //   framework module" 에러 해결
            // - GoogleUtilities modular_headers → AdMob과의 공유 pod 호환성
            useFrameworks: 'static',
            forceStaticLinking: ['RNFBApp', 'RNFBAnalytics'],
            extraPods: [{ name: 'GoogleUtilities', modular_headers: true }],
          },
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
