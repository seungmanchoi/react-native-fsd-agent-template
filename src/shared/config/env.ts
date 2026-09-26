import Constants from 'expo-constants';

type TAppEnv = 'development' | 'preview' | 'production';

interface IExpoConfigExtra {
  apiUrl?: string;
  appEnv?: string;
  debug?: boolean;
  logLevel?: string;
  appVersion?: string;
  eas?: {
    projectId?: string;
  };
}

const extra = (Constants.expoConfig?.extra || {}) as IExpoConfigExtra;

function getApiUrl(): string {
  const baseUrl = extra.apiUrl || 'http://localhost:3000';
  if (baseUrl.includes('/api/v1')) {
    return baseUrl;
  }
  const normalizedUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  return `${normalizedUrl}/api/v1`;
}

// APP_ENV comes from the EAS build profile. A release bundle built without it
// (local fastlane/xcodebuild) must still count as production — otherwise it
// ships test ad units and disabled analytics to the store.
function getAppEnv(): TAppEnv {
  if (extra.appEnv === 'development' || extra.appEnv === 'preview' || extra.appEnv === 'production') {
    return extra.appEnv;
  }
  return __DEV__ ? 'development' : 'production';
}

const APP_ENV = getAppEnv();

export const env = {
  API_URL: getApiUrl(),
  APP_ENV,
  DEBUG: extra.debug ?? false,
  LOG_LEVEL: extra.logLevel || 'debug',
  APP_VERSION: extra.appVersion || '1.0.0',
  EAS_PROJECT_ID: extra.eas?.projectId || '',
  IS_DEV: APP_ENV === 'development',
  IS_PROD: APP_ENV === 'production',
  IS_EXPO_GO: Constants.appOwnership === 'expo',
} as const;

export function validateEnv(): void {
  const requiredVars: (keyof typeof env)[] = ['API_URL', 'APP_ENV'];
  const missingVars = requiredVars.filter((key) => !env[key]);

  if (missingVars.length > 0) {
    throw new Error(`Missing environment variables: ${missingVars.join(', ')}`);
  }
}

export function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const baseUrl = env.API_URL.endsWith('/') ? env.API_URL.slice(0, -1) : env.API_URL;
  return `${baseUrl}${normalizedPath}`;
}

export default env;
