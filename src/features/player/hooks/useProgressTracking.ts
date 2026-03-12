import { useEffect, useRef, useCallback } from 'react';
import { useUpdateHistory } from '../api';
import type { ContentType } from '@shared/types/api';

interface UseProgressTrackingOptions {
  contentId: string;
  contentType: ContentType;
  contentName?: string;
  contentIcon?: string;
  isLive: boolean;
}

export function useProgressTracking({
  contentId,
  contentType,
  contentName,
  contentIcon,
  isLive,
}: UseProgressTrackingOptions) {
  const updateHistory = useUpdateHistory();
  const lastSavedRef = useRef(0);
  const currentTimeRef = useRef(0);
  const durationRef = useRef(0);

  const saveProgress = useCallback(() => {
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
  }, [isLive, contentId, contentType, contentName, contentIcon, updateHistory]);

  useEffect(() => {
    if (isLive) return;
    const interval = setInterval(saveProgress, 10000);
    return () => {
      clearInterval(interval);
      saveProgress();
    };
  }, [saveProgress, isLive]);

  const onTimeUpdate = useCallback((time: number, duration: number) => {
    currentTimeRef.current = time;
    durationRef.current = duration;
  }, []);

  return { onTimeUpdate };
}
