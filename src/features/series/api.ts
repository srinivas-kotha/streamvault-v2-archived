import { useQuery } from '@tanstack/react-query';
import { api } from '@lib/api';
import type { XtreamCategory, XtreamSeriesItem, XtreamSeriesInfo } from '@shared/types/api';

export function useSeriesCategories() {
  return useQuery({
    queryKey: ['series', 'categories'],
    queryFn: () => api<XtreamCategory[]>('/series/categories'),
    staleTime: 6 * 60 * 60 * 1000,
  });
}

export function useSeriesList(categoryId: string) {
  return useQuery({
    queryKey: ['series', 'list', categoryId],
    queryFn: () => api<XtreamSeriesItem[]>(`/series/list/${categoryId}`),
    enabled: !!categoryId,
    staleTime: 2 * 60 * 60 * 1000,
  });
}

export function useSeriesInfo(seriesId: string) {
  return useQuery({
    queryKey: ['series', 'info', seriesId],
    queryFn: () => api<XtreamSeriesInfo>(`/series/info/${seriesId}`),
    enabled: !!seriesId,
    staleTime: 2 * 60 * 60 * 1000,
  });
}
