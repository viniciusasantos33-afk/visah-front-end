import { useCallback, useState } from 'react';
import type { AlbumDraftTrack } from '../components/admin/types';
import type { Genre, Mood } from '../types/catalog';
import { readAudioDuration } from '../utils/audio';

let nextDraftKey = 1;
const createDraft = (): AlbumDraftTrack => ({
  key: nextDraftKey++,
  title: '',
  genreId: '',
  moodId: '',
  file: null,
  duration: null,
  reading: false,
});

export function useAlbumDrafts(
  genres: Genre[],
  moods: Mood[],
  onError: (message: string) => void
) {
  const [drafts, setDrafts] = useState<AlbumDraftTrack[]>([createDraft()]);

  const updateDraft = useCallback(
    (key: number, updates: Partial<AlbumDraftTrack>) => {
      setDrafts((current) =>
        current.map((draft) =>
          draft.key === key ? { ...draft, ...updates } : draft
        )
      );
    },
    []
  );

  const addDraft = useCallback(
    () =>
      setDrafts((current) => [
        ...current,
        {
          ...createDraft(),
          genreId: String(genres[0]?.id ?? ''),
          moodId: String(moods[0]?.id ?? ''),
        },
      ]),
    [genres, moods]
  );

  const removeDraft = useCallback((key: number) => {
    setDrafts((current) => current.filter((draft) => draft.key !== key));
  }, []);

  const resetDrafts = useCallback(
    () =>
      setDrafts([
        {
          ...createDraft(),
          genreId: String(genres[0]?.id ?? ''),
          moodId: String(moods[0]?.id ?? ''),
        },
      ]),
    [genres, moods]
  );

  const setDraftAudio = useCallback(
    async (key: number, file: File | null) => {
      updateDraft(key, { file, duration: null, reading: Boolean(file) });
      if (!file) return;
      onError('');
      try {
        const duration = await readAudioDuration(file);
        updateDraft(key, { duration, reading: false });
      } catch (audioError) {
        updateDraft(key, { file: null, reading: false });
        onError(
          audioError instanceof Error
            ? audioError.message
            : 'Não foi possível ler o áudio.'
        );
      }
    },
    [onError, updateDraft]
  );

  return {
    drafts,
    setDrafts,
    updateDraft,
    addDraft,
    removeDraft,
    resetDrafts,
    setDraftAudio,
  };
}
