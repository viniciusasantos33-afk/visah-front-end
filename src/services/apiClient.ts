export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5291';
export const trackAudioEndpoint = (id: number) =>
  `${API_BASE_URL}/api/tracks/${id}/audio`;
const TOKEN_KEY = 'visah.auth.token';

export function getAuthToken() {
  return window.localStorage.getItem(TOKEN_KEY);
}

export function saveAuthToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

export async function request<T>(
  path: string,
  init: RequestInit = {},
  token = getAuthToken()
): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData))
    headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  if (!response.ok) {
    const responseText = await response.text().catch(() => '');
    let body: { message?: string; title?: string; detail?: string } | null =
      null;
    try {
      body = responseText
        ? (JSON.parse(responseText) as {
            message?: string;
            title?: string;
            detail?: string;
          })
        : null;
    } catch {
      // Non-JSON errors (such as the empty 401 returned by JWT middleware) use the status below.
    }
    const fallback =
      response.status === 401
        ? 'A API recusou a sessão (401). Confira o login e se o backend foi reiniciado.'
        : `A API respondeu com erro ${response.status}. Tente novamente.`;
    throw new Error(body?.message ?? body?.title ?? body?.detail ?? fallback);
  }
  if (response.status === 204) return undefined as T;
  const responseText = await response.text();
  if (!responseText.trim()) return undefined as T;
  try {
    return JSON.parse(responseText) as T;
  } catch {
    throw new Error('A API retornou uma resposta inválida.');
  }
}

export async function uploadFile<T>(path: string, field: string, file: File) {
  const form = new FormData();
  form.set(field, file);
  return request<T>(path, { method: 'POST', body: form });
}
