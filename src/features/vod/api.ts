import { useQuery } from '@tanstack/react-query';
import { api } from '@lib/api';
import type { XtreamCategory, XtreamVODStream, XtreamVODInfo } from '@shared/types/api';

export function useVODCategories() {
  return useQuery({
    queryKey: ['vod', 'categories'],
    queryFn: () => api<XtreamCategory[]>('/vod/categories'),
    staleTime: 6 * 60 * 60 * 1000,
  });
}

export function useVODStreams(categoryId: string) {
  return useQuery({
    queryKey: ['vod', 'streams', categoryId],
    queryFn: () => api<XtreamVODStream[]>(`/vod/streams/${categoryId}`),
    enabled: !!categoryId,
    staleTime: 2 * 60 * 60 * 1000,
  });
}

export function useVODInfo(vodId: string) {
  return useQuery({
    queryKey: ['vod', 'info', vodId],
    queryFn: () => api<XtreamVODInfo>(`/vod/info/${vodId}`),
    enabled: !!vodId,
    staleTime: 2 * 60 * 60 * 1000,
  });
}
