import { expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  appStateListeners: new Set<(state: string) => void>(),
  gatherConsent: vi.fn(),
  getConsentInfo: vi.fn(),
}));

vi.mock('react-native', () => ({
  Platform: { OS: 'android' },
  AppState: {
    currentState: 'active',
    addEventListener: (_: string, listener: (state: string) => void) => {
      mocks.appStateListeners.add(listener);
      return { remove: () => mocks.appStateListeners.delete(listener) };
    },
  },
}));
vi.mock('react-native-google-mobile-ads', () => ({
  default: () => ({ setRequestConfiguration: async () => undefined, initialize: async () => [] }),
  AdsConsent: { gatherConsent: mocks.gatherConsent, getConsentInfo: mocks.getConsentInfo },
  AdsConsentPrivacyOptionsRequirementStatus: { REQUIRED: 'REQUIRED', UNKNOWN: 'UNKNOWN' },
  AdsConsentStatus: { UNKNOWN: 'UNKNOWN', OBTAINED: 'OBTAINED' },
  AgeRestrictedTreatment: { UNSPECIFIED: 'UNSPECIFIED' },
  MaxAdContentRating: { PG: 'PG' },
}));
vi.mock('expo-tracking-transparency', () => ({}));
vi.mock('@shared/config', () => ({ env: { IS_EXPO_GO: false }, TEST_DEVICE_IDS: [] }));
vi.mock('@shared/lib/analytics', () => ({ setUserProperty: async () => undefined }));

const emitAppState = (state: string): void => mocks.appStateListeners.forEach((fn) => fn(state));

test('a consent retry after an offline first launch re-publishes privacyOptionsRequired', async () => {
  vi.stubGlobal('__DEV__', false);
  mocks.gatherConsent.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({
    status: 'OBTAINED',
    canRequestAds: true,
    privacyOptionsRequirementStatus: 'REQUIRED',
  });
  mocks.getConsentInfo.mockResolvedValue({
    status: 'UNKNOWN',
    canRequestAds: false,
    privacyOptionsRequirementStatus: 'UNKNOWN',
  });
  const { initializeAdsWithConsent, isAdsReady, onAdConsentResult } = await import('./consent');

  const seen: boolean[] = [];
  onAdConsentResult((result) => seen.push(result.privacyOptionsRequired));
  await initializeAdsWithConsent();
  expect(seen).toEqual([false]);
  expect(isAdsReady()).toBe(false);

  emitAppState('background');
  emitAppState('active');

  await vi.waitFor(() => expect(seen).toEqual([false, true]));
  expect(isAdsReady()).toBe(true);
});
