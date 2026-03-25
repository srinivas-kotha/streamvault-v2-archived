/**
 * Sprint 4 — Issue #116
 * useAutoNextEpisode: 5-second countdown at end of episode, then auto-advances.
 * No-op for live TV, standalone VOD (no seriesContext), or last episode.
 * Returns { countdown, cancel } for AutoNextOverlay.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { usePlayerStore } from "@lib/stores/playerStore";

interface UseAutoNextEpisodeResult {
  countdown: number | null;
  cancel: () => void;
}

const COUNTDOWN_SECONDS = 5;
const TRIGGER_THRESHOLD = 5; // Start countdown when within 5s of end

export function useAutoNextEpisode(): UseAutoNextEpisodeResult {
  const [countdown, setCountdown] = useState<number | null>(null);
  const cancelledRef = useRef(false);
  const startedRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const status = usePlayerStore((s) => s.status);
  const streamType = usePlayerStore((s) => s.streamType);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const duration = usePlayerStore((s) => s.duration);
  const seriesContext = usePlayerStore((s) => s.seriesContext);
  const currentStreamId = usePlayerStore((s) => s.currentStreamId);

  // Determine if we should be counting down
  const shouldCountdown = (() => {
    if (status === "idle" || streamType !== "series") return false;
    if (!seriesContext || !currentStreamId) return false;
    if (duration <= 0 || currentTime < duration - TRIGGER_THRESHOLD)
      return false;

    // Check if there's a next episode
    const currentIndex = seriesContext.episodes.findIndex(
      (ep) =>
        ep.id === currentStreamId || ep.episodeNum === seriesContext.episodeNum,
    );
    const hasNext =
      currentIndex >= 0 && currentIndex < seriesContext.episodes.length - 1;
    return hasNext;
  })();

  // Start countdown when we enter "near end" territory
  useEffect(() => {
    if (!shouldCountdown) {
      // Not eligible — don't start
      return;
    }

    // Don't restart if cancelled or already started
    if (cancelledRef.current || startedRef.current) return;

    startedRef.current = true;
    cancelledRef.current = false;
    setCountdown(COUNTDOWN_SECONDS);

    // Tick interval
    intervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null) return null;
        const next = prev - 1;
        if (next <= 0) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          if (!cancelledRef.current) {
            usePlayerStore.getState().playNextEpisode();
          }
          return null;
        }
        return next;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [shouldCountdown]); // eslint-disable-line react-hooks/exhaustive-deps

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    startedRef.current = false;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setCountdown(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  return { countdown, cancel };
}
