import { View } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';

interface IAdBannerProps {
  unitId: string;
}

export function AdBanner({ unitId }: IAdBannerProps): React.JSX.Element {
  return (
    <View className="items-center">
      <BannerAd
        unitId={unitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
      />
    </View>
  );
}
