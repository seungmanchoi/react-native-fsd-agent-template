import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

/** Calls `onForeground` on inactive/background → active and `onBackground` on the reverse. */
export function useAppState(onForeground?: () => void, onBackground?: () => void): void {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        onForeground?.();
      }

      if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
        onBackground?.();
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [onForeground, onBackground]);
}
