import { Platform } from 'react-native';
import mobileAds, {
  AdsConsent,
  AdsConsentStatus,
  MaxAdContentRating,
} from 'react-native-google-mobile-ads';
import {
  getTrackingPermissionsAsync,
  requestTrackingPermissionsAsync,
} from 'expo-tracking-transparency';
import { env } from '@shared/config';

/**
 * AdMob startup sequence. Runs UMP → ATT → SDK.initialize() in the order
 * required by Google AdMob policy:
 *
 *   1. UMP (User Messaging Platform) — GDPR/IDFA consent. Form is configured
 *      in AdMob Console > Privacy & messaging. Outside regulated regions it
 *      is a no-op. **The message must be published in AdMob Console** or
 *      `requestInfoUpdate` will always return `NOT_REQUIRED`.
 *   2. (iOS) App Tracking Transparency — must run AFTER UMP so the system
 *      dialog appears with the right context.
 *   3. mobileAds().initialize() — must be last; it freezes the request
 *      configuration that personalized ads depend on.
 *
 * Missing/out-of-order steps cause EU eCPM to drop drastically because the
 * first ad request ships without consent flags.
 *
 * Idempotent — multiple invocations return the same Promise.
 *
 * @see CLAUDE.md "광고 동의 시퀀스 (MANDATORY)" for the harness rule.
 */
export interface IAdConsentResult {
  umpStatus: AdsConsentStatus;
  /** AdMob SDK가 광고 요청을 보내도 되는지 여부. UMP 응답에서 파생. */
  canRequestAds: boolean;
  attStatus: 'granted' | 'denied' | 'undetermined' | 'restricted' | 'unavailable';
}

let consentPromise: Promise<IAdConsentResult> | null = null;
let isReady = false;
const readyListeners: (() => void)[] = [];

/** SDK 초기화 완료 여부 — 광고 컴포넌트 마운트 가드용 */
export function isAdsReady(): boolean {
  return isReady;
}

/** SDK 초기화 완료 시 호출되는 콜백. 이미 ready면 즉시 실행. unsubscribe 반환. */
export function onAdsReady(listener: () => void): () => void {
  if (isReady) {
    listener();
    return (): void => undefined;
  }
  readyListeners.push(listener);
  return (): void => {
    const idx = readyListeners.indexOf(listener);
    if (idx >= 0) readyListeners.splice(idx, 1);
  };
}

function markReady(): void {
  isReady = true;
  while (readyListeners.length > 0) {
    const fn = readyListeners.shift();
    try {
      fn?.();
    } catch {
      // 한 listener 에러로 init 실패 막기
    }
  }
}

/**
 * 표준 광고 초기화. `_layout.tsx` (또는 root provider) 에서 1회 await.
 *
 * Expo Go에서는 native 모듈 부재로 no-op (ready=true 처리해 placeholder 광고만 렌더).
 * 모든 단계가 try/catch 로 보호되어 production crash 방지.
 */
export async function initializeAdsWithConsent(): Promise<IAdConsentResult> {
  // Expo Go 등 native 모듈 부재 환경: no-op but ready=true 처리
  if (env.IS_EXPO_GO) {
    markReady();
    return {
      umpStatus: AdsConsentStatus.UNKNOWN,
      canRequestAds: false,
      attStatus: 'unavailable',
    };
  }

  if (consentPromise) return consentPromise;

  consentPromise = (async (): Promise<IAdConsentResult> => {
    let umpStatus: AdsConsentStatus = AdsConsentStatus.UNKNOWN;
    let canRequestAds = false;
    let attStatus: IAdConsentResult['attStatus'] = 'unavailable';

    // ── 1) UMP (GDPR) consent ────────────────────────────────────────────
    try {
      const info = await AdsConsent.requestInfoUpdate();
      umpStatus = info.status;
      canRequestAds = info.canRequestAds ?? false;
      if (info.isConsentFormAvailable && info.status === AdsConsentStatus.REQUIRED) {
        const formResult = await AdsConsent.loadAndShowConsentFormIfRequired();
        umpStatus = formResult.status;
        canRequestAds = formResult.canRequestAds ?? canRequestAds;
      }
    } catch (error) {
      if (__DEV__) {
        console.warn('[ads] UMP consent flow failed:', error);
      }
    }

    // ── 2) (iOS) ATT prompt — UMP 폼 닫힌 직후 ──────────────────────────
    if (Platform.OS === 'ios') {
      // UMP modal → ATT alert 사이에 작은 gap 확보 + app state=active 보장
      await new Promise<void>((resolve) => setTimeout(resolve, 400));
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

    // ── 3) SDK 초기화 + request configuration ────────────────────────────
    try {
      await mobileAds().setRequestConfiguration({
        maxAdContentRating: MaxAdContentRating.PG,
        tagForChildDirectedTreatment: false,
        tagForUnderAgeOfConsent: false,
      });
    } catch {
      // setRequestConfiguration 실패해도 초기화는 진행
    }

    try {
      await mobileAds().initialize();
    } catch (err) {
      if (__DEV__) {
        console.warn('[ads] mobileAds().initialize() failed:', err);
      }
    }

    markReady();
    return { umpStatus, canRequestAds, attStatus };
  })();

  return consentPromise;
}

/**
 * 사용자가 추후 동의를 변경하도록 "설정 > 광고 개인정보 설정" 같은 곳에서 호출.
 * `privacyOptionsRequirementStatus: REQUIRED` 인 경우에만 의미 있음.
 */
export async function showAdsConsentForm(): Promise<void> {
  if (env.IS_EXPO_GO) return;
  try {
    await AdsConsent.showForm();
  } catch (err) {
    if (__DEV__) {
      console.warn('[ads] showForm failed:', err);
    }
  }
}
