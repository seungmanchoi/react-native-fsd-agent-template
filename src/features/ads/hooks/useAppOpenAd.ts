import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import {
  AppOpenAd,
  AdEventType,
  AdStalenessGuidanceMillis,
} from 'react-native-google-mobile-ads';
import { AdUnitIds, ADS_CONFIG } from '@/shared/config';
import { isPresentingFullScreenAd, keepLoaded, presentFullScreenAd } from '../lib/fullscreen';
import { useAdStore } from '../store/ad.store';
import { usePremiumStore } from '../store/premium.store';
import { useAdsReady } from './useAdsReady';

/**
 * Hook for App Open ads shown when the app returns to the foreground.
 *
 * - Only after a real background → active transition (not `inactive`, which the
 *   ATT alert and notification center cause) of at least APP_OPEN_MIN_BACKGROUND_MS.
 * - Never right after another full-screen ad (Android reports the ad activity as
 *   backgrounding): presenting lock + shared cooldown.
 * - Skips while premium is active; replaces ads older than Google's 4h guidance.
 */
export function useAppOpenAd(): void {
  const adsReady = useAdsReady();
  const adRef = useRef<AppOpenAd | null>(null);
  const loadedAtRef = useRef(0);
  // Bumped to replace a stale or stuck ad (a loaded instance can't be reloaded).
  const [generation, setGeneration] = useState(0);

  useEffect(() => {
    if (!adsReady) return;
    const ad = AppOpenAd.createForAdRequest(AdUnitIds.APP_OPEN);
    ad.addAdEventListener(AdEventType.LOADED, () => {
      loadedAtRef.current = Date.now();
    });
    const release = keepLoaded(ad);
    adRef.current = ad;

    return () => {
      adRef.current = null;
      release();
    };
  }, [adsReady, generation]);

  useEffect(() => {
    let backgroundAt = 0;
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'background') {
        // A full-screen ad activity (Android) is not the user leaving the app.
        if (!isPresentingFullScreenAd()) backgroundAt = Date.now();
        return;
      }
      if (next !== 'active' || backgroundAt === 0) return;
      const awayMs = Date.now() - backgroundAt;
      backgroundAt = 0;

      const ad = adRef.current;
      if (!ad?.loaded || awayMs < ADS_CONFIG.APP_OPEN_MIN_BACKGROUND_MS) return;
      if (Date.now() - loadedAtRef.current > AdStalenessGuidanceMillis.APP_OPEN) {
        setGeneration((g) => g + 1);
        return;
      }
      const premium = usePremiumStore.getState();
      if (!premium.isHydrated || premium.isPremiumActive()) return;
      if (!useAdStore.getState().canShowFullScreen()) return;
      presentFullScreenAd(ad, () => setGeneration((g) => g + 1));
    });
    return () => subscription.remove();
  }, []);
}
