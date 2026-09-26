import { useEffect, useCallback, useRef, useState } from 'react';
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
  // Bumped to replace an instance whose show() got stuck (see presentFullScreenAd).
  const [generation, setGeneration] = useState(0);

  useEffect(() => {
    if (!adsReady) return;
    const ad = InterstitialAd.createForAdRequest(AdUnitIds.INTERSTITIAL_AFTER_ACTION);
    // Count the impression only once the ad really opened.
    ad.addAdEventListener(AdEventType.OPENED, () => {
      useAdStore.getState().recordInterstitial();
    });
    const release = keepLoaded(ad);
    adRef.current = ad;

    return () => {
      adRef.current = null;
      release();
    };
  }, [adsReady, generation]);

  const showAfterAction = useCallback(() => {
    const adStore = useAdStore.getState();
    adStore.incrementAction();

    // Skip interstitial if user has active premium
    const premium = usePremiumStore.getState();
    if (!premium.isHydrated || premium.isPremiumActive()) return;

    const ad = adRef.current;
    if (ad && adStore.canShowInterstitial()) {
      presentFullScreenAd(ad, () => setGeneration((g) => g + 1));
    }
  }, []);

  return { showAfterAction };
}
