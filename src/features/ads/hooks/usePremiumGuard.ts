import { useEffect, useState } from 'react';
import { usePremiumStore } from '../store/premium.store';

interface IUsePremiumGuardReturn {
  isPremiumActive: boolean;
  premiumSecondsLeft: number;
  remainingMs: number;
  totalRewardsEarned: number;
}

/**
 * Lightweight hook for components that just need to check premium status.
 * Use this in feature screens to gate premium-only UI.
 *
 * Store selectors return stable fields only — a selector calling Date.now() yields a new
 * value on every read and makes React re-render in a loop. Time comes from a 1s tick
 * that runs only while premium is active.
 */
export function usePremiumGuard(): IUsePremiumGuardReturn {
  const premiumExpiryTime = usePremiumStore((s) => s.premiumExpiryTime);
  const totalRewardsEarned = usePremiumStore((s) => s.totalRewardsEarned);
  const [now, setNow] = useState(Date.now);

  const remainingMs = Math.max(0, premiumExpiryTime - now);
  const isPremiumActive = remainingMs > 0;

  useEffect(() => {
    if (premiumExpiryTime <= 0) return;
    const tick = (): void => setNow(Date.now());
    // Refresh right after a grant/extension too, so the countdown never starts from a stale clock.
    const first = setTimeout(tick, 0);
    const timer = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [premiumExpiryTime]);

  return {
    isPremiumActive,
    premiumSecondsLeft: Math.ceil(remainingMs / 1000),
    remainingMs,
    totalRewardsEarned,
  };
}
