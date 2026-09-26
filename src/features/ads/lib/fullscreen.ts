import { AppState } from 'react-native';
import { AdEventType, type InterstitialAd } from 'react-native-google-mobile-ads';
import { ADS_CONFIG } from '@/shared/config';
import { useAdStore } from '../store/ad.store';

/** Interstitial, rewarded and app open ads all share this surface. */
type TFullScreenAd = Pick<InterstitialAd, 'load' | 'show' | 'destroy' | 'loaded' | 'addAdEventListener'>;

// One full-screen ad at a time across every format. Android reports the ad
// activity as a background→active transition, so app-open logic checks this too.
let presentingAd: TFullScreenAd | null = null;

export function isPresentingFullScreenAd(): boolean {
  return presentingAd !== null;
}

function release(ad: TFullScreenAd): void {
  if (presentingAd === ad) presentingAd = null;
}

/**
 * Owns `ad` until the returned cleanup runs: loads it now, reloads after every close,
 * and retries failed loads with backoff (ADS_CONFIG.LOAD_RETRY_DELAYS_MS, then stops
 * until the next close — no request storms). The cleanup cancels retries and destroys the ad.
 */
export function keepLoaded(ad: TFullScreenAd): () => void {
  let attempt = 0;
  let retryTimer: ReturnType<typeof setTimeout> | undefined;

  const unsubscribers = [
    ad.addAdEventListener(AdEventType.ERROR, (error) => {
      if (error.phase === 'show') {
        // Presentation failed: this instance is spent, fetch a fresh one right away.
        release(ad);
        ad.load();
        return;
      }
      const delay = ADS_CONFIG.LOAD_RETRY_DELAYS_MS[attempt];
      attempt += 1;
      if (delay !== undefined) {
        retryTimer = setTimeout(() => ad.load(), delay);
      }
    }),
    ad.addAdEventListener(AdEventType.CLOSED, () => {
      release(ad);
      attempt = 0;
      useAdStore.getState().recordFullScreenClosed();
      ad.load();
    }),
  ];

  ad.load();

  return () => {
    clearTimeout(retryTimer);
    unsubscribers.forEach((unsubscribe) => unsubscribe());
    // A destroyed ad never delivers CLOSED — don't leave the lock held.
    release(ad);
    ad.destroy();
  };
}

/**
 * Shows `ad` if it is loaded, the app is in the foreground and no other full-screen
 * ad is up. Frequency gates (cooldowns, caps, premium) stay with the caller.
 * A failed presentation arrives as an ERROR (phase 'show') handled by keepLoaded.
 */
export function presentFullScreenAd(ad: TFullScreenAd): boolean {
  if (presentingAd || !ad.loaded || AppState.currentState !== 'active') return false;
  presentingAd = ad;
  try {
    ad.show().catch(() => release(ad));
  } catch {
    release(ad);
    return false;
  }
  return true;
}
