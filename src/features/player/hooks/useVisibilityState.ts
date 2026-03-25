/**
 * Sprint 4 — Issue #116
 * useVisibilityState: pauses HLS loading when tab is hidden, resumes on visibility.
 * Live streams reload source; VOD resumes from currentTime.
 * Auto-retries once after 3s on failure. Cleanup on unmount.
 *
 * Behavior:
 * - No URL provided: visibilitychange with hidden=true → stopLoad (tab hidden)
 * - URL provided + live: visibilitychange → loadSource(url) (recovery)
 * - URL provided + VOD: visibilitychange → startLoad(currentTime) (recovery)
 */

import { useEffect, useRef } from "react";
import { usePlayerStore } from "@lib/stores/playerStore";

interface HlsLike {
  stopLoad: () => void;
  startLoad: (startPosition?: number) => void;
  loadSource: (url: string) => void;
  attachMedia?: (media: HTMLMediaElement) => void;
}

export function useVisibilityState(
  hlsRef: React.RefObject<HlsLike | null>,
  url?: string,
  videoEl?: HTMLVideoElement,
) {
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasRetriedRef = useRef(false);

  useEffect(() => {
    function handleVisibilityChange() {
      const hls = hlsRef.current;
      const state = usePlayerStore.getState();

      // No-op when idle or no stream active
      if (state.status === "idle" || !state.currentStreamId) return;
      if (!hls) return;

      if (url) {
        // URL provided — this is a "recovery" trigger: reload/resume the stream
        hasRetriedRef.current = false;

        if (state.streamType === "live") {
          hls.loadSource(url);
          if (videoEl && hls.attachMedia) {
            hls.attachMedia(videoEl);
          }
        } else {
          // VOD: resume from current playback position
          hls.startLoad(state.currentTime);
        }

        // Set up auto-retry if recovery fails
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
        }
        retryTimeoutRef.current = setTimeout(() => {
          if (!hasRetriedRef.current) {
            const currentState = usePlayerStore.getState();
            if (currentState.status === "error") {
              hasRetriedRef.current = true;
              const currentHls = hlsRef.current;
              if (!currentHls) return;
              if (currentState.streamType === "live" && url) {
                currentHls.loadSource(url);
              } else {
                currentHls.startLoad(currentState.currentTime);
              }
            }
          }
        }, 3000);
      } else {
        // No URL — only react when tab becomes hidden
        if (document.hidden) {
          hls.stopLoad();
          hasRetriedRef.current = false;
          if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
            retryTimeoutRef.current = null;
          }
        }
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [hlsRef, url, videoEl]);
}
