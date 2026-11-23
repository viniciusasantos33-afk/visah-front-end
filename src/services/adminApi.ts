import type {
  ApiAlbum,
  ApiArtist,
  ApiTrack,
  Genre,
  Mood,
} from '../types/catalog';
import type { AdminUser } from './models';
import { request, uploadFile } from './apiClient';

export type { AdminUser } from './models';

export function getAdminUsers() {
  return request<AdminUser[]>('/api/users');
}
export function updateAdminUser(
  id: number,
  user: Pick<AdminUser, 'name' | 'role' | 'isActive'>
) {
  return request<void>(`/api/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(user),
  });
}
export function deactivateAdminUser(id: number) {
  return request<void>(`/api/users/${id}`, { method: 'DELETE' });
}

export function createAlbum(
  album: Pick<ApiAlbum, 'title' | 'artistId' | 'releaseDate' | 'coverUrl'>
) {
  return request<ApiAlbum>('/api/albums', {
    method: 'POST',
    body: JSON.stringify(album),
  });
}
export function updateAlbum(
  id: number,
  album: Pick<ApiAlbum, 'title' | 'artistId' | 'releaseDate' | 'coverUrl'>
) {
  return request<void>(`/api/albums/${id}`, {
    method: 'PUT',
    body: JSON.stringify(album),
  });
}
export function deleteAlbum(id: number) {
  return request<void>(`/api/albums/${id}`, { method: 'DELETE' });
}
export function uploadAlbumCover(id: number, file: File) {
  return uploadFile<{ albumId: number; url: string }>(
    `/api/albums/${id}/cover`,
    'image',
    file
  );
}

export function createArtist(
  artist: Pick<ApiArtist, 'name' | 'biography' | 'photoUrl'>
) {
  return request<ApiArtist>('/api/artists', {
    method: 'POST',
    body: JSON.stringify(artist),
  });
}
export function updateArtist(
  id: number,
  artist: Pick<ApiArtist, 'name' | 'biography' | 'photoUrl'>
) {
  return request<void>(`/api/artists/${id}`, {
    method: 'PUT',
    body: JSON.stringify(artist),
  });
}
export function deleteArtist(id: number) {
  return request<void>(`/api/artists/${id}`, { method: 'DELETE' });
}
export function uploadArtistPhoto(id: number, file: File) {
  return uploadFile<{ artistId: number; photoUrl: string }>(
    `/api/artists/${id}/photo`,
    'image',
    file
  );
}

export function createGenre(name: string) {
  return request<Genre>('/api/genres', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}
export function updateGenre(id: number, name: string) {
  return request<void>(`/api/genres/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ name }),
  });
}
export function deleteGenre(id: number) {
  return request<void>(`/api/genres/${id}`, { method: 'DELETE' });
}
export function createMood(name: string) {
  return request<Mood>('/api/moods', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}
export function updateMood(id: number, name: string) {
  return request<void>(`/api/moods/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ name }),
  });
}
export function deleteMood(id: number) {
  return request<void>(`/api/moods/${id}`, { method: 'DELETE' });
}

type TrackPayload = Pick<
  ApiTrack,
  | 'title'
  | 'artistId'
  | 'albumId'
  | 'genreId'
  | 'moodId'
  | 'durationSeconds'
  | 'audioUrl'
  | 'coverUrl'
>;
export function createTrack(track: TrackPayload) {
  return request<ApiTrack>('/api/tracks', {
    method: 'POST',
    body: JSON.stringify(track),
  });
}
export function updateTrack(id: number, track: TrackPayload) {
  return request<void>(`/api/tracks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(track),
  });
}
export function deleteTrack(id: number) {
  return request<void>(`/api/tracks/${id}`, { method: 'DELETE' });
}
export function uploadTrackAudio(id: number, file: File) {
  return uploadFile<{ trackId: number; audioUrl: string }>(
    `/api/tracks/${id}/audio`,
    'audio',
    file
  );
}
export function uploadTrackCover(id: number, file: File) {
  return uploadFile<{ trackId: number; url: string }>(
    `/api/tracks/${id}/cover`,
    'image',
    file
  );
}
