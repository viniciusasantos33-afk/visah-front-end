import type {
  ApiAlbum,
  ApiArtist,
  Genre,
  Mood,
  PagedTracks,
} from '../types/catalog';
import { request } from './apiClient';

export function getTracks(
  query: {
    search?: string;
    genreId?: number | null;
    moodId?: number | null;
    page?: number;
    pageSize?: number;
  } = {}
) {
  const params = new URLSearchParams();
  if (query.search) params.set('search', query.search);
  if (query.genreId != null) params.set('genreId', String(query.genreId));
  if (query.moodId != null) params.set('moodId', String(query.moodId));
  params.set('page', String(query.page ?? 1));
  params.set('pageSize', String(query.pageSize ?? 100));
  return request<PagedTracks>(`/api/tracks?${params.toString()}`);
}

export async function getAllTracks(
  query: {
    search?: string;
    genreId?: number | null;
    moodId?: number | null;
  } = {}
) {
  const firstPage = await getTracks({ ...query, page: 1, pageSize: 100 });
  const pages = Math.ceil(firstPage.total / firstPage.pageSize);
  if (pages <= 1) return firstPage.items;
  const rest = await Promise.all(
    Array.from({ length: pages - 1 }, (_, index) =>
      getTracks({ ...query, page: index + 2, pageSize: firstPage.pageSize })
    )
  );
  return [...firstPage.items, ...rest.flatMap((page) => page.items)];
}

export function getArtists() {
  return request<ApiArtist[]>('/api/artists');
}
export function getAlbums() {
  return request<ApiAlbum[]>('/api/albums');
}
export function getGenres() {
  return request<Genre[]>('/api/genres');
}
export function getMoods() {
  return request<Mood[]>('/api/moods');
}
