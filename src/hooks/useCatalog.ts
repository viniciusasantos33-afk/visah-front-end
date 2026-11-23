import { useCallback, useEffect, useRef, useState } from 'react';
import type { Artist, Genre, Mood, Track } from '../types/catalog';
import { mapApiTrack } from '../types/catalog';
import { artistImage } from '../data/artists';
import {
  getAllTracks,
  getAlbums,
  getArtists,
  getGenres,
  getMoods,
} from '../services/catalogApi';
import { recordTrackPlay } from '../services/favoritesApi';
import { mapArtist } from '../utils/catalog';

export function useCatalog(
  userId: number | null,
  refreshFavorites: () => Promise<void>,
  onError: (message: string) => void
) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [visibleTracks, setVisibleTracks] = useState<Track[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [moods, setMoods] = useState<Mood[]>([]);
  const [genreId, setGenreId] = useState<number | null>(null);
  const [moodId, setMoodId] = useState<number | null>(null);
  const [selected, setSelected] = useState<Track | null>(null);
  const [playing, setPlaying] = useState(false);
  const [album, setAlbum] = useState<Track | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [filterLoading, setFilterLoading] = useState(false);
  const selectedRef = useRef<Track | null>(null);
  const genreFilterRef = useRef<number | null>(null);
  const moodFilterRef = useRef<number | null>(null);

  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);
  useEffect(() => {
    genreFilterRef.current = genreId;
  }, [genreId]);
  useEffect(() => {
    moodFilterRef.current = moodId;
  }, [moodId]);

  const refreshCatalog = useCallback(async () => {
    const [apiTracks, apiArtists, apiAlbums, apiGenres, apiMoods] =
      await Promise.all([
        getAllTracks(),
        getArtists(),
        getAlbums(),
        getGenres(),
        getMoods(),
      ]);
    const mappedTracks = apiTracks.map((item) =>
      mapApiTrack(
        item,
        artistImage(item.artist?.name ?? '', item.artist?.photoUrl)
      )
    );
    setTracks(mappedTracks);
    setArtists(
      apiArtists.map((artist) => mapArtist(artist, mappedTracks, apiAlbums))
    );
    setGenres(apiGenres);
    setMoods(apiMoods);
    const filtered = mappedTracks.filter(
      (track) =>
        (genreFilterRef.current == null ||
          track.genreId === genreFilterRef.current) &&
        (moodFilterRef.current == null ||
          track.moodId === moodFilterRef.current)
    );
    setVisibleTracks(filtered);
    setSelected((current) =>
      current
        ? (filtered.find((track) => track.id === current.id) ??
          filtered[0] ??
          mappedTracks[0] ??
          null)
        : (filtered[0] ?? mappedTracks[0] ?? null)
    );
    setGenreId((current) => current ?? mappedTracks[0]?.genreId ?? null);
    setMoodId((current) => current ?? mappedTracks[0]?.moodId ?? null);
    await refreshFavorites();
    onError('');
  }, [refreshFavorites, onError]);

  useEffect(() => {
    if (userId == null) return;
    setCatalogLoading(true);
    refreshCatalog()
      .catch((error) =>
        onError(
          error instanceof Error
            ? error.message
            : 'Não foi possível carregar o catálogo.'
        )
      )
      .finally(() => setCatalogLoading(false));
  }, [userId, refreshCatalog, onError]);

  useEffect(() => {
    if (userId == null || genreId == null || moodId == null) return;
    let active = true;
    setFilterLoading(true);
    getAllTracks({ genreId, moodId })
      .then((apiTracks) => {
        if (!active) return;
        const filtered = apiTracks.map((item) =>
          mapApiTrack(
            item,
            artistImage(item.artist?.name ?? '', item.artist?.photoUrl)
          )
        );
        setVisibleTracks(filtered);
        const current = selectedRef.current;
        if (!filtered.length) {
          setSelected(null);
          setPlaying(false);
        } else if (
          !current ||
          !filtered.some((track) => track.id === current.id)
        ) {
          setSelected(filtered[0]);
          setPlaying(false);
        }
      })
      .catch((error) => {
        if (active)
          onError(
            error instanceof Error
              ? error.message
              : 'Não foi possível aplicar os filtros.'
          );
      })
      .finally(() => {
        if (active) setFilterLoading(false);
      });
    return () => {
      active = false;
    };
  }, [userId, genreId, moodId, onError]);

  const selectTrack = useCallback((track: Track) => {
    setSelected(track);
    setGenreId(track.genreId);
    setMoodId(track.moodId);
    setPlaying(Boolean(track.audioUrl));
    setAlbum(null);
  }, []);

  const reportPlay = useCallback(
    (track: Track) => {
      recordTrackPlay(track.id)
        .then(() => {
          const increment = (item: Track) =>
            item.id === track.id
              ? { ...item, listeners: item.listeners + 1 }
              : item;
          setTracks((current) => current.map(increment));
          setVisibleTracks((current) => current.map(increment));
          setSelected((current) =>
            current?.id === track.id
              ? { ...current, listeners: current.listeners + 1 }
              : current
          );
          setArtists((current) =>
            current.map((artist) =>
              artist.id === track.artistId
                ? { ...artist, listeners: artist.listeners + 1 }
                : artist
            )
          );
        })
        .catch((error: unknown) => {
          onError(
            error instanceof Error
              ? error.message
              : 'Não foi possível registrar esta reprodução.'
          );
        });
    },
    [onError]
  );

  return {
    tracks,
    visibleTracks,
    artists,
    genres,
    moods,
    genreId,
    setGenreId,
    moodId,
    setMoodId,
    selected,
    setSelected,
    playing,
    setPlaying,
    album,
    setAlbum,
    catalogLoading,
    filterLoading,
    refreshCatalog,
    selectTrack,
    reportPlay,
  };
}
