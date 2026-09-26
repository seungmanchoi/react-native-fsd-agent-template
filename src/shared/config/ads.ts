import { Platform } from 'react-native';
import { env } from './env';

interface IAdUnitIds {
  BANNER_GALLERY: string;
  BANNER_SETTINGS: string;
  INTERSTITIAL_AFTER_ACTION: string;
  REWARDED_PREMIUM: string;
  NATIVE_FEED: string;
  APP_OPEN: string;
}

// TODO: Replace with actual AdMob ad unit IDs from AdMob Console
const IOS_AD_UNITS: IAdUnitIds = {
  BANNER_GALLERY: 'ca-app-pub-XXXXX/YYYYY',
  BANNER_SETTINGS: 'ca-app-pub-XXXXX/YYYYY',
  INTERSTITIAL_AFTER_ACTION: 'ca-app-pub-XXXXX/YYYYY',
  REWARDED_PREMIUM: 'ca-app-pub-XXXXX/YYYYY',
  NATIVE_FEED: 'ca-app-pub-XXXXX/YYYYY',
  APP_OPEN: 'ca-app-pub-XXXXX/YYYYY',
};

// TODO: Replace with actual AdMob ad unit IDs from AdMob Console
const ANDROID_AD_UNITS: IAdUnitIds = {
  BANNER_GALLERY: 'ca-app-pub-XXXXX/ZZZZZ',
  BANNER_SETTINGS: 'ca-app-pub-XXXXX/ZZZZZ',
  INTERSTITIAL_AFTER_ACTION: 'ca-app-pub-XXXXX/ZZZZZ',
  REWARDED_PREMIUM: 'ca-app-pub-XXXXX/ZZZZZ',
  NATIVE_FEED: 'ca-app-pub-XXXXX/ZZZZZ',
  APP_OPEN: 'ca-app-pub-XXXXX/ZZZZZ',
};

const IOS_TEST_AD_UNITS: IAdUnitIds = {
  BANNER_GALLERY: 'ca-app-pub-3940256099942544/2435281174',
  BANNER_SETTINGS: 'ca-app-pub-3940256099942544/2435281174',
  INTERSTITIAL_AFTER_ACTION: 'ca-app-pub-3940256099942544/4411468910',
  REWARDED_PREMIUM: 'ca-app-pub-3940256099942544/1712485313',
  NATIVE_FEED: 'ca-app-pub-3940256099942544/3986624511',
  APP_OPEN: 'ca-app-pub-3940256099942544/5575463023',
};

const ANDROID_TEST_AD_UNITS: IAdUnitIds = {
  BANNER_GALLERY: 'ca-app-pub-3940256099942544/9214589741',
  BANNER_SETTINGS: 'ca-app-pub-3940256099942544/9214589741',
  INTERSTITIAL_AFTER_ACTION: 'ca-app-pub-3940256099942544/1033173712',
  REWARDED_PREMIUM: 'ca-app-pub-3940256099942544/5224354917',
  NATIVE_FEED: 'ca-app-pub-3940256099942544/2247696110',
  APP_OPEN: 'ca-app-pub-3940256099942544/9257395921',
};

function getPlatformAdUnits(): IAdUnitIds {
  return Platform.OS === 'ios' ? IOS_AD_UNITS : ANDROID_AD_UNITS;
}

function getPlatformTestAdUnits(): IAdUnitIds {
  return Platform.OS === 'ios' ? IOS_TEST_AD_UNITS : ANDROID_TEST_AD_UNITS;
}

// Real units only in production builds. Development and preview builds get Google
// test units, so internal testers can never generate invalid traffic.
export const AdUnitIds: IAdUnitIds = env.IS_PROD
  ? getPlatformAdUnits()
  : getPlatformTestAdUnits();

/**
 * Physical devices that install production (real-ad) builds — TestFlight, internal
 * Play tracks, your own phone. The SDK prints the device ID in the native log on the
 * first ad request. Simulators/emulators are test devices automatically.
 */
export const TEST_DEVICE_IDS: string[] = [];

export const ADS_CONFIG = {
  INTERSTITIAL_INTERVAL: 3,
  INTERSTITIAL_COOLDOWN_MS: 60_000,
  MAX_INTERSTITIALS_PER_DAY: 10,
  FIRST_AD_DELAY_MS: 180_000,
  /** Shared by interstitial / rewarded / app open: no full-screen ad within this window after one closes. */
  FULLSCREEN_COOLDOWN_MS: 30_000,
  /** App open ads only after the app was in the background at least this long. */
  APP_OPEN_MIN_BACKGROUND_MS: 30_000,
  /** Load-failure retries: 2s → 4s → 8s, then wait until the app returns to the foreground. */
  LOAD_RETRY_DELAYS_MS: [2_000, 4_000, 8_000],
  /** Duration of premium access granted by a rewarded ad (ms) */
  REWARDED_PREMIUM_DURATION_MS: 30 * 60_000, // 30 minutes
  /** Interval to check premium expiry while app is in foreground (ms) */
  PREMIUM_CHECK_INTERVAL_MS: 10_000, // 10 seconds
  /** AsyncStorage keys (zustand persist) */
  STORAGE_KEYS: {
    AD_STATE: '@ads/ad_state',
    PREMIUM_STATE: '@ads/premium_state',
  },
} as const;
