import { useQuery } from '@tanstack/react-query';
import { api } from '@lib/api';
import type {
  XtreamLiveStream,
  XtreamVODStream,
  XtreamSeriesItem,
} from '@shared/types/api';

// Re-export from feature modules to avoid duplicate hook definitions
export { useWatchHistory } from '@features/history/api';
export { useFavorites } from '@features/favorites/api';

type RecentlyAddedType = 'live' | 'vod' | 'series';

type RecentlyAddedResult<T extends RecentlyAddedType> = T extends 'live'
  ? XtreamLiveStream[]
  : T extends 'vod'
    ? XtreamVODStream[]
    : XtreamSeriesItem[];

export function useRecentlyAdded<T extends RecentlyAddedType>(type: T) {
  return useQuery({
    queryKey: ['home', 'recentlyAdded', type],
    queryFn: async () => {
      const endpoint =
        type === 'live'
          ? '/live/streams/0'
          : type === 'vod'
            ? '/vod/streams/0'
            : '/series/list/0';
      const data = await api<RecentlyAddedResult<T>>(endpoint);
      // Sort by added/last_modified DESC and take top 20
      const sorted = [...data].sort((a, b) => {
        const aDate = 'added' in a ? a.added : (a as XtreamSeriesItem).last_modified;
        const bDate = 'added' in b ? b.added : (b as XtreamSeriesItem).last_modified;
        return Number(bDate) - Number(aDate);
      });
      return sorted.slice(0, 20) as RecentlyAddedResult<T>;
    },
    staleTime: 5 * 60 * 1000, // 5 min
  });
}
