import { useCallback } from 'react';
import { EAnalyticsEvent, logEvent } from '@/shared/lib/analytics';
import { canRequestReview } from '../policy';
import { isReviewAvailable, requestReview } from '../client';
import { useReviewStore } from '../store';
import type { TReviewTrigger } from '../triggers';
import type { IMaybeRequestOptions } from '../types';

/**
 * The ONLY entry point external code may use to request a store review.
 * Never call expo-store-review directly, and never bypass canRequestReview.
 *
 * Call from a POSITIVE action's success callback while the UI is idle. The
 * boolean return means "policy passed + attempted" — NOT that a dialog showed.
 * Do not branch follow-up UI/navigation on it.
 */
export const useStoreReview = () => {
  const maybeRequest = useCallback(
    async (
      trigger: TReviewTrigger,
      options: IMaybeRequestOptions = { uiIsIdle: true },
    ): Promise<boolean> => {
      if (!(await isReviewAvailable())) return false;
      // Counters (last request, yearly quota) are unknown until hydration finishes.
      if (!useReviewStore.persist.hasHydrated()) return false;
      // Read the live store at call time — no re-render on every counter change.
      const state = useReviewStore.getState();
      if (!canRequestReview(state, { uiIsIdle: options.uiIsIdle })) return false;

      state.markRequested();
      await logEvent(EAnalyticsEvent.REQUEST_STORE_REVIEW, { trigger });
      // Fire-and-forget: never depend on whether the dialog actually shows.
      void requestReview();
      return true;
    },
    [],
  );

  return { maybeRequest };
};
