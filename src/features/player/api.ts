import { useMutation } from '@tanstack/react-query';
import { api } from '@lib/api';
import type { StreamUrlResponse, HistoryUpdateRequest } from '@shared/types/api';

export function useStreamUrl(type: string, id: string) {
  const enabled = !!type && !!id;
  const data: StreamUrlResponse | undefined = enabled
    ? {
        url: `/api/stream/${type}/${id}`,
        format: type === 'live' ? 'ts' : 'mp4',
        isLive: type === 'live',
      }
    : undefined;
  return { data, isLoading: false, error: null };
}

export function useUpdateHistory() {
  return useMutation({
    mutationFn: ({ contentId, ...data }: HistoryUpdateRequest & { contentId: string }) =>
      api(`/history/${contentId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  });
}
