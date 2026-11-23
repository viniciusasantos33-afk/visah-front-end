export type Genre = { id: number; name: string };
export type Mood = { id: number; name: string };

export type ApiArtist = {
  id: number;
  name: string;
  biography?: string | null;
  photoUrl?: string | null;
  playCount: number;
};

export type ApiAlbum = {
  id: number;
  title: string;
  artistId: number;
  artist?: ApiArtist | null;
  releaseDate?: string | null;
  coverUrl?: string | null;
};

export type ApiTrack = {
  id: number;
  title: string;
  artistId: number;
  artist?: ApiArtist | null;
  albumId?: number | null;
  album?: ApiAlbum | null;
  genreId: number;
  genre?: Genre | null;
  moodId: number;
  mood?: Mood | null;
  durationSeconds: number;
  audioUrl?: string | null;
  coverUrl?: string | null;
  playCount: number;
};

export type Track = {
  id: number;
  title: string;
  artist: string;
  artistId: number;
  album: string;
  albumId: number | null;
  image: string;
  coverUrl: string | null;
  listeners: number;
  duration: string;
  durationSeconds: number;
  genre: string;
  genreId: number;
  mood: string;
  moodId: number;
  audioUrl: string | null;
  songs?: string[];
  albumTracks?: Track[];
};

export type Artist = {
  id: number;
  name: string;
  biography: string | null;
  image: string;
  listeners: number;
  albums: Album[];
  tracks: Track[];
};

export type Album = {
  id: number;
  title: string;
  artistId: number;
  artist: string;
  cover: string;
  releaseDate: string | null;
  tracks: Track[];
};

export type PagedTracks = {
  total: number;
  page: number;
  pageSize: number;
  items: ApiTrack[];
};
export type ApiFavorite = {
  id: number;
  trackId: number | null;
  artistId: number | null;
};

export function formatDuration(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds || 0));
  return `${Math.floor(safeSeconds / 60)}:${String(safeSeconds % 60).padStart(2, '0')}`;
}

export function mapApiTrack(
  item: ApiTrack,
  artistImage = '/profile-placeholder.svg'
): Track {
  const cover =
    item.coverUrl ||
    item.album?.coverUrl ||
    item.artist?.photoUrl ||
    artistImage;
  return {
    id: item.id,
    title: item.title,
    artist: item.artist?.name ?? 'Artista desconhecido',
    artistId: item.artistId,
    album: item.album?.title ?? 'Single',
    albumId: item.albumId ?? null,
    image: cover,
    coverUrl: item.coverUrl ?? item.album?.coverUrl ?? null,
    listeners: item.playCount ?? 0,
    duration: formatDuration(item.durationSeconds),
    durationSeconds: item.durationSeconds,
    genre: item.genre?.name ?? 'Sem gênero',
    genreId: item.genreId,
    mood: item.mood?.name ?? 'Sem mood',
    moodId: item.moodId,
    audioUrl: item.audioUrl ?? null,
  };
}
