/**
 * Tyrelink Centralized API Client
 * Fetch wrapper with Bearer JWT + HttpOnly cookie credentials support,
 * environment-aware base URL, and structured API error serialization.
 */

const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    const envUrl = (import.meta as any).env?.PUBLIC_API_BASE_URL;
    if (envUrl) return envUrl.replace(/\/$/, '');

    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:8080';
    }
  }
  return '/api';
};

export const API_BASE_URL = getApiBaseUrl();

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
  ok: boolean;
}

const TOKEN_KEY = 'tyrelink_admin_jwt';

export function getStoredToken(): string | null {
  return null;
}

export function setStoredToken(_token: string, _remember: boolean = true) {
  // Authentication uses the backend HttpOnly session cookie exclusively; clear legacy tokens.
  clearStoredToken();
}

export function clearStoredToken() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
  } catch {}
}

export async function request<T = any>(
  endpoint: string,
  options: RequestInit & { timeoutMs?: number } = {}
): Promise<T> {
  const { timeoutMs = 10_000, ...fetchOpts } = options;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(fetchOpts.headers as Record<string, string>),
  };

  if (!(fetchOpts.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const controller = new AbortController();
  const timer = typeof window !== 'undefined' ? window.setTimeout(() => controller.abort(), timeoutMs) : null;
  if (fetchOpts.signal) {
    fetchOpts.signal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  try {
    const res = await fetch(url, {
      ...fetchOpts,
      credentials: 'include',
      headers,
      signal: controller.signal,
    });

    const contentType = res.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const data = isJson ? await res.json() : await res.text();

    // Detect static-server HTML fallback (e.g. Nginx SPA fallback on /api/* when Go API is not running)
    if (contentType.includes('text/html') || (typeof data === 'string' && data.trimStart().startsWith('<!DOCTYPE'))) {
      const err = new Error('Go API Backend is not reachable at this origin') as any;
      err.status = 503;
      err.isNetworkOrStaticFallback = true;
      throw err;
    }

    if (!res.ok) {
      const errMsg =
        typeof data === 'object' && data?.error
          ? data.error
          : `API error ${res.status}: ${res.statusText}`;
      const err = new Error(errMsg) as any;
      err.status = res.status;
      err.isNetworkOrStaticFallback = [405, 502, 503, 504].includes(res.status);
      err.data = data;
      throw err;
    }

    return data as T;
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      const timeoutErr = new Error('Request timed out on slow connection') as any;
      timeoutErr.status = 408;
      timeoutErr.isNetworkOrStaticFallback = true;
      throw timeoutErr;
    }
    if (err?.name === 'TypeError' && String(err?.message).toLowerCase().includes('fetch')) {
      err.isNetworkOrStaticFallback = true;
      console.warn(`[Tyrelink API] Backend unreachable at ${url}`);
    }
    throw err;
  } finally {
    if (timer !== null) window.clearTimeout(timer);
  }
}

export function isBackendUnavailableError(err: any): boolean {
  if (!err) return false;
  if (err.isNetworkOrStaticFallback) return true;
  const s = Number(err.status);
  if ([405, 408, 502, 503, 504].includes(s)) return true;
  if (err?.name === 'TypeError' && String(err?.message).toLowerCase().includes('fetch')) return true;
  return false;
}
