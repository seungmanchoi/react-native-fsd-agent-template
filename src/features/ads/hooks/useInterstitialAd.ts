import { useEffect, useCallback, useRef } from 'react';
import {
  InterstitialAd,
  AdEventType,
} from 'react-native-google-mobile-ads';
import { AdUnitIds } from '@/shared/config';
import { useAdStore } from '../store';

export function useInterstitialAd() {
  const adRef = useRef<InterstitialAd | null>(null);
  const isLoadedRef = useRef(false);
  const { canShowInterstitial, recordInterstitial, incrementAction } = useAdStore();

  useEffect(() => {
    const ad = InterstitialAd.createForAdRequest(AdUnitIds.INTERSTITIAL_AFTER_ACTION);

    const unsubLoaded = ad.addAdEventListener(AdEventType.LOADED, () => {
      isLoadedRef.current = true;
    });

    const unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
      isLoadedRef.current = false;
      ad.load();
    });

    ad.load();
    adRef.current = ad;

    return () => {
      unsubLoaded();
      unsubClosed();
    };
  }, []);

  const showAfterAction = useCallback(() => {
    incrementAction();

    if (canShowInterstitial() && isLoadedRef.current && adRef.current) {
      adRef.current.show();
      recordInterstitial();
    }
  }, [canShowInterstitial, recordInterstitial, incrementAction]);

  return { showAfterAction };
}
