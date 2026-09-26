import { AppState, Platform } from 'react-native';
import mobileAds, {
  AdsConsent,
  AdsConsentPrivacyOptionsRequirementStatus,
  AdsConsentStatus,
  AgeRestrictedTreatment,
  MaxAdContentRating,
  type AdsConsentInfo,
} from 'react-native-google-mobile-ads';
import {
  getTrackingPermissionsAsync,
  requestTrackingPermissionsAsync,
} from 'expo-tracking-transparency';
import { env, TEST_DEVICE_IDS } from '@shared/config';
import { setUserProperty } from '@shared/lib/analytics';

/**
 * AdMob startup sequence. Runs UMP → ATT → SDK.initialize() in the order
 * required by Google AdMob policy:
 *
 *   1. UMP (User Messaging Platform) — GDPR/IDFA consent, refreshed on every
 *      launch. Form is configured in AdMob Console > Privacy & messaging. Outside
 *      regulated regions it is a no-op. **The message must be published in AdMob
 *      Console** or `requestInfoUpdate` will always return `NOT_REQUIRED`.
 *   2. (iOS) App Tracking Transparency — must run AFTER UMP so the system
 *      dialog appears with the right context.
 *   3. setRequestConfiguration → initialize() — last, and only when UMP says
 *      `canRequestAds`; it freezes the request configuration of the first ad.
 *
 * Ads are "ready" only after step 3 — every ad load must be gated on
 * `isAdsReady()` / `useAdsReady()`, never on the mount alone.
 *
 * Idempotent — multiple invocations return the same Promise. Never rejects.
 *
 * @see CLAUDE.md "광고 동의 시퀀스 (MANDATORY)" for the harness rule.
 */
export interface IAdConsentResult {
  umpStatus: AdsConsentStatus;
  /** AdMob SDK가 광고 요청을 보내도 되는지 여부. UMP 응답에서 파생. */
  canRequestAds: boolean;
  /** true면 설정 화면에 "광고 개인정보 설정" 버튼을 노출해야 한다 (EEA 등). */
  privacyOptionsRequired: boolean;
  attStatus: 'granted' | 'denied' | 'undetermined' | 'restricted' | 'unavailable';
}

let consentPromise: Promise<IAdConsentResult> | null = null;
let sdkStart: Promise<void> | null = null;
let isReady = false;
const readyListeners = new Set<() => void>();

/** SDK 초기화 완료 + UMP 광고 요청 허용 여부 — 모든 광고 로드 가드. */
export function isAdsReady(): boolean {
  return isReady;
}

/** 광고 준비 완료 시 호출되는 콜백. 이미 ready면 즉시 실행. unsubscribe 반환. */
export function onAdsReady(listener: () => void): () => void {
  if (isReady) {
    listener();
    return (): void => undefined;
  }
  readyListeners.add(listener);
  return (): void => {
    readyListeners.delete(listener);
  };
}

function markReady(): void {
  isReady = true;
  readyListeners.forEach((fn) => {
    try {
      fn();
    } catch {
      // 한 listener 에러로 나머지가 막히지 않게
    }
  });
  readyListeners.clear();
}

/** setRequestConfiguration → initialize, once. Only call after UMP allows ad requests. */
function startSdk(): Promise<void> {
  sdkStart ??= (async (): Promise<void> => {
    try {
      await mobileAds().setRequestConfiguration({
        maxAdContentRating: MaxAdContentRating.PG,
        // Kids/teen-directed apps must change this (COPPA / GDPR age of consent).
        ageRestrictedTreatment: AgeRestrictedTreatment.UNSPECIFIED,
        testDeviceIdentifiers: TEST_DEVICE_IDS,
      });
    } catch {
      // setRequestConfiguration 실패해도 초기화는 진행
    }
    try {
      await mobileAds().initialize();
      markReady();
    } catch (err) {
      sdkStart = null; // allow a later retry (e.g. after the privacy options form)
      if (__DEV__) {
        console.warn('[ads] mobileAds().initialize() failed:', err);
      }
    }
  })();
  return sdkStart;
}

