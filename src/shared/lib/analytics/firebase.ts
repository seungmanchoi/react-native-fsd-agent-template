import analyticsModule from '@react-native-firebase/analytics';
import type { TAnalyticsParams } from './events';
import type { IAnalyticsAdapter } from './types';

function sanitize(
  props?: TAnalyticsParams,
): Record<string, string | number | boolean> | undefined {
  if (!props) return undefined;
  const out: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(props)) {
    if (v === null || v === undefined) continue;
    out[k] = v;
  }
  return out;
}

export const firebaseAnalytics: IAnalyticsAdapter = {
  async init() {
    await analyticsModule().setAnalyticsCollectionEnabled(true);
  },
  setUserId(userId) {
    void analyticsModule().setUserId(userId);
  },
  setUserProperty(key, value) {
    void analyticsModule().setUserProperty(key, value);
  },
  track(event, props) {
    void analyticsModule().logEvent(event, sanitize(props));
  },
  screen(name, screenClass) {
    void analyticsModule().logScreenView({
      screen_name: name,
      screen_class: screenClass ?? name,
    });
  },
};
