import { useEffect, useCallback, useRef, useState } from 'react';
import {
  RewardedAd,
  RewardedAdEventType,
  AdEventType,
} from 'react-native-google-mobile-ads';
import { AdUnitIds } from '@/shared/config';

export function useRewardedAd(onRewarded: () => void) {
  const adRef = useRef<RewardedAd | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const onRewardedRef = useRef(onRewarded);
  onRewardedRef.current = onRewarded;

  useEffect(() => {
    const ad = RewardedAd.createForAdRequest(AdUnitIds.REWARDED_PREMIUM);

    const unsubLoaded = ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
      setIsLoaded(true);
    });

    const unsubEarned = ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
      onRewardedRef.current();
    });

    const unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
      setIsLoaded(false);
      ad.load();
    });

    ad.load();
    adRef.current = ad;

    return () => {
      unsubLoaded();
      unsubEarned();
      unsubClosed();
    };
  }, []);

  const show = useCallback(() => {
    if (isLoaded && adRef.current) {
      adRef.current.show();
    }
  }, [isLoaded]);

  return { show, isLoaded };
}
