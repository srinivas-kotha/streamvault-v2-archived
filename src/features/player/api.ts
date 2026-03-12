import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@lib/api';
import type { StreamUrlResponse, HistoryUpdateRequest } from '@shared/types/api';

export function useStreamUrl(type: string, id: string) {
  return useQuery({
    queryKey: ['stream', 'url', type, id],
    queryFn: () => api<StreamUrlResponse>(`/stream/url/${type}/${id}`),
    enabled: !!type && !!id,
    staleTime: 5 * 60 * 1000,
  });
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
