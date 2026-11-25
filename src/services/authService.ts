import { request, setStoredToken, clearStoredToken, getStoredToken } from './apiClient';

export interface LoginResult {
  success: boolean;
  token?: string;
  role?: string;
  error?: string;
  isBackendConnected: boolean;
}

export async function loginAdmin(password: string): Promise<LoginResult> {
  try {
    const res = await request<{ token: string; role: string }>('/v1/admin/login', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });

    if (res?.token) {
      setStoredToken(res.token, true);
      return {
        success: true,
        token: res.token,
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
    return {
      success: false,
      error: 'Go API Backend is unreachable. Start the backend server to sign in.',
      isBackendConnected: false,
    };
  }
}

export async function verifyAdminSession(): Promise<boolean> {
  const token = getStoredToken();
  if (!token) return false;

  try {
    const res = await request<{ authenticated: boolean }>('/v1/admin/verify', {
      method: 'GET',
    });
    return res?.authenticated === true;
  } catch (err: any) {
    if (err?.status === 401) {
      clearStoredToken();
      return false;
    }
    return false;
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
