import type { ApiFavorite } from '../types/catalog';
import { request } from './apiClient';

export function getFavorites() {
  return request<ApiFavorite[]>('/api/favorites');
}
export function addFavoriteTrack(id: number) {
  return request<void>(`/api/favorites/tracks/${id}`, { method: 'POST' });
}
export function removeFavoriteTrack(id: number) {
  return request<void>(`/api/favorites/tracks/${id}`, { method: 'DELETE' });
}
export function recordTrackPlay(id: number) {
  return request<void>(`/api/tracks/${id}/play`, { method: 'POST' });
}
