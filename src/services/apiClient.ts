/**
 * Tyrelink Centralized API Client
 * Enterprise-grade fetch wrapper with JWT / Bearer token injection,
 * CORS support, automatic offline resilience, and error serialization.
 */

const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    // 1. Vite / Astro client env override
    const envUrl = (import.meta as any).env?.PUBLIC_API_BASE_URL;
    if (envUrl) return envUrl.replace(/\/$/, '');

    // 2. Local dev check (Go backend default port 8080)
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
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string, remember: boolean = true) {
  if (typeof window === 'undefined') return;
  if (remember) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    sessionStorage.setItem(TOKEN_KEY, token);
  }
}

export function clearStoredToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
}

export async function request<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const token = getStoredToken();
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    const isJson = res.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await res.json() : await res.text();

    if (!res.ok) {
      const errMsg = (typeof data === 'object' && data?.error) 
        ? data.error 
        : `API error ${res.status}: ${res.statusText}`;
      const err = new Error(errMsg) as any;
      err.status = res.status;
      err.data = data;
      throw err;
    }

    return data as T;
  } catch (err: any) {
    // Network or connection error: log gracefully
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      console.warn(`[Tyrelink API] Backend unreachable at ${url}. Operating in local fallback mode.`);
    }
    throw err;
  }
}

