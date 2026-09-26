import Constants from 'expo-constants';
import { env } from '@/shared/config';
import {
  EAnalyticsEvent,
  type TAnalyticsEvent,
  type TAnalyticsParams,
} from './events';
import { noopAnalytics } from './noop';
import type { IAnalyticsAdapter } from './types';

function resolveAdapter(): IAnalyticsAdapter {
  // Expo Go does not bundle native Firebase — fall back to noop to avoid crash.
  if (Constants.appOwnership === 'expo') return noopAnalytics;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('./firebase') as {
      firebaseAnalytics: IAnalyticsAdapter;
    };
    return mod.firebaseAnalytics;
  } catch (error) {
    if (env.DEBUG) {
      console.warn('[analytics] Firebase adapter unavailable:', error);
    }
    return noopAnalytics;
  }
}

const adapter: IAnalyticsAdapter = resolveAdapter();

function isValidEventName(name: string): boolean {
  return /^[A-Za-z][A-Za-z0-9_]{0,39}$/.test(name);
}

export async function initAnalytics(): Promise<void> {
  try {
    await adapter.init();
    adapter.setUserProperty('app_version', env.APP_VERSION);
  } catch (error) {
    if (env.DEBUG) {
      console.warn('[analytics] init failed:', error);
    }
  }
}

export async function logEvent(
  name: TAnalyticsEvent,
  params?: TAnalyticsParams,
): Promise<void> {
  if (!isValidEventName(name)) {
    if (env.DEBUG) {
      console.warn('[analytics] invalid event name:', name);
    }
    return;
  }
  try {
    adapter.track(name, params);
  } catch (error) {
    if (env.DEBUG) {
      console.warn('[analytics] capture failed:', name, error);
    }
  }
}

export async function logScreenView(
  screenName: string,
  screenClass?: string,
): Promise<void> {
  try {
    adapter.screen(screenName, screenClass);
  } catch (error) {
    if (env.DEBUG) {
      console.warn('[analytics] screen failed:', screenName, error);
    }
  }
}

export async function setUserProperty(
  name: string,
  value: string | null,
): Promise<void> {
  try {
    adapter.setUserProperty(name, value);
  } catch (error) {
    if (env.DEBUG) {
      console.warn('[analytics] setUserProperty failed:', name, error);
    }
  }
}

/** Non-fatal error report (Crashlytics). Fatal JS errors are captured by Crashlytics itself. */
export function recordError(error: unknown): void {
  try {
    adapter.recordError(error instanceof Error ? error : new Error(String(error)));
  } catch (e) {
    if (env.DEBUG) {
      console.warn('[analytics] recordError failed:', e);
    }
  }
}

export { EAnalyticsEvent };
export type { TAnalyticsEvent, TAnalyticsParams };
