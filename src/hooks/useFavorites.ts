import { useCallback, useRef, useState } from 'react';
import {
  addFavoriteTrack,
  getFavorites,
  removeFavoriteTrack,
} from '../services/favoritesApi';
import type { Track } from '../types/catalog';

export function useFavorites(onError: (message: string) => void) {
  const [favorites, setFavorites] = useState<Set<number>>(() => new Set());
  const favoritesRef = useRef(favorites);
  const pendingRef = useRef(new Set<number>());

  const commitFavorites = (next: Set<number>) => {
    favoritesRef.current = next;
    setFavorites(next);
  };

  const refreshFavorites = useCallback(async () => {
    try {
      const currentFavorites = await getFavorites();
      commitFavorites(
        new Set(
          currentFavorites.flatMap((favorite) =>
            favorite.trackId == null ? [] : [favorite.trackId]
          )
        )
      );
    } catch (error) {
      onError(
        error instanceof Error
          ? error.message
          : 'Não foi possível carregar as músicas curtidas.'
      );
    }
  }, [onError]);

  const toggleFavorite = useCallback(
    async (track: Track | null) => {
      if (!track || pendingRef.current.has(track.id)) return;
      const alreadyFavorite = favoritesRef.current.has(track.id);
      pendingRef.current.add(track.id);
      try {
        if (alreadyFavorite) await removeFavoriteTrack(track.id);
        else await addFavoriteTrack(track.id);
        const next = new Set(favoritesRef.current);
        if (alreadyFavorite) next.delete(track.id);
        else next.add(track.id);
        commitFavorites(next);
      } catch (error) {
        onError(
          error instanceof Error
            ? error.message
            : 'Não foi possível atualizar os favoritos.'
        );
      } finally {
        pendingRef.current.delete(track.id);
      }
    },
    [onError]
  );

  return { favorites, refreshFavorites, toggleFavorite };
}
