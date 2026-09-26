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
 * retries failed loads with backoff (ADS_CONFIG.LOAD_RETRY_DELAYS_MS — no request storms)
 * and starts over whenever the app returns to the foreground.
 *
 * Cleanup cancels retries and destroys the ad (which drops every listener). If the ad is
 * on screen, destroying is deferred to its CLOSED / show-ERROR event so the reward, the
 * shared cooldown and the presenting lock still resolve after the owner unmounted.
 */
export function keepLoaded(ad: TFullScreenAd): () => void {
  let attempt = 0;
  let retryTimer: ReturnType<typeof setTimeout> | undefined;
  let disposed = false;

  const reloadOrDispose = (): void => {
    if (disposed) ad.destroy();
    else ad.load();
  };

  ad.addAdEventListener(AdEventType.ERROR, (error) => {
    if (error.phase === 'show') {
      // Presentation failed: this instance is spent, fetch a fresh one right away.
      release(ad);
      reloadOrDispose();
      return;
    }
    const delay = ADS_CONFIG.LOAD_RETRY_DELAYS_MS[attempt];
    attempt += 1;
    if (delay !== undefined) {
      retryTimer = setTimeout(() => ad.load(), delay);
    }
  });
  ad.addAdEventListener(AdEventType.CLOSED, () => {
    release(ad);
    attempt = 0;
    useAdStore.getState().recordFullScreenClosed();
    reloadOrDispose();
  });
  // Offline starts and no-fill streaks exhaust the backoff; try again when the user is back.
  const appState = AppState.addEventListener('change', (next) => {
    if (next !== 'active' || ad.loaded) return;
    attempt = 0;
    clearTimeout(retryTimer);
    ad.load(); // no-op while a load is already in flight
  });

  ad.load();

  return () => {
    clearTimeout(retryTimer);
    appState.remove();
    if (presentingAd === ad) {
      disposed = true;
      return;
    }
    ad.destroy();
  };
}

/**
 * Shows `ad` if it is loaded, the app is in the foreground and no other full-screen
 * ad is up. Frequency gates (cooldowns, caps, premium) stay with the caller.
 *
 * A normal presentation failure arrives as an ERROR (phase 'show') handled by keepLoaded.
 * `onStuck` runs when show() is rejected without that event (iOS: no view controller,
 * Android: no activity): the instance keeps a pending show, can never show or reload
 * again, and must be replaced by its owner.
 */
export function presentFullScreenAd(ad: TFullScreenAd, onStuck?: () => void): boolean {
  if (presentingAd || !ad.loaded || AppState.currentState !== 'active') return false;
  presentingAd = ad;
  try {
    ad.show().catch(() => {
      release(ad);
      if (ad.loaded) onStuck?.();
    });
  } catch {
    release(ad);
    return false;
  }
  return true;
}
