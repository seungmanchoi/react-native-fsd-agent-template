import {
  getAnalytics,
  logEvent,
  setAnalyticsCollectionEnabled,
  setUserId,
  setUserProperty,
} from '@react-native-firebase/analytics';
import {
  getCrashlytics,
  recordError as crashlyticsRecordError,
  setCrashlyticsCollectionEnabled,
} from '@react-native-firebase/crashlytics';
import { env } from '@/shared/config';
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

// RN Firebase v26 modular API (the namespaced `analytics()` API was removed).
export const firebaseAnalytics: IAnalyticsAdapter = {
  async init() {
    // Only production builds report — dev/preview traffic must not pollute KPIs.
    await Promise.all([
      setAnalyticsCollectionEnabled(getAnalytics(), env.IS_PROD),
      setCrashlyticsCollectionEnabled(getCrashlytics(), env.IS_PROD),
    ]);
  },
  setUserId(userId) {
    void setUserId(getAnalytics(), userId);
  },
  setUserProperty(key, value) {
    void setUserProperty(getAnalytics(), key, value);
  },
  track(event, props) {
    logEvent(getAnalytics(), event, sanitize(props));
  },
  screen(name, screenClass) {
    logEvent(getAnalytics(), 'screen_view', {
      screen_name: name,
      screen_class: screenClass ?? name,
    });
  },
  recordError(error) {
    crashlyticsRecordError(getCrashlytics(), error);
  },
};
