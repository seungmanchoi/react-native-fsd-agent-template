export interface IPersistedAdData {
  actionCount: number;
  lastInterstitialTime: number;
  interstitialsToday: number;
  lastDailyResetDate: string; // YYYY-MM-DD, device-local (dayjs)
  /** When the last full-screen ad (any format) closed — shared cooldown anchor. */
  lastFullScreenAdTime: number;
  appStartTime: number;
}

export interface IAdState extends IPersistedAdData {
  isHydrated: boolean;
  incrementAction: () => void;
  recordInterstitial: () => void;
  recordFullScreenClosed: () => void;
  canShowFullScreen: () => boolean;
  canShowInterstitial: () => boolean;
  resetDaily: () => void;
  checkDailyReset: () => void;
  hydrate: () => Promise<void>;
}

export interface IPersistedPremiumData {
  premiumExpiryTime: number; // timestamp when premium expires, 0 = not active
  totalRewardsEarned: number;
}

export interface IPremiumState extends IPersistedPremiumData {
  isHydrated: boolean;
  isPremiumActive: () => boolean;
  remainingTimeMs: () => number;
  grantPremium: (durationMs: number) => void;
  expirePremium: () => void;
  checkAndExpire: () => boolean; // returns true if was active and just expired
  hydrate: () => Promise<void>;
  resetAll: () => void;
}

export interface IAdLifecycleState {
  isInitialized: boolean;
  premiumSecondsLeft: number;
}
