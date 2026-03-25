import { useQuery } from "@tanstack/react-query";
import { api } from "@lib/api";
import { STALE_TIMES } from "@lib/queryConfig";
import type {
  XtreamCategory,
  XtreamLiveStream,
  XtreamEPGItem,
} from "@shared/types/api";

export function useFeaturedChannels() {
  return useQuery({
    queryKey: ["live", "featured"],
    queryFn: () => api<XtreamLiveStream[]>("/live/featured"),
    staleTime: STALE_TIMES.liveStreams,
  });
}

export function useLiveCategories() {
  return useQuery({
    queryKey: ["live", "categories"],
    queryFn: () => api<XtreamCategory[]>("/live/categories"),
    staleTime: STALE_TIMES.liveCategories,
  });
}

export function useLiveStreams(categoryId: string) {
  return useQuery({
    queryKey: ["live", "streams", categoryId],
    queryFn: () => api<XtreamLiveStream[]>(`/live/streams/${categoryId}`),
    enabled: !!categoryId,
    staleTime: STALE_TIMES.liveStreams,
  });
}

export function useEPG(streamId: string) {
  return useQuery({
    queryKey: ["live", "epg", streamId],
    queryFn: () => api<XtreamEPGItem[]>(`/live/epg/${streamId}`),
    enabled: !!streamId,
    staleTime: STALE_TIMES.epg,
    refetchInterval: 300000, // 5 minutes
  });
}

export function useBulkEPG(streamIds: string[]) {
  return useQuery({
    queryKey: ["live", "epg", "bulk", streamIds],
    queryFn: () =>
      api<Record<string, XtreamEPGItem[]>>("/live/epg/bulk", {
        method: "POST",
        body: JSON.stringify({ stream_ids: streamIds }),
      }),
    enabled: streamIds.length > 0,
    staleTime: STALE_TIMES.epg,
    refetchInterval: 300000, // 5 minutes
  });
}
