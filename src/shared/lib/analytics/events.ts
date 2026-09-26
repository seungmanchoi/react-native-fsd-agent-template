// Domain-specific event names. Keep names <= 40 chars, [A-Za-z0-9_] only.
// Replace / extend with your app's events. Firebase reserves names starting
// with `firebase_`, `google_`, `ga_`. Screen views go through logScreenView().
export const EAnalyticsEvent = {
  APP_OPEN: 'app_open',
  REWARDED_AD_COMPLETED: 'rewarded_ad_completed',
  INTERSTITIAL_AD_SHOWN: 'interstitial_ad_shown',
  REQUEST_STORE_REVIEW: 'request_store_review',
} as const;

export type TAnalyticsEvent =
  (typeof EAnalyticsEvent)[keyof typeof EAnalyticsEvent];

export type TAnalyticsParams = Record<
  string,
  string | number | boolean | null | undefined
>;
