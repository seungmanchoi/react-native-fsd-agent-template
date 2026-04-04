import { TestIds } from 'react-native-google-mobile-ads';
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

const TEST_AD_UNITS: IAdUnitIds = {
  BANNER_GALLERY: TestIds.ADAPTIVE_BANNER,
  BANNER_SETTINGS: TestIds.ADAPTIVE_BANNER,
  INTERSTITIAL_AFTER_ACTION: TestIds.INTERSTITIAL,
  REWARDED_PREMIUM: TestIds.REWARDED,
  NATIVE_FEED: TestIds.NATIVE,
  APP_OPEN: TestIds.APP_OPEN,
};

function getPlatformAdUnits(): IAdUnitIds {
  return Platform.OS === 'ios' ? IOS_AD_UNITS : ANDROID_AD_UNITS;
}

export const AdUnitIds: IAdUnitIds = env.IS_PROD
  ? getPlatformAdUnits()
  : TEST_AD_UNITS;

export const ADS_CONFIG = {
  INTERSTITIAL_INTERVAL: 3,
  INTERSTITIAL_COOLDOWN_MS: 60_000,
  MAX_INTERSTITIALS_PER_DAY: 10,
  FIRST_AD_DELAY_MS: 180_000,
} as const;
