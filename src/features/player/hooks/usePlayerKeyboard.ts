/**
 * Sprint 4 — Issue #115
 * usePlayerKeyboard v2: store-based keyboard handler.
 * Integrates with playerStore state machine (no playerRef needed for core actions).
 * Back button handled BEFORE video checks (AC-08).
 */

import { useEffect, useRef } from "react";
import { usePlayerStore } from "@lib/stores/playerStore";

interface SeekHoldState {
  key: "ArrowLeft" | "ArrowRight";
  startTime: number;
}

function getSeekStep(holdDurationMs: number): number {
  if (holdDurationMs >= 4000) return 120;
  if (holdDurationMs >= 2000) return 60;
  if (holdDurationMs >= 500) return 30;
  return 10;
}

export interface UsePlayerKeyboardOptions {
  /** Override TV mode detection (for testing) */
  isTVMode?: boolean;
  /** Channel up callback (live TV, debounced 300ms) */
  onChannelUp?: () => void;
  /** Channel down callback (live TV, debounced 300ms) */
  onChannelDown?: () => void;
  /** Imperative seek function (calls video element directly) */
  onSeek?: (time: number) => void;
}

export function usePlayerKeyboard(options: UsePlayerKeyboardOptions = {}) {
  const { isTVMode = false, onChannelUp, onChannelDown, onSeek } = options;

  const onSeekRef = useRef(onSeek);
  onSeekRef.current = onSeek;

  const holdStateRef = useRef<SeekHoldState | null>(null);
  const holdClearTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const channelDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;

      // ── Back/close — ALWAYS FIRST, BEFORE any video check (AC-08) ─────────
      const isBackKey =
        e.keyCode === 4 || // Fire TV back
        e.keyCode === 10009 || // Samsung Tizen back
        e.keyCode === 461 || // LG webOS back
        e.key === "Backspace" ||
        e.key === "Escape" ||
        e.key === "GoBack";

      if (isBackKey) {
        e.preventDefault();
        e.stopPropagation();
        // In non-TV mode, exit fullscreen first if open
        if (!isTVMode && document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          usePlayerStore.getState().stopPlayback();
        }
        return;
      }

      const state = usePlayerStore.getState();

      // Only handle keys when player is active
      if (state.status === "idle" || !state.currentStreamId) return;

      const isLive = state.streamType === "live";

      // ── Enter / Play-Pause ────────────────────────────────────────────────
      if (e.key === "Enter") {
        const active = document.activeElement;
        const isGenericFocus =
          !active || active === document.body || active.tagName === "VIDEO";
        if (isGenericFocus) {
          e.preventDefault();
          e.stopPropagation();
          const current = state.status;
          if (current === "playing") {
            usePlayerStore.getState().setStatus("paused");
          } else if (current === "paused") {
            usePlayerStore.getState().setStatus("playing");
          }
          return;
        }
      }

      // ── Arrow keys ────────────────────────────────────────────────────────
      const isArrowKey = [
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
      ].includes(e.key);
      if (isArrowKey) {
        if (!isTVMode) {
          const active = document.activeElement;
          // Block all arrows if a range/input element is focused (e.g., volume slider)
          if (active instanceof HTMLInputElement) return;

          // Up/Down only handled when no specific control is focused
          if (e.key === "ArrowUp" || e.key === "ArrowDown") {
            const isGenericFocus =
              !active || active === document.body || active.tagName === "VIDEO";
            if (!isGenericFocus) return;
          }
          // Left/Right (seek) always handled when toolbar buttons are focused
        }

        e.stopPropagation();
        e.preventDefault();

        // Live TV: Arrow Up/Down = channel switch (debounced 300ms)
        if (isLive && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
          if (channelDebounceRef.current)
            clearTimeout(channelDebounceRef.current);
          const cb = e.key === "ArrowUp" ? onChannelUp : onChannelDown;
          if (cb) {
            channelDebounceRef.current = setTimeout(cb, 300);
          }
          return;
        }

        // VOD: Arrow Left/Right = seek with hold acceleration
        if ((e.key === "ArrowLeft" || e.key === "ArrowRight") && !isLive) {
          const direction = e.key === "ArrowRight" ? 1 : -1;

          // Cancel hold-clear (TV remotes fire rapid keydown/keyup pairs)
          if (holdClearTimeoutRef.current) {
            clearTimeout(holdClearTimeoutRef.current);
            holdClearTimeoutRef.current = null;
          }

          const isHeld = e.repeat || holdStateRef.current?.key === e.key;
          const currentState = usePlayerStore.getState();

          if (!isHeld) {
            holdStateRef.current = { key: e.key, startTime: Date.now() };
            const newTime = Math.max(
              0,
              Math.min(
                currentState.duration,
                currentState.currentTime + 10 * direction,
              ),
            );
            if (onSeekRef.current) {
              onSeekRef.current(newTime);
            } else {
              usePlayerStore.setState({ currentTime: newTime });
            }
          } else {
            const hold = holdStateRef.current;
            if (hold && hold.key === e.key) {
              const holdDuration = Date.now() - hold.startTime;
              const step = getSeekStep(holdDuration);
              const newTime = Math.max(
                0,
                Math.min(
                  currentState.duration,
                  currentState.currentTime + step * direction,
                ),
              );
              if (onSeekRef.current) {
                onSeekRef.current(newTime);
              } else {
                usePlayerStore.setState({ currentTime: newTime });
              }
            }
          }
          return;
        }

        // Non-live Arrow Up/Down = volume
        if (e.key === "ArrowUp") {
          const current = usePlayerStore.getState();
          usePlayerStore
            .getState()
            .setVolume(Math.min(1, current.volume + 0.1));
        } else if (e.key === "ArrowDown") {
          const current = usePlayerStore.getState();
          usePlayerStore
            .getState()
            .setVolume(Math.max(0, current.volume - 0.1));
        }
        return;
      }

      // ── Other keys ────────────────────────────────────────────────────────

      switch (e.key) {
        case " ":
        case "k": {
          e.preventDefault();
          const current = usePlayerStore.getState().status;
          if (current === "playing") {
            usePlayerStore.getState().setStatus("paused");
          } else if (current === "paused") {
            usePlayerStore.getState().setStatus("playing");
          }
          break;
        }
        case "f":
          if (!isTVMode) {
            e.preventDefault();
            // Toggle fullscreen on container
            if (document.fullscreenElement) {
              document.exitFullscreen()?.catch(() => {});
            } else {
              document.documentElement.requestFullscreen()?.catch(() => {});
            }
          }
          break;
        case "m": {
          e.preventDefault();
          const current = usePlayerStore.getState();
          current.setMuted(!current.isMuted);
          break;
        }
        case ">": {
          e.preventDefault();
          const { playbackRate: currentRate, setPlaybackRate } =
            usePlayerStore.getState();
          const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
          const currentIdx = speeds.indexOf(currentRate);
          const nextSpeed = speeds[currentIdx + 1];
          if (currentIdx < speeds.length - 1 && nextSpeed !== undefined) {
            setPlaybackRate(nextSpeed);
          }
          break;
        }
        case "<": {
          e.preventDefault();
          const { playbackRate: currentRate2, setPlaybackRate: setRate2 } =
            usePlayerStore.getState();
          const speeds2 = [0.5, 0.75, 1, 1.25, 1.5, 2];
          const currentIdx2 = speeds2.indexOf(currentRate2);
          const prevSpeed = speeds2[currentIdx2 - 1];
          if (currentIdx2 > 0 && prevSpeed !== undefined) {
            setRate2(prevSpeed);
          }
          break;
        }
      }
    }

    function handleKeyUp(e: KeyboardEvent) {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        // TV remotes: delay clearing hold state by 300ms
        if (holdClearTimeoutRef.current)
          clearTimeout(holdClearTimeoutRef.current);
        holdClearTimeoutRef.current = setTimeout(() => {
          holdStateRef.current = null;
        }, 300);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      if (holdClearTimeoutRef.current)
        clearTimeout(holdClearTimeoutRef.current);
      if (channelDebounceRef.current) clearTimeout(channelDebounceRef.current);
    };
  }, [isTVMode, onChannelUp, onChannelDown]);
}
