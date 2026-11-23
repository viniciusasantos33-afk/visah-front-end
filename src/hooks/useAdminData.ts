import { useCallback, useState } from 'react';
import type { AdminUser } from '../services/models';
import { getAdminUsers } from '../services/adminApi';
import {
  getAlbums,
  getArtists,
  getGenres,
  getMoods,
} from '../services/catalogApi';
import type { ApiAlbum, ApiArtist, Genre, Mood } from '../types/catalog';

export function useAdminData(onCreated: () => Promise<void>) {
  const [artists, setArtists] = useState<ApiArtist[]>([]);
  const [albums, setAlbums] = useState<ApiAlbum[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [moods, setMoods] = useState<Mood[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    const [artistData, albumData, genreData, moodData, userData] =
      await Promise.all([
        getArtists(),
        getAlbums(),
        getGenres(),
        getMoods(),
        getAdminUsers(),
      ]);
    setArtists(artistData);
    setAlbums(albumData);
    setGenres(genreData);
    setMoods(moodData);
    setUsers(userData);
  }, []);

  const perform = useCallback(
    async (action: () => Promise<void>, success: string): Promise<boolean> => {
      setBusy(true);
      setError('');
      setMessage('');
      try {
        await action();
        await loadData();
        await onCreated();
        setMessage(success);
        return true;
      } catch (actionError) {
        await Promise.all([
          loadData().catch(() => undefined),
          onCreated().catch(() => undefined),
        ]);
        setError(
          actionError instanceof Error
            ? actionError.message
            : 'Não foi possível salvar as alterações.'
        );
        return false;
      } finally {
        setBusy(false);
      }
    },
    [loadData, onCreated]
  );

  return {
    artists,
    albums,
    genres,
    moods,
    users,
    busy,
    message,
    error,
    setError,
    setMessage,
    loadData,
    perform,
  };
}
