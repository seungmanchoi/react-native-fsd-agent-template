import { create } from 'zustand';
import { ADS_CONFIG } from '@/shared/config';
import type { IAdState } from '../types';

export const useAdStore = create<IAdState>((set, get) => ({
  actionCount: 0,
  lastInterstitialTime: 0,
  interstitialsToday: 0,
  appStartTime: Date.now(),

  incrementAction: () => set((s) => ({ actionCount: s.actionCount + 1 })),

  recordInterstitial: () =>
    set((s) => ({
      lastInterstitialTime: Date.now(),
      interstitialsToday: s.interstitialsToday + 1,
      actionCount: 0,
    })),

  canShowInterstitial: () => {
    const { actionCount, lastInterstitialTime, interstitialsToday, appStartTime } = get();
    const now = Date.now();

    if (now - appStartTime < ADS_CONFIG.FIRST_AD_DELAY_MS) return false;
    if (actionCount < ADS_CONFIG.INTERSTITIAL_INTERVAL) return false;
    if (now - lastInterstitialTime < ADS_CONFIG.INTERSTITIAL_COOLDOWN_MS) return false;
    if (interstitialsToday >= ADS_CONFIG.MAX_INTERSTITIALS_PER_DAY) return false;

    return true;
  },

  resetDaily: () => set({ interstitialsToday: 0 }),
}));
