import { describe, expect, test, vi } from 'vitest';

vi.mock('expo-constants', () => ({
  default: {
    appOwnership: 'standalone',
    expoConfig: {
      extra: {
        apiUrl: 'https://api.example.com',
        nodeEnv: 'production',
      },
    },
  },
}));

describe('env config', () => {
  test('normalizes API URLs and builds endpoint paths', async () => {
    const { buildApiUrl, env } = await import('./env');

    expect(env.API_URL).toBe('https://api.example.com/api/v1');
    expect(env.IS_PROD).toBe(true);
    expect(buildApiUrl('/users')).toBe('https://api.example.com/api/v1/users');
    expect(buildApiUrl('users')).toBe('https://api.example.com/api/v1/users');
  });
});
