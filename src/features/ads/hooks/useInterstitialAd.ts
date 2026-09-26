import { useEffect, useCallback, useRef } from 'react';
import { InterstitialAd, AdEventType } from 'react-native-google-mobile-ads';
import { AdUnitIds } from '@/shared/config';
import { keepLoaded, presentFullScreenAd } from '../lib/fullscreen';
import { useAdStore } from '../store/ad.store';
import { usePremiumStore } from '../store/premium.store';
import { useAdsReady } from './useAdsReady';

/**
 * Hook for interstitial ads with cooldown + premium skip.
 *
 * - Loads only after consent + SDK init (useAdsReady).
 * - Skips ad display entirely while premium is active.
 * - Still counts actions so ads resume immediately when premium expires.
 * - Respects all cooldown/daily limits from useAdStore (shared full-screen cooldown included).
 */
export function useInterstitialAd(): { showAfterAction: () => void } {
  const adsReady = useAdsReady();
  const adRef = useRef<InterstitialAd | null>(null);

  useEffect(() => {
    if (!adsReady) return;
    const ad = InterstitialAd.createForAdRequest(AdUnitIds.INTERSTITIAL_AFTER_ACTION);
    // Count the impression only once the ad really opened.
    const unsubOpened = ad.addAdEventListener(AdEventType.OPENED, () => {
      useAdStore.getState().recordInterstitial();
    });
    const release = keepLoaded(ad);
    adRef.current = ad;

    return () => {
      unsubOpened();
      release();
      adRef.current = null;
    };
  }, [adsReady]);

  const showAfterAction = useCallback(() => {
    const adStore = useAdStore.getState();
    adStore.incrementAction();

    // Skip interstitial if user has active premium
    const premium = usePremiumStore.getState();
    if (!premium.isHydrated || premium.isPremiumActive()) return;

    const ad = adRef.current;
    if (ad && adStore.canShowInterstitial()) {
      presentFullScreenAd(ad);
    }
  }, []);

  return { showAfterAction };
}
