import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosError,
  InternalAxiosRequestConfig,
  isAxiosError,
} from 'axios';
import * as SecureStore from 'expo-secure-store';
import { env } from '@shared/config';

type TAuthFailureCallback = () => void;

let onAuthFailure: TAuthFailureCallback | null = null;

export const setAuthFailureCallback = (callback: TAuthFailureCallback): void => {
  onAuthFailure = callback;
};

const TOKEN_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
} as const;

// Keychain items readable only while unlocked, never restored to another device
// (excluded from iCloud/iTunes backups). CLAUDE.md "Secure Storage".
const SECURE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

// Bumped by every credential write (login, logout). A refresh that started under an
// older session must not write its tokens back or sign the new session out.
let sessionEpoch = 0;

export const tokenManager = {
  setAccessToken: async (token: string): Promise<void> => {
    sessionEpoch += 1;
    await SecureStore.setItemAsync(TOKEN_KEYS.ACCESS_TOKEN, token, SECURE_OPTIONS);
  },

  getAccessToken: async (): Promise<string | null> => {
    return SecureStore.getItemAsync(TOKEN_KEYS.ACCESS_TOKEN, SECURE_OPTIONS);
  },

  setRefreshToken: async (token: string): Promise<void> => {
    sessionEpoch += 1;
    await SecureStore.setItemAsync(TOKEN_KEYS.REFRESH_TOKEN, token, SECURE_OPTIONS);
  },

  getRefreshToken: async (): Promise<string | null> => {
    return SecureStore.getItemAsync(TOKEN_KEYS.REFRESH_TOKEN, SECURE_OPTIONS);
  },

  setTokens: async (accessToken: string, refreshToken: string): Promise<void> => {
    sessionEpoch += 1;
    await Promise.all([
      SecureStore.setItemAsync(TOKEN_KEYS.ACCESS_TOKEN, accessToken, SECURE_OPTIONS),
      SecureStore.setItemAsync(TOKEN_KEYS.REFRESH_TOKEN, refreshToken, SECURE_OPTIONS),
    ]);
  },

  clearTokens: async (): Promise<void> => {
    sessionEpoch += 1;
    await Promise.all([
      SecureStore.deleteItemAsync(TOKEN_KEYS.ACCESS_TOKEN, SECURE_OPTIONS),
      SecureStore.deleteItemAsync(TOKEN_KEYS.REFRESH_TOKEN, SECURE_OPTIONS),
    ]);
  },

  hasTokens: async (): Promise<boolean> => {
    const accessToken = await SecureStore.getItemAsync(TOKEN_KEYS.ACCESS_TOKEN, SECURE_OPTIONS);
    return !!accessToken;
  },
};

type TRetriableRequest = InternalAxiosRequestConfig & { _retry?: boolean };

interface IRefreshWaiter {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}

let isRefreshing = false;
let refreshWaiters: IRefreshWaiter[] = [];

// Every request queued behind a refresh must settle — success or failure.
const settleRefreshWaiters = (token: string | null, error?: unknown): void => {
  const waiters = refreshWaiters;
  refreshWaiters = [];
  waiters.forEach((waiter) => (token ? waiter.resolve(token) : waiter.reject(error)));
};

const PUBLIC_ENDPOINTS = ['/auth/login', '/auth/signup', '/auth/refresh'];

const isPublicEndpoint = (url: string | undefined): boolean => {
  if (!url) return false;
  return PUBLIC_ENDPOINTS.some((endpoint) => url.includes(endpoint));
};

export const apiClient: AxiosInstance = axios.create({
  baseURL: env.API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  async (config) => {
    if (!isPublicEndpoint(config.url)) {
      const token = await tokenManager.getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    if (__DEV__) {
      console.log('[API Request]', config.method?.toUpperCase(), config.url);
    }

    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  },
);

apiClient.interceptors.response.use(
  (response) => {
    if (env.IS_DEV && env.DEBUG) {
      console.log('[API Response]', response.status, response.config.url);
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as TRetriableRequest | undefined;

    if (error.response?.status !== 401) {
      console.error('[API Response Error]', {
        status: error.response?.status,
        url: error.config?.url,
        message: error.message,
      });
    }

    // Public endpoints and requests already retried once with a fresh token
    // must not trigger another refresh (infinite refresh loop otherwise).
    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      isPublicEndpoint(originalRequest.url)
    ) {
      return Promise.reject(error);
    }
    originalRequest._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshWaiters.push({
          resolve: (token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(originalRequest));
          },
          reject,
        });
      });
    }

    isRefreshing = true;
    const epoch = sessionEpoch;
    try {
      const refreshToken = await tokenManager.getRefreshToken();
      // Never signed in (or an app without auth): nothing to refresh, no auth-failure redirect.
      if (!refreshToken) {
        settleRefreshWaiters(null, error);
        return Promise.reject(error);
      }

      const response = await axios.post<{
        success: boolean;
        accessToken: string;
        refreshToken: string;
      }>(`${env.API_URL}/auth/refresh`, { refreshToken }, { timeout: 10000 });

      // Signed out (or in as someone else) meanwhile: drop the old session's new tokens.
      if (epoch !== sessionEpoch) throw error;

      const { accessToken, refreshToken: newRefreshToken } = response.data;

      await tokenManager.setTokens(accessToken, newRefreshToken);
      settleRefreshWaiters(accessToken);

      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      // A newer login/logout owns the credentials now — leave them and the auth state alone.
      if (epoch !== sessionEpoch) {
        settleRefreshWaiters(null, refreshError);
        return Promise.reject(refreshError);
      }
      // Only an auth rejection ends the session; network errors, timeouts and 5xx keep
      // the tokens so the next request can refresh again.
      const status = isAxiosError(refreshError) ? refreshError.response?.status : undefined;
      const sessionRejected = status === 400 || status === 401 || status === 403;
      try {
        if (sessionRejected) await tokenManager.clearTokens();
      } finally {
        // Settle after the await: a 401 that queued meanwhile must not be left pending.
        settleRefreshWaiters(null, refreshError);
        if (sessionRejected) onAuthFailure?.();
      }
      return Promise.reject(sessionRejected ? new Error('Session expired') : refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export const api = {
  get: <T>(url: string, config?: AxiosRequestConfig) => {
    return apiClient.get<T>(url, config);
  },

  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) => {
    return apiClient.post<T>(url, data, config);
  },

  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) => {
    return apiClient.put<T>(url, data, config);
  },

  patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) => {
    return apiClient.patch<T>(url, data, config);
  },

  delete: <T>(url: string, config?: AxiosRequestConfig) => {
    return apiClient.delete<T>(url, config);
  },
};

export default api;
