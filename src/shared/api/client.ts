import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
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

export const tokenManager = {
  setAccessToken: async (token: string): Promise<void> => {
    await SecureStore.setItemAsync(TOKEN_KEYS.ACCESS_TOKEN, token);
  },

  getAccessToken: async (): Promise<string | null> => {
    return SecureStore.getItemAsync(TOKEN_KEYS.ACCESS_TOKEN);
  },

  setRefreshToken: async (token: string): Promise<void> => {
    await SecureStore.setItemAsync(TOKEN_KEYS.REFRESH_TOKEN, token);
  },

  getRefreshToken: async (): Promise<string | null> => {
    return SecureStore.getItemAsync(TOKEN_KEYS.REFRESH_TOKEN);
  },

  setTokens: async (accessToken: string, refreshToken: string): Promise<void> => {
    await Promise.all([
      SecureStore.setItemAsync(TOKEN_KEYS.ACCESS_TOKEN, accessToken),
      SecureStore.setItemAsync(TOKEN_KEYS.REFRESH_TOKEN, refreshToken),
    ]);
  },

  clearTokens: async (): Promise<void> => {
    await Promise.all([
      SecureStore.deleteItemAsync(TOKEN_KEYS.ACCESS_TOKEN),
      SecureStore.deleteItemAsync(TOKEN_KEYS.REFRESH_TOKEN),
    ]);
  },

  hasTokens: async (): Promise<boolean> => {
    const accessToken = await SecureStore.getItemAsync(TOKEN_KEYS.ACCESS_TOKEN);
    return !!accessToken;
  },
};

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const onRefreshed = (token: string): void => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

const addRefreshSubscriber = (callback: (token: string) => void): void => {
  refreshSubscribers.push(callback);
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
    const originalRequest = error.config;

    if (error.response?.status !== 401) {
      console.error('[API Response Error]', {
        status: error.response?.status,
        url: error.config?.url,
        message: error.message,
      });
    }

    if (error.response?.status === 401 && originalRequest) {
      if (isPublicEndpoint(originalRequest.url)) {
        return Promise.reject(error);
      }

      if (originalRequest.url?.includes('/auth/refresh')) {
        await tokenManager.clearTokens();
        if (onAuthFailure) {
          onAuthFailure();
        }
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve) => {
          addRefreshSubscriber((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(originalRequest));
          });
        });
      }

      isRefreshing = true;

      try {
        const refreshToken = await tokenManager.getRefreshToken();

        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post<{
          success: boolean;
          accessToken: string;
          refreshToken: string;
        }>(`${env.API_URL}/auth/refresh`, { refreshToken });

        const { accessToken, refreshToken: newRefreshToken } = response.data;

        await tokenManager.setTokens(accessToken, newRefreshToken);
        onRefreshed(accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch {
        await tokenManager.clearTokens();
        refreshSubscribers = [];

        if (onAuthFailure) {
          onAuthFailure();
        }

        return Promise.reject(new Error('Session expired'));
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
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
