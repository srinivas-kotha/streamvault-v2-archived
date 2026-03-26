import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@lib/api";
import { STALE_TIMES } from "@lib/queryConfig";
import { useToastStore } from "@lib/toastStore";
import type { DbFavorite, FavoriteRequest } from "@shared/types/api";

const FAVORITES_KEY = ["favorites"] as const;

/** Normalize backend "channel" → frontend "live" */
function normalizeContentType(raw: string): DbFavorite["content_type"] {
  return raw === "channel" ? "live" : (raw as DbFavorite["content_type"]);
}

export function useFavorites() {
  return useQuery({
    queryKey: FAVORITES_KEY,
    queryFn: async () => {
      const data = await api<DbFavorite[]>("/favorites");
      return data.map((f) => ({
        ...f,
        content_type: normalizeContentType(f.content_type),
      }));
    },
    staleTime: STALE_TIMES.favorites,
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
    mutationFn: ({
      contentId,
      ...body
    }: FavoriteRequest & { contentId: string }) =>
      api<DbFavorite>(`/favorites/${contentId}`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onMutate: async ({
      contentId,
      content_type,
      content_name,
      content_icon,
      category_name,
    }) => {
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
      useToastStore.getState().addToast("Failed to add favorite", "error");
    },
    onSuccess: () => {
      useToastStore.getState().addToast("Added to favorites", "success");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: FAVORITES_KEY });
    },
  });
}

export function useRemoveFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      contentId,
      content_type,
    }: {
      contentId: string;
      content_type: string;
    }) =>
      api(`/favorites/${contentId}`, {
        method: "DELETE",
        body: JSON.stringify({ content_type }),
      }),
    onMutate: async ({ contentId }) => {
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
      useToastStore.getState().addToast("Failed to update favorites", "error");
    },
    onSuccess: () => {
      useToastStore.getState().addToast("Removed from favorites", "success");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: FAVORITES_KEY });
    },
  });
}
