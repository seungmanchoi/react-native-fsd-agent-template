import { useRef, useState } from 'react';
import { Platform, View } from 'react-native';
import { BannerAd, BannerAdSize, useForeground } from 'react-native-google-mobile-ads';
import { useAdsReady } from '../hooks/useAdsReady';

interface IAdBannerProps {
  unitId: string;
}

/**
 * Anchored adaptive banner. Renders nothing until consent + SDK init allow ads,
 * and collapses (no empty slot) when the first load fails; the next foreground retries.
 * A failed auto-refresh keeps the previous creative on screen.
 */
export function AdBanner({ unitId }: IAdBannerProps): React.JSX.Element | null {
  const adsReady = useAdsReady();
  const [failed, setFailed] = useState(false);
  const bannerRef = useRef<BannerAd>(null);
  const hasLoadedRef = useRef(false);

  useForeground(() => {
    if (failed) {
      setFailed(false); // remount → fresh request
    } else if (Platform.OS === 'ios') {
      // iOS banners stop refreshing while backgrounded — reload on return.
      bannerRef.current?.load();
    }
  });

  if (!adsReady || failed) return null;

  return (
    <View className="items-center">
      <BannerAd
        ref={bannerRef}
        unitId={unitId}
        size={BannerAdSize.LARGE_ANCHORED_ADAPTIVE_BANNER}
        onAdLoaded={() => {
          hasLoadedRef.current = true;
        }}
        onAdFailedToLoad={() => {
          if (!hasLoadedRef.current) setFailed(true);
        }}
      />
    </View>
  );
}
