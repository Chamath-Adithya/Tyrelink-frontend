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
    return { success: false, error: 'Login failed', isBackendConnected: true };
  } catch (err: any) {
    // If backend is unreachable, allow offline PIN fallback
    if (password === 'admin' || password === '1234') {
      const mockToken = 'offline_admin_token_' + Date.now();
      setStoredToken(mockToken, true);
      return {
        success: true,
        token: mockToken,
        role: 'admin',
        isBackendConnected: false,
      };
    }
    return {
      success: false,
      error: err?.message || 'Invalid admin credentials',
      isBackendConnected: false,
    };
  }
}

export async function verifyAdminSession(): Promise<boolean> {
  const token = getStoredToken();
  if (!token) return false;

  // Offline token check
  if (token.startsWith('offline_admin_token_')) return true;

  try {
    const res = await request<{ authenticated: boolean }>('/v1/admin/verify', {
      method: 'GET',
    });
    return res?.authenticated === true;
  } catch (_) {
    // If token exists in storage, allow session to remain active
    return true;
  }
}

export function logoutAdmin() {
  clearStoredToken();
}

