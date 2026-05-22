import { Platform } from 'react-native';
import mobileAds, { AdsConsent, AdsConsentStatus } from 'react-native-google-mobile-ads';
import {
  getTrackingPermissionsAsync,
  requestTrackingPermissionsAsync,
} from 'expo-tracking-transparency';

/**
 * Run the AdMob startup sequence in the correct order:
 *
 *   1. UMP (Google User Messaging Platform) — GDPR consent form for EU users.
 *      The form is configured in AdMob Console > Privacy & messaging.
 *      Outside of regulated regions this is a no-op.
 *   2. iOS App Tracking Transparency (ATT) — must run AFTER UMP so the
 *      system dialog appears with the right context.
 *   3. mobileAds().initialize() — must be last; it freezes the request
 *      configuration that personalized ads depend on.
 *
 * Returns the final ATT + UMP status for logging / analytics.
 */
export interface IAdConsentResult {
  umpStatus: AdsConsentStatus;
  attStatus: 'granted' | 'denied' | 'undetermined' | 'restricted' | 'unavailable';
}

export async function initializeAdsWithConsent(): Promise<IAdConsentResult> {
  let umpStatus: AdsConsentStatus = AdsConsentStatus.UNKNOWN;
  let attStatus: IAdConsentResult['attStatus'] = 'unavailable';

  try {
    const info = await AdsConsent.requestInfoUpdate();
    umpStatus = info.status;
    if (info.isConsentFormAvailable && info.status === AdsConsentStatus.REQUIRED) {
      const formResult = await AdsConsent.loadAndShowConsentFormIfRequired();
      umpStatus = formResult.status;
    }
  } catch (error) {
    if (__DEV__) {
      console.warn('[ads] UMP consent flow failed:', error);
    }
  }

  if (Platform.OS === 'ios') {
    try {
      const current = await getTrackingPermissionsAsync();
      if (current.status === 'undetermined') {
        const requested = await requestTrackingPermissionsAsync();
        attStatus = requested.status;
      } else {
        attStatus = current.status;
      }
    } catch (error) {
      if (__DEV__) {
        console.warn('[ads] ATT permission flow failed:', error);
      }
    }
  }

  await mobileAds().initialize();

  return { umpStatus, attStatus };
}
