import { useEffect, useState } from 'react';
import { isAdsReady, onAdsReady } from '../lib/consent';

/** true once consent allows ad requests and the SDK is initialized. Gate every ad load on it. */
export function useAdsReady(): boolean {
  const [ready, setReady] = useState(isAdsReady);
  useEffect(() => onAdsReady(() => setReady(true)), []);
  return ready;
}
