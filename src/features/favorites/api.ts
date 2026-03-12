import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@lib/api';
import type { DbFavorite, FavoriteRequest } from '@shared/types/api';

const FAVORITES_KEY = ['favorites'] as const;

export function useFavorites() {
  return useQuery({
    queryKey: FAVORITES_KEY,
    queryFn: () => api<DbFavorite[]>('/favorites'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useIsFavorite(contentId: string): boolean {
  const { data: favorites } = useFavorites();
  if (!favorites || !contentId) return false;
  return favorites.some((f) => String(f.content_id) === contentId);
}

export function useAddFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ contentId, ...body }: FavoriteRequest & { contentId: string }) =>
      api<DbFavorite>(`/favorites/${contentId}`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onMutate: async ({ contentId, content_type, content_name, content_icon, category_name }) => {
      await queryClient.cancelQueries({ queryKey: FAVORITES_KEY });
      const previous = queryClient.getQueryData<DbFavorite[]>(FAVORITES_KEY);

      queryClient.setQueryData<DbFavorite[]>(FAVORITES_KEY, (old = []) => [
        ...old,
        {
          id: Date.now(), // temporary id
          user_id: 0,
          content_type,
          content_id: Number(contentId),
          content_name: content_name ?? null,
          content_icon: content_icon ?? null,
          category_name: category_name ?? null,
          sort_order: old.length,
          added_at: new Date().toISOString(),
        },
      ]);

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(FAVORITES_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: FAVORITES_KEY });
    },
  });
}

export function useRemoveFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (contentId: string) =>
      api(`/favorites/${contentId}`, { method: 'DELETE' }),
    onMutate: async (contentId) => {
      await queryClient.cancelQueries({ queryKey: FAVORITES_KEY });
      const previous = queryClient.getQueryData<DbFavorite[]>(FAVORITES_KEY);

      queryClient.setQueryData<DbFavorite[]>(FAVORITES_KEY, (old = []) =>
        old.filter((f) => String(f.content_id) !== contentId),
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(FAVORITES_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: FAVORITES_KEY });
    },
  });
}