function waitForActiveApp(): Promise<void> {
  if (AppState.currentState === 'active') return Promise.resolve();
  return new Promise((resolve) => {
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active') {
        subscription.remove();
        resolve();
      }
    });
  });
}

async function requestAtt(): Promise<IAdConsentResult['attStatus']> {
  // The ATT alert only appears while the app is active; also give the UMP modal time to dismiss.
  await waitForActiveApp();
  await new Promise<void>((resolve) => setTimeout(resolve, 400));
  try {
    const current = await getTrackingPermissionsAsync();
    if (current.status !== 'undetermined') return current.status;
    return (await requestTrackingPermissionsAsync()).status;
  } catch (error) {
    if (__DEV__) {
      console.warn('[ads] ATT permission flow failed:', error);
    }
    return 'unavailable';
  }
}

async function runConsentFlow(): Promise<IAdConsentResult> {
  let info: AdsConsentInfo | null = null;

  // ── 1) UMP (GDPR) consent — every launch ───────────────────────────────
  try {
    info = await AdsConsent.gatherConsent();
  } catch (error) {
    if (__DEV__) {
      console.warn('[ads] UMP consent flow failed:', error);
    }
    // Offline / UMP error: consent stored by a previous session may still allow ads.
    try {
      info = await AdsConsent.getConsentInfo();
    } catch {
      info = null;
    }
  }

  // ── 2) (iOS) ATT prompt — after the UMP form closes ────────────────────
  const attStatus = Platform.OS === 'ios' ? await requestAtt() : 'unavailable';

  // ── 3) SDK 초기화 + request configuration ─────────────────────────────
  const canRequestAds = info?.canRequestAds ?? false;
  if (canRequestAds) {
    await startSdk();
  }

  const result: IAdConsentResult = {
    umpStatus: info?.status ?? AdsConsentStatus.UNKNOWN,
    canRequestAds,
    privacyOptionsRequired:
      info?.privacyOptionsRequirementStatus === AdsConsentPrivacyOptionsRequirementStatus.REQUIRED,
    attStatus,
  };

  // Consent cohorts for eCPM analysis (CLAUDE.md "Analytics 기록").
  void setUserProperty('ump_status', result.umpStatus.toLowerCase());
  void setUserProperty('ump_can_request_ads', String(result.canRequestAds));
  void setUserProperty('att_status', result.attStatus === 'unavailable' ? 'not_applicable' : result.attStatus);

  return result;
}

/**
 * 표준 광고 초기화. 루트 `_layout.tsx`에서 1회 호출 (렌더를 막지 않도록 `void`).
 *
 * Expo Go에서는 native 모듈 부재로 no-op — 광고는 ready가 되지 않는다.
 */
export function initializeAdsWithConsent(): Promise<IAdConsentResult> {
  if (env.IS_EXPO_GO) {
    return Promise.resolve({
      umpStatus: AdsConsentStatus.UNKNOWN,
      canRequestAds: false,
      privacyOptionsRequired: false,
      attStatus: 'unavailable',
    });
  }
  consentPromise ??= runConsentFlow();
  return consentPromise;
}

/**
 * "설정 > 광고 개인정보 설정" 버튼에서 호출 (`privacyOptionsRequired`일 때만 노출).
 * 사용자가 동의를 새로 허용하면 이 세션에서 바로 SDK를 시작한다.
 */
export async function showAdsConsentForm(): Promise<void> {
  if (env.IS_EXPO_GO) return;
  try {
    const info = await AdsConsent.showPrivacyOptionsForm();
    if (info.canRequestAds) {
      await startSdk();
    }
  } catch (err) {
    if (__DEV__) {
      console.warn('[ads] showPrivacyOptionsForm failed:', err);
    }
  }
}
