/**
 * Sprint 4 — Issue #114
 * useProgressTracking v2: reads currentTime/duration from playerStore,
 * saves progress every 10s when playing, saves on unmount.
 * No-op for live streams, idle status.
 *
 * Supports two call signatures for backward compatibility:
 *   useProgressTracking(contentId, streamType)        — v2 (store-based)
 *   useProgressTracking({ contentId, isLive, ... })   — v1 (callback-based)
 */

import { useEffect, useRef, useCallback } from "react";
import { useUpdateHistory } from "../api";
import { usePlayerStore } from "@lib/stores/playerStore";
import type { ContentType } from "@shared/types/api";

interface LegacyOptions {
  contentId: string;
  contentType: ContentType;
  contentName?: string;
  contentIcon?: string;
  isLive: boolean;
}

export function useProgressTracking(
  arg0: string | LegacyOptions,
  arg1?: string,
) {
  const updateHistory = useUpdateHistory();
  const isLegacy = typeof arg0 === "object";

  // ── Refs for legacy v1 path ─────────────────────────────────────────────────
  const currentTimeRef = useRef(0);
  const durationRef = useRef(0);
  const lastSavedRef = useRef(0);

  // ── Derived values ──────────────────────────────────────────────────────────
  const contentId = isLegacy ? arg0.contentId : (arg0 as string);
  const contentType = isLegacy
    ? arg0.contentType
    : ((arg1 as ContentType) ?? "vod");
  const contentName = isLegacy ? arg0.contentName : undefined;
  const contentIcon = isLegacy ? arg0.contentIcon : undefined;
  const isLive = isLegacy ? arg0.isLive : arg1 === "live";

  // ── Legacy saveProgress callback ────────────────────────────────────────────
  const saveProgressLegacy = useCallback(() => {
    if (!isLegacy) return;
    if (isLive || !contentId) return;
    const current = Math.floor(currentTimeRef.current);
    const duration = Math.floor(durationRef.current);
    if (current <= 0 || duration <= 0) return;
    if (Math.abs(current - lastSavedRef.current) < 5) return;
    lastSavedRef.current = current;
    updateHistory.mutate({
      contentId,
      content_type: contentType,
      content_name: contentName,
      content_icon: contentIcon,
      progress_seconds: current,
      duration_seconds: duration,
    });
  }, [
    isLegacy,
    isLive,
    contentId,
    contentType,
    contentName,
    contentIcon,
    updateHistory,
  ]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Legacy interval effect ──────────────────────────────────────────────────
  useEffect(() => {
    if (!isLegacy) return;
    if (isLive) return;
    const interval = setInterval(saveProgressLegacy, 10000);
    return () => {
      clearInterval(interval);
      saveProgressLegacy();
    };
  }, [isLegacy, isLive, saveProgressLegacy]);

  // ── v2 store-based interval effect ─────────────────────────────────────────
  useEffect(() => {
    if (isLegacy) return;
    if (isLive || !contentId) return;

    const interval = setInterval(() => {
      const state = usePlayerStore.getState();
      if (state.status !== "playing") return;
      const current = Math.floor(state.currentTime);
      const duration = Math.floor(state.duration);
      updateHistory.mutate({
        contentId,
        content_type: contentType,
        progress_seconds: current,
        duration_seconds: duration,
      });
    }, 10000);

    return () => {
      clearInterval(interval);
      // Save on unmount (playing or paused, not idle)
      const state = usePlayerStore.getState();
      if (state.status === "idle") return;
      const current = Math.floor(state.currentTime);
      const duration = Math.floor(state.duration);
      updateHistory.mutate({
        contentId,
        content_type: contentType,
        progress_seconds: current,
        duration_seconds: duration,
      });
    };
  }, [isLegacy, isLive, contentId, contentType]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── v1 onTimeUpdate callback ────────────────────────────────────────────────
  const onTimeUpdate = useCallback((time: number, duration: number) => {
    currentTimeRef.current = time;
    durationRef.current = duration;
  }, []);

  if (isLegacy) {
    return { onTimeUpdate };
  }
  return undefined;
}
