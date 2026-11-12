const configuredBase = import.meta.env.PUBLIC_API_BASE_URL?.replace(/\/$/, '');

// In production the reverse proxy exposes the Go service at /api. In local
// development PUBLIC_API_BASE_URL points to the Go process directly.
export const apiBase = configuredBase || '/api';

export const apiUrl = (path: string) => `${apiBase}${path.startsWith('/') ? path : `/${path}`}`;

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(apiUrl(path), {
    ...init,
    headers: { Accept: 'application/json', ...init?.headers },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}
