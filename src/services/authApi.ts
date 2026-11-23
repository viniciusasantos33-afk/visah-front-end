import { clearAuthToken, request } from './apiClient';

export async function signIn(email: string, password: string) {
  return request<{ token: string }>(
    '/api/auth/login',
    { method: 'POST', body: JSON.stringify({ email, password }) },
    null
  );
}

export async function signUp(name: string, email: string, password: string) {
  return request<{ token: string }>(
    '/api/auth/register',
    { method: 'POST', body: JSON.stringify({ name, email, password }) },
    null
  );
}

export async function signOut() {
  try {
    await request('/api/auth/logout', { method: 'POST' });
  } finally {
    clearAuthToken();
  }
}
