import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import dayjs from 'dayjs';
import { ADS_CONFIG } from '@/shared/config';
import type { IAdState, IPersistedAdData } from '../types';

// Device-local calendar day — daily caps must reset at local midnight, not UTC.
function getTodayDate(): string {
  return dayjs().format('YYYY-MM-DD');
}

function getDefaultPersistedData(): IPersistedAdData {
  return {
    actionCount: 0,
    lastInterstitialTime: 0,
    interstitialsToday: 0,
    lastDailyResetDate: getTodayDate(),
    lastFullScreenAdTime: 0,
    appStartTime: Date.now(),
  };
}

async function persistAdState(state: IAdState): Promise<void> {
  // Writing before hydration would overwrite the stored daily counters with defaults.
  if (!state.isHydrated) return;
  const data: IPersistedAdData = {
    actionCount: state.actionCount,
    lastInterstitialTime: state.lastInterstitialTime,
    interstitialsToday: state.interstitialsToday,
    lastDailyResetDate: state.lastDailyResetDate,
    lastFullScreenAdTime: state.lastFullScreenAdTime,
    appStartTime: state.appStartTime,
  };
  try {
    await AsyncStorage.setItem(ADS_CONFIG.STORAGE_KEYS.AD_STATE, JSON.stringify(data));
  } catch {
    // Storage write failure is non-critical
  }
}

export const useAdStore = create<IAdState>((set, get) => ({
  ...getDefaultPersistedData(),
  isHydrated: false,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(ADS_CONFIG.STORAGE_KEYS.AD_STATE);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<IPersistedAdData>;
        const today = getTodayDate();
        const needsReset = parsed.lastDailyResetDate !== today;

        set({
          actionCount: needsReset ? 0 : (parsed.actionCount ?? 0),
          lastInterstitialTime: needsReset ? 0 : (parsed.lastInterstitialTime ?? 0),
          interstitialsToday: needsReset ? 0 : (parsed.interstitialsToday ?? 0),
          lastDailyResetDate: today,
          lastFullScreenAdTime: parsed.lastFullScreenAdTime ?? 0,
          appStartTime: Date.now(), // always fresh on app start
          isHydrated: true,
        });
      } else {
        set({ isHydrated: true, appStartTime: Date.now() });
      }
    } catch {
      set({ isHydrated: true, appStartTime: Date.now() });
    }
  },

  incrementAction: () => {
    set((s) => ({ actionCount: s.actionCount + 1 }));
    persistAdState(get());
  },

  // Called when an interstitial actually opened (AdEventType.OPENED), not on show().
  recordInterstitial: () => {
    get().checkDailyReset();
    set((s) => ({
      lastInterstitialTime: Date.now(),
      interstitialsToday: s.interstitialsToday + 1,
      actionCount: 0,
    }));
    persistAdState(get());
  },

  recordFullScreenClosed: () => {
    set({ lastFullScreenAdTime: Date.now() });
    persistAdState(get());
  },

  // Shared by every full-screen format so ads never chain back-to-back.
  canShowFullScreen: () => {
    const { isHydrated, lastFullScreenAdTime } = get();
    return isHydrated && Date.now() - lastFullScreenAdTime >= ADS_CONFIG.FULLSCREEN_COOLDOWN_MS;
  },

  // Pure (safe to call during render). The app can stay open across midnight without a
  // launch/foreground event, so a stale day counts as 0 shown; the stored reset happens
  // in checkDailyReset (foreground / recordInterstitial).
  canShowInterstitial: () => {
    const { actionCount, lastInterstitialTime, interstitialsToday, lastDailyResetDate, appStartTime } =
      get();
    const shownToday = lastDailyResetDate === getTodayDate() ? interstitialsToday : 0;
    const now = Date.now();

    if (!get().canShowFullScreen()) return false;
    if (now - appStartTime < ADS_CONFIG.FIRST_AD_DELAY_MS) return false;
    if (actionCount < ADS_CONFIG.INTERSTITIAL_INTERVAL) return false;
    if (now - lastInterstitialTime < ADS_CONFIG.INTERSTITIAL_COOLDOWN_MS) return false;
    if (shownToday >= ADS_CONFIG.MAX_INTERSTITIALS_PER_DAY) return false;

    return true;
  },

  checkDailyReset: () => {
    const today = getTodayDate();
    if (get().lastDailyResetDate === today) return;
    set({
      interstitialsToday: 0,
      lastDailyResetDate: today,
      actionCount: 0,
      lastInterstitialTime: 0,
    });
    persistAdState(get());
  },

  resetDaily: () => {
    set({ interstitialsToday: 0, lastDailyResetDate: getTodayDate() });
    persistAdState(get());
  },
}));
