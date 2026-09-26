import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios';

const secureStore = new Map<string, string>();
// Lets a test hold clearTokens() mid-flight.
const deleteControl: { gate: Promise<void> | null; started: boolean } = { gate: null, started: false };

vi.mock('expo-secure-store', () => ({
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
  setItemAsync: async (key: string, value: string) => void secureStore.set(key, value),
  getItemAsync: async (key: string) => secureStore.get(key) ?? null,
  deleteItemAsync: async (key: string) => {
    deleteControl.started = true;
    if (deleteControl.gate) await deleteControl.gate;
    secureStore.delete(key);
  },
}));

vi.mock('@shared/config', () => ({
  env: { API_URL: 'https://api.test/api/v1', IS_DEV: false, DEBUG: false },
}));

type TRespond = (config: InternalAxiosRequestConfig) => { status: number; data?: unknown };

async function setup(respond: TRespond) {
  vi.resetModules();
  vi.stubGlobal('__DEV__', false);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  const axios = (await import('axios')).default;
  const adapter: AxiosAdapter = async (config) => {
    const { status, data } = respond(config);
    const response = { data, status, statusText: '', headers: {}, config };
    if (status >= 400) {
      throw new axios.AxiosError('failed', undefined, config, undefined, response);
    }
    return response;
  };
  axios.defaults.adapter = adapter;
  return import('./client');
}

const bearer = (config: InternalAxiosRequestConfig) => String(config.headers.Authorization ?? '');

beforeEach(() => {
  deleteControl.gate = null;
  deleteControl.started = false;
  secureStore.clear();
  secureStore.set('accessToken', 'old');
  secureStore.set('refreshToken', 'refresh-1');
});

describe('apiClient token refresh', () => {
  test('concurrent 401s share one refresh and retry with the new token', async () => {
    let refreshCalls = 0;
    const { apiClient } = await setup((config) => {
      if (config.url?.endsWith('/auth/refresh')) {
        refreshCalls += 1;
        return { status: 200, data: { accessToken: 'new', refreshToken: 'refresh-2' } };
      }
      return bearer(config) === 'Bearer new' ? { status: 200, data: 'ok' } : { status: 401 };
    });

    const results = await Promise.all([apiClient.get('/a'), apiClient.get('/b')]);

    expect(results.map((r) => r.data)).toEqual(['ok', 'ok']);
    expect(refreshCalls).toBe(1);
    expect(secureStore.get('refreshToken')).toBe('refresh-2');
  });

  test('a failed refresh rejects every queued request and signals auth failure', async () => {
    // Every call — including /auth/refresh — is rejected.
    const { apiClient, setAuthFailureCallback } = await setup(() => ({ status: 401 }));
    const onFailure = vi.fn();
    setAuthFailureCallback(onFailure);

    const results = await Promise.allSettled([apiClient.get('/a'), apiClient.get('/b')]);

    expect(results.every((r) => r.status === 'rejected')).toBe(true);
    expect(onFailure).toHaveBeenCalledTimes(1);
    expect(secureStore.size).toBe(0);
  });

  test('a network error during refresh keeps the tokens and does not sign the user out', async () => {
    const { apiClient, setAuthFailureCallback } = await setup((config) =>
      config.url?.endsWith('/auth/refresh') ? { status: 503 } : { status: 401 },
    );
    const onFailure = vi.fn();
    setAuthFailureCallback(onFailure);

    const results = await Promise.allSettled([apiClient.get('/a'), apiClient.get('/b')]);

    expect(results.every((r) => r.status === 'rejected')).toBe(true);
    expect(onFailure).not.toHaveBeenCalled();
    expect(secureStore.get('refreshToken')).toBe('refresh-1');
  });

  test('a 401 that queues while a failed refresh is clearing tokens still settles', async () => {
    let openGate: () => void = () => undefined;
    deleteControl.gate = new Promise<void>((resolve) => {
      openGate = resolve;
    });
    const calls: string[] = [];
    const { apiClient } = await setup((config) => {
      calls.push(config.url ?? '');
      return { status: 401 };
    });

    const first = apiClient.get('/a');
    await vi.waitFor(() => expect(deleteControl.started).toBe(true));
    const late = apiClient.get('/b'); // its 401 arrives while clearTokens() is still awaiting
    await vi.waitFor(() => expect(calls).toContain('/b'));
    await new Promise((resolve) => setTimeout(resolve, 0)); // let it reach the refresh queue
    openGate();

    await expect(first).rejects.toThrow('Session expired');
    await expect(late).rejects.toBeDefined();
  }, 2000);

  test('a request that still gets 401 after a refresh is not refreshed again', async () => {
    let refreshCalls = 0;
    const { apiClient } = await setup((config) => {
      if (config.url?.endsWith('/auth/refresh')) {
        refreshCalls += 1;
        return { status: 200, data: { accessToken: 'new', refreshToken: 'refresh-2' } };
      }
      return { status: 401 };
    });

    await expect(apiClient.get('/forbidden')).rejects.toThrow();
    expect(refreshCalls).toBe(1);
  });

  test('without a refresh token the 401 is returned as-is (no auth-failure redirect)', async () => {
    secureStore.delete('refreshToken');
    const { apiClient, setAuthFailureCallback } = await setup(() => ({ status: 401 }));
    const onFailure = vi.fn();
    setAuthFailureCallback(onFailure);

    await expect(apiClient.get('/a')).rejects.toMatchObject({ response: { status: 401 } });
    expect(onFailure).not.toHaveBeenCalled();
  });
});
