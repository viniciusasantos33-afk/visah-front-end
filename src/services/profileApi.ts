import type { UserProfile } from './models';
import { request } from './apiClient';

export function getProfile() {
  return request<UserProfile>('/api/profile');
}

export function updateProfile(
  profile: Pick<UserProfile, 'name' | 'photoUrl'> & { password?: string | null }
) {
  return request<void>('/api/profile', {
    method: 'PUT',
    body: JSON.stringify({ ...profile, password: profile.password || null }),
  });
}
