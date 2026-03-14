import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@lib/api';
import type { StreamUrlResponse, HistoryUpdateRequest } from '@shared/types/api';

export function useStreamUrl(type: string, id: string) {
  const enabled = !!type && !!id;
  const [data, setData] = useState<StreamUrlResponse | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setData(undefined);
      return;
    }

    const url = `/api/stream/${type}/${id}`;

    if (type !== 'live') {
      setData({ url, format: 'mp4', isLive: false });
      return;
    }

    // Probe format via HEAD request for live streams
    let cancelled = false;
    setIsLoading(true);

    fetch(url, { method: 'HEAD', credentials: 'include' })
      .then((res) => {
        if (cancelled) return;
        const format = res.headers.get('x-stream-format') || 'm3u8';
        setData({ url, format, isLive: true });
      })
      .catch(() => {
        if (cancelled) return;
        // Default to m3u8 on probe failure — backend GET will handle fallback
        setData({ url, format: 'm3u8', isLive: true });
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [type, id, enabled]);

  return { data, isLoading, error: null };
}

export function useUpdateHistory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ contentId, ...data }: HistoryUpdateRequest & { contentId: string }) =>
      api(`/history/${contentId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['history'] });
    },
  });
}
