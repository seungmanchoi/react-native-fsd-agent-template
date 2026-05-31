import type { IAnalyticsAdapter } from './types';

export const noopAnalytics: IAnalyticsAdapter = {
  init: () => undefined,
  setUserId: () => undefined,
  setUserProperty: () => undefined,
  track: (event, props) => {
    if (__DEV__) {
      console.log('[analytics:dev]', event, props ?? {});
    }
  },
  screen: (name) => {
    if (__DEV__) {
      console.log('[analytics:dev] screen', name);
    }
  },
};
