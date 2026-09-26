import { afterEach, describe, expect, test, vi } from 'vitest';

async function loadEnv(extra: Record<string, unknown>, isDevBundle: boolean) {
  vi.resetModules();
  vi.stubGlobal('__DEV__', isDevBundle);
  vi.doMock('expo-constants', () => ({
    default: { appOwnership: 'standalone', expoConfig: { extra } },
  }));
  return import('./env');
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('env config', () => {
  test('normalizes API URLs and builds endpoint paths', async () => {
    const { buildApiUrl, env } = await loadEnv(
      { apiUrl: 'https://api.example.com', appEnv: 'production' },
      true,
    );

    expect(env.API_URL).toBe('https://api.example.com/api/v1');
    expect(env.IS_PROD).toBe(true);
    expect(buildApiUrl('/users')).toBe('https://api.example.com/api/v1/users');
    expect(buildApiUrl('users')).toBe('https://api.example.com/api/v1/users');
  });

  test('a release bundle without APP_ENV is production (local fastlane builds)', async () => {
    const { env } = await loadEnv({}, false);

    expect(env.APP_ENV).toBe('production');
    expect(env.IS_PROD).toBe(true);
  });

  test('a dev bundle without APP_ENV is development', async () => {
    const { env } = await loadEnv({}, true);

    expect(env.IS_DEV).toBe(true);
    expect(env.IS_PROD).toBe(false);
  });

  test('preview builds are neither dev nor prod', async () => {
    const { env } = await loadEnv({ appEnv: 'preview' }, false);

    expect(env.IS_DEV).toBe(false);
    expect(env.IS_PROD).toBe(false);
  });
});
