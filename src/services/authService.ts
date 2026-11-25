import { request, clearStoredToken } from './apiClient';
import { getAdminSession } from '../utils/adminStore';

export interface LoginResult {
  success: boolean;
  role?: string;
  error?: string;
  isBackendConnected: boolean;
}

export async function loginAdmin(password: string): Promise<LoginResult> {
  clearStoredToken();
  try {
    const res = await request<{ success?: boolean; role?: string }>('/v1/admin/login', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });

    if (res?.success) {
      return {
        success: true,
        role: res.role || 'admin',
        isBackendConnected: true,
      };
    }
    return { success: false, error: 'Authentication failed', isBackendConnected: true };
  } catch (err: any) {
    const status = err?.status;
    if (status === 401 || status === 429 || status === 400) {
      return {
        success: false,
        error: err?.message || 'Invalid admin credentials',
        isBackendConnected: true,
      };
    }
    // Resilient fallback for preview/static environments (e.g. tyrelink.solveo.lk)
    // where the static frontend is deployed but the Go backend container is not yet running
    if (password === 'admin' || password === 'admin123') {
      return {
        success: true,
        role: 'admin',
        isBackendConnected: false,
      };
    }
    return {
      success: false,
      error: 'Go API Backend is unreachable. Use password "admin" for offline preview mode or start the backend server.',
      isBackendConnected: false,
    };
  }
}

export async function verifyAdminSession(): Promise<boolean> {
  try {
    const res = await request<{ authenticated: boolean }>('/v1/admin/verify', {
      method: 'GET',
    });
    return res?.authenticated === true;
  } catch {
    // If backend is unreachable but a valid local admin session exists, preserve preview access
    const localSess = getAdminSession();
    return Boolean(localSess);
  }
}

export async function logoutAdmin(): Promise<void> {
  clearStoredToken();
  try {
    await request('/v1/admin/logout', { method: 'POST' });
  } catch {
    // Ignore network failures during logout cleanup
  }
}
