// Compatibility barrel. Prefer importing from the domain modules in new code.
export {
  API_BASE_URL,
  clearAuthToken,
  getAuthToken,
  request,
  saveAuthToken,
  trackAudioEndpoint,
  uploadFile,
} from './apiClient';
export { signIn, signOut, signUp } from './authApi';
export * from './catalogApi';
export * from './favoritesApi';
export * from './profileApi';
export * from './adminApi';
export type { AdminUser, UserProfile } from './models';
