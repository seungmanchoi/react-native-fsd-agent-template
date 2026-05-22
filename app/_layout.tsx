import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import Toast from 'react-native-toast-message';
import { QueryProvider, ThemeProvider } from '@core/providers';
import { toastConfig, ErrorBoundary } from '@shared/ui';
import {
  useAdLifecycle,
  useAppOpenAd,
  AdDevPanel,
  initializeAdsWithConsent,
} from '@/features/ads';
import '../global.css';

function AdLifecycleManager(): null {
  useAdLifecycle();
  useAppOpenAd();
  return null;
}

export default function RootLayout(): React.JSX.Element {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initialize = async (): Promise<void> => {
      try {
        // Runs UMP (GDPR) consent -> iOS ATT prompt -> mobileAds().initialize().
        // Order matters: AdMob must initialize AFTER consent is gathered so the
        // first ad request reflects the user's tracking choice.
        await initializeAdsWithConsent();
        // TODO: Add auth initialization here
      } catch (error) {
        console.error('Failed to initialize:', error);
      } finally {
        setIsInitialized(true);
      }
    };
    initialize();
  }, []);

  if (!isInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
  },
  flex: {
    flex: 1,
  },
});
