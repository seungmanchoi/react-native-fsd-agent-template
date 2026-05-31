import type { TAnalyticsParams } from './events';

export interface IAnalyticsAdapter {
  init: () => Promise<void> | void;
  setUserId: (userId: string | null) => void;
  setUserProperty: (key: string, value: string | null) => void;
  track: (event: string, props?: TAnalyticsParams) => void;
  screen: (name: string, screenClass?: string) => void;
}
