export interface IAdState {
  actionCount: number;
  lastInterstitialTime: number;
  interstitialsToday: number;
  appStartTime: number;
  incrementAction: () => void;
  recordInterstitial: () => void;
  canShowInterstitial: () => boolean;
  resetDaily: () => void;
}
