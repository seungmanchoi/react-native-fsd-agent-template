import { useEffect } from 'react';
import { Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import Toast from 'react-native-toast-message';
import { QueryProvider, ThemeProvider } from '@core/providers';
import { useUserStore } from '@entities/user';
import {
  useAdLifecycle,
  useAppOpenAd,
  AdDevPanel,
  initializeAdsWithConsent,
} from '@features/ads';
import { setAuthFailureCallback } from '@shared/api';
import { initAnalytics, logScreenView } from '@shared/lib/analytics';
import { useReviewStore } from '@shared/store-review';
import { toastConfig, ErrorBoundary } from '@shared/ui';
import '../global.css';

function AdLifecycleManager(): null {
  useAdLifecycle();
  useAppOpenAd();
  return null;
}

// Logs the route pattern ("(tabs)/explore", "user/[id]") — never raw paths with IDs.
function useScreenTracking(): void {
  const screen = useSegments().join('/') || 'index';
  useEffect(() => {
    void logScreenView(screen);
  }, [screen]);
}

export default function RootLayout(): React.JSX.Element {
  // Declared first: effects run in order, so the collection flags are set before the first screen_view.
  useEffect(() => {
    // Nothing here blocks the first frame; the native splash hides as soon as it renders.
    // UMP (GDPR) → iOS ATT → mobileAds().initialize(). Ad components wait for useAdsReady().
    void initializeAdsWithConsent();
    void initAnalytics();
    // Count this launch only after the persisted counters are loaded.
    void Promise.resolve(useReviewStore.persist.rehydrate()).then(() =>
      useReviewStore.getState().recordLaunch(),
    );
    // Refresh token rejected: the session is gone, send the user back to sign in.
    setAuthFailureCallback(() => {
      useUserStore.getState().clearUser();
      router.replace('/login');
    });
  }, []);

  useScreenTracking();

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={styles.flex}>
        <SafeAreaProvider>
          <QueryProvider>
            <ThemeProvider>
              <StatusBar style="light" />
              <AdLifecycleManager />
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(tabs)" />
              </Stack>
              <AdDevPanel />
              <Toast config={toastConfig} />
            </ThemeProvider>
          </QueryProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});
