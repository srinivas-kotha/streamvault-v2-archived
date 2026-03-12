import { useQuery } from '@tanstack/react-query';
import { api } from '@lib/api';
import type { XtreamCategory, XtreamLiveStream, XtreamEPGItem } from '@shared/types/api';

export function useFeaturedChannels() {
  return useQuery({
    queryKey: ['live', 'featured'],
    queryFn: () => api<XtreamLiveStream[]>('/live/featured'),
    staleTime: 30 * 60 * 1000, // 30 min
  });
}

export function useLiveCategories() {
  return useQuery({
    queryKey: ['live', 'categories'],
    queryFn: () => api<XtreamCategory[]>('/live/categories'),
    staleTime: 60 * 60 * 1000, // 1 hour (matches backend cache)
  });
}

export function useLiveStreams(categoryId: string) {
  return useQuery({
    queryKey: ['live', 'streams', categoryId],
    queryFn: () => api<XtreamLiveStream[]>(`/live/streams/${categoryId}`),
    enabled: !!categoryId,
    staleTime: 30 * 60 * 1000, // 30 min
  });
}

export function useEPG(streamId: number) {
  return useQuery({
    queryKey: ['live', 'epg', streamId],
    queryFn: () => api<XtreamEPGItem[]>(`/live/epg/${streamId}`),
    enabled: streamId > 0,
    staleTime: 15 * 60 * 1000, // 15 min
  });
}
