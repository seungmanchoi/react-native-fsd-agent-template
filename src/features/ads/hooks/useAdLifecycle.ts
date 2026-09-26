import { useEffect, useRef, useCallback, useState } from 'react';
import { useAppState } from '@/shared/lib/hooks';
import { ADS_CONFIG } from '@/shared/config';
import { useAdStore } from '../store/ad.store';
import { usePremiumStore } from '../store/premium.store';
import type { IAdLifecycleState } from '../types';

/**
 * Master lifecycle hook for ads + premium timing.
 *
 * Handles:
 * - Hydrating persisted state on mount (app start / restart)
 * - Daily reset check on foreground resume
 * - Premium expiry check on foreground resume
 * - Periodic premium countdown timer while foreground
 * - Cleanup on background
 *
 * Place this in your root layout (once).
 */
export function useAdLifecycle(
  onPremiumExpired?: () => void,
): IAdLifecycleState {
  const [isInitialized, setIsInitialized] = useState(false);
  const [premiumSecondsLeft, setPremiumSecondsLeft] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onPremiumExpiredRef = useRef(onPremiumExpired);
  useEffect(() => {
    onPremiumExpiredRef.current = onPremiumExpired;
  });

  const adHydrate = useAdStore((s) => s.hydrate);
  const checkDailyReset = useAdStore((s) => s.checkDailyReset);

  const premiumHydrate = usePremiumStore((s) => s.hydrate);
  const checkAndExpire = usePremiumStore((s) => s.checkAndExpire);
  const remainingTimeMs = usePremiumStore((s) => s.remainingTimeMs);
  const isPremiumActive = usePremiumStore((s) => s.isPremiumActive);

  // Update the countdown display
  const updatePremiumCountdown = useCallback(() => {
    const remaining = remainingTimeMs();
    setPremiumSecondsLeft(Math.ceil(remaining / 1000));

    if (checkAndExpire()) {
      onPremiumExpiredRef.current?.();
    }
  }, [remainingTimeMs, checkAndExpire]);

  // Start periodic premium check timer
  const startTimer = useCallback(() => {
    if (timerRef.current) return;
    // Immediate check
    updatePremiumCountdown();
    timerRef.current = setInterval(
      updatePremiumCountdown,
      ADS_CONFIG.PREMIUM_CHECK_INTERVAL_MS,
    );
  }, [updatePremiumCountdown]);

  // Stop timer
  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Initialize on mount (app start / restart)
  useEffect(() => {
    const init = async (): Promise<void> => {
      await Promise.all([adHydrate(), premiumHydrate()]);

      // Check daily reset after hydration
      checkDailyReset();

      // Check premium state after hydration
      if (checkAndExpire()) {
        onPremiumExpiredRef.current?.();
      }

      updatePremiumCountdown();
      setIsInitialized(true);

      // Start timer if premium is active
      if (isPremiumActive()) {
        startTimer();
      }
    };
    init();

    return () => {
      stopTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Watch premium state changes to start/stop timer
  useEffect(() => {
    const unsub = usePremiumStore.subscribe((state, prevState) => {
      const wasActive =
        prevState.premiumExpiryTime > 0 &&
        Date.now() < prevState.premiumExpiryTime;
      const isActive =
        state.premiumExpiryTime > 0 &&
        Date.now() < state.premiumExpiryTime;

      if (isActive && !wasActive) {
        startTimer();
      } else if (!isActive && wasActive) {
        stopTimer();
        setPremiumSecondsLeft(0);
      }
    });
    return unsub;
  }, [startTimer, stopTimer]);

  // Handle foreground/background transitions
  const handleForeground = useCallback(() => {
    // 1. Check if day changed while backgrounded
    checkDailyReset();

    // 2. Check premium expiry (may have expired while backgrounded)
    if (checkAndExpire()) {
      onPremiumExpiredRef.current?.();
      stopTimer();
      setPremiumSecondsLeft(0);
    } else {
      updatePremiumCountdown();
      // Restart timer if premium still active
      if (isPremiumActive()) {
        startTimer();
      }
    }
  }, [
    checkDailyReset,
    checkAndExpire,
    isPremiumActive,
    updatePremiumCountdown,
    startTimer,
    stopTimer,
  ]);

  const handleBackground = useCallback(() => {
    // Pause timer to save resources
    stopTimer();
  }, [stopTimer]);

  useAppState(handleForeground, handleBackground);

  return { isInitialized, premiumSecondsLeft };
}
