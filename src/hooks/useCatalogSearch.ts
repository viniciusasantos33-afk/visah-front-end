import { useCallback, useRef, useState } from 'react';
import { artistImage } from '../data/artists';
import { getAllTracks } from '../services/catalogApi';
import { mapApiTrack, type Track } from '../types/catalog';

export function useCatalogSearch(
  genreId: number | null,
  moodId: number | null,
  onError: (message: string) => void
) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Track[]>([]);
  const [busy, setBusy] = useState(false);
  const requestIdRef = useRef(0);

  const search = useCallback(
    async (term: string) => {
      const normalizedTerm = term.trim();
      const requestId = ++requestIdRef.current;
      if (!normalizedTerm) {
        setResults([]);
        return;
      }

      setBusy(true);
      try {
        const tracks = await getAllTracks({
          search: normalizedTerm,
          genreId,
          moodId,
        });
        if (requestId === requestIdRef.current) {
          setResults(
            tracks.map((item) =>
              mapApiTrack(
                item,
                artistImage(item.artist?.name ?? '', item.artist?.photoUrl)
              )
            )
          );
        }
      } catch (error) {
        if (requestId === requestIdRef.current) {
          onError(
            error instanceof Error
              ? error.message
              : 'Não foi possível pesquisar no catálogo.'
          );
          setResults([]);
        }
      } finally {
        if (requestId === requestIdRef.current) setBusy(false);
      }
    },
    [genreId, moodId, onError]
  );

  const toggle = useCallback(() => setOpen((current) => !current), []);
  const close = useCallback(() => {
    setOpen(false);
    setResults([]);
    setQuery('');
  }, []);

  return {
    open,
    query,
    results,
    busy,
    setQuery,
    search,
    toggle,
    close,
    clearResults: () => setResults([]),
  };
}
