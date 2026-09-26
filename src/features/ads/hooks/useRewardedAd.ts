import { useEffect, useCallback, useRef, useState } from 'react';
import { RewardedAd, RewardedAdEventType, AdEventType } from 'react-native-google-mobile-ads';
import { AdUnitIds, ADS_CONFIG } from '@/shared/config';
import { keepLoaded, presentFullScreenAd } from '../lib/fullscreen';
import { useAdStore } from '../store/ad.store';
import { usePremiumStore } from '../store/premium.store';
import { useAdsReady } from './useAdsReady';

interface IUseRewardedAdOptions {
  /** Custom duration in ms. Defaults to ADS_CONFIG.REWARDED_PREMIUM_DURATION_MS */
  premiumDurationMs?: number;
  /** Additional callback after reward is earned */
  onRewarded?: () => void;
}

interface IUseRewardedAdReturn {
  /** Returns false when the ad could not be shown (not loaded, cooldown, another ad up). */
  show: () => boolean;
  isLoaded: boolean;
  isPremiumActive: boolean;
  remainingTimeMs: number;
}

/**
 * Hook for rewarded ads that grant timed premium access.
 *
 * On reward: grants premium for the configured duration — only inside
 * EARNED_REWARD, never on show() (AdMob policy).
 * Premium time stacks if already active (extends from current expiry).
 * Premium state persists across app restarts.
 */
export function useRewardedAd(options: IUseRewardedAdOptions = {}): IUseRewardedAdReturn {
  const { premiumDurationMs = ADS_CONFIG.REWARDED_PREMIUM_DURATION_MS, onRewarded } = options;

  const adsReady = useAdsReady();
  const adRef = useRef<RewardedAd | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const onRewardedRef = useRef(onRewarded);
  const premiumDurationRef = useRef(premiumDurationMs);
  useEffect(() => {
    onRewardedRef.current = onRewarded;
    premiumDurationRef.current = premiumDurationMs;
  });

  const isPremiumActive = usePremiumStore((s) => s.isPremiumActive());
  const remainingTimeMs = usePremiumStore((s) => s.remainingTimeMs());

  useEffect(() => {
    if (!adsReady) return;
    const ad = RewardedAd.createForAdRequest(AdUnitIds.REWARDED_PREMIUM);
    const unsubscribers = [
      ad.addAdEventListener(RewardedAdEventType.LOADED, () => setIsLoaded(true)),
      ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
        usePremiumStore.getState().grantPremium(premiumDurationRef.current);
        onRewardedRef.current?.();
      }),
      ad.addAdEventListener(AdEventType.CLOSED, () => setIsLoaded(false)),
      ad.addAdEventListener(AdEventType.ERROR, () => setIsLoaded(false)),
    ];
    const release = keepLoaded(ad);
    adRef.current = ad;

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
      release();
      adRef.current = null;
      setIsLoaded(false);
    };
  }, [adsReady]);

  const show = useCallback((): boolean => {
    const ad = adRef.current;
    if (!ad || !useAdStore.getState().canShowFullScreen()) return false;
    return presentFullScreenAd(ad);
  }, []);

  return { show, isLoaded, isPremiumActive, remainingTimeMs };
}
