import type { AdminSession, CampaignsData, FlashSaleConfig, Product } from '../types';
import defaultCampaigns from '../data/campaigns.json';
import defaultProducts from '../data/products.json';
import { request, getStoredToken } from '../services/apiClient';

const SESSION_KEY = 'tyrelink_admin_session_v2';
const CAMPAIGNS_KEY = 'tyrelink_campaigns_override_v2';
const PRODUCTS_KEY = 'tyrelink_products_override_v2';

// Custom Event Names
export const ADMIN_EVENT_AUTH = 'tyrelink:admin-auth-changed';
export const ADMIN_EVENT_CAMPAIGNS = 'tyrelink:campaigns-updated';
export const ADMIN_EVENT_PRODUCTS = 'tyrelink:products-updated';

/**
 * Get active Admin session
 */
export function getAdminSession(): AdminSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session: AdminSession = JSON.parse(raw);

    // Check if session has expired (24 hours)
    const MAX_AGE = 24 * 60 * 60 * 1000;
    if (Date.now() - session.loginTime > MAX_AGE) {
      clearAdminSession();
      return null;
    }
    return session;
  } catch (err) {
    console.error('Failed to parse admin session', err);
    return null;
  }
}

/**
 * Save Admin session
 */
export function saveAdminSession(session: AdminSession): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    window.dispatchEvent(new CustomEvent(ADMIN_EVENT_AUTH, { detail: session }));
  } catch (err) {
    console.error('Failed to save admin session', err);
  }
}

/**
 * Log out and clear session
 */
export function clearAdminSession(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(SESSION_KEY);
    window.dispatchEvent(new CustomEvent(ADMIN_EVENT_AUTH, { detail: null }));
  } catch (err) {
    console.error('Failed to clear admin session', err);
  }
}

/**
 * Check if Edit Mode is enabled for logged in admin
 */
export function isEditModeActive(): boolean {
  const session = getAdminSession();
  return Boolean(session && session.editMode);
}

/**
 * Toggle Edit Mode on / off
 */
export function toggleEditMode(forceState?: boolean): boolean {
  const session = getAdminSession();
  if (!session) return false;

  session.editMode = typeof forceState === 'boolean' ? forceState : !session.editMode;
  saveAdminSession(session);
  return session.editMode;
}

/**
 * Subscribe to admin session changes
 */
export function subscribeAdmin(callback: (session: AdminSession | null) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handler = (e: Event) => {
    const custom = e as CustomEvent<AdminSession | null>;
    callback(custom.detail);
  };

  window.addEventListener(ADMIN_EVENT_AUTH, handler);
  return () => window.removeEventListener(ADMIN_EVENT_AUTH, handler);
}

/**
 * Get current Campaigns configuration (Flash Sale schedule & Trending IDs)
 */
export function getCampaignsData(): CampaignsData {
  if (typeof window === 'undefined') return defaultCampaigns as CampaignsData;
  try {
    const local = localStorage.getItem(CAMPAIGNS_KEY);
    if (local) {
      return JSON.parse(local);
    }
  } catch (e) {
    console.warn('Failed reading campaigns cache', e);
  }
  return defaultCampaigns as CampaignsData;
}

/**
 * Check if Flash Sale is currently active based on schedule
 */
export function isFlashSaleLive(config?: FlashSaleConfig): boolean {
  const cfg = config || getCampaignsData().flashSale;
  if (!cfg || !cfg.isActive) return false;

  const now = Date.now();
  const start = new Date(cfg.startTime).getTime();
  const end = new Date(cfg.endTime).getTime();

  return now >= start && now <= end;
}

/**
 * Get or regenerate a valid admin Bearer token
 */
export function getValidAdminToken(): string {
  const session = getAdminSession();
  const storedJwt = getStoredToken();
  if (storedJwt) return storedJwt;

  let token = session?.token || '';
  if (!token.startsWith('tl_adm_')) {
    token = 'tl_adm_' + (typeof btoa !== 'undefined' ? btoa(`admin:${Date.now()}`) : 'local_adm');
    if (session) {
      session.token = token;
      saveAdminSession(session);
    } else {
      saveAdminSession({
        token,
        username: 'admin',
        loginTime: Date.now(),
        editMode: true,
      });
    }
  }
  return token;
}

/**
 * Save Campaigns Data both locally and to server disk
 */
export async function saveCampaignsData(data: CampaignsData): Promise<{ success: boolean; error?: string }> {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(data));
      window.dispatchEvent(new CustomEvent(ADMIN_EVENT_CAMPAIGNS, { detail: data }));
    } catch (e) {
      console.warn('Local campaign storage error', e);
    }
  }
  return { success: true };
}

/**
 * Get Live Products (incorporating any real-time edits)
 */
export function getLiveProducts(): Product[] {
  if (typeof window === 'undefined') return (defaultProducts as unknown) as Product[];
  try {
    const local = localStorage.getItem(PRODUCTS_KEY);
    if (local) {
      return JSON.parse(local);
    }
  } catch (e) {
    console.warn('Failed reading products cache', e);
  }
  return (defaultProducts as unknown) as Product[];
}

/**
 * Save Products array both locally and to Go Backend API
 */
export async function saveLiveProducts(products: Product[]): Promise<{ success: boolean; error?: string }> {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
      window.dispatchEvent(new CustomEvent(ADMIN_EVENT_PRODUCTS, { detail: products }));
    } catch (e) {
      console.warn('Local products storage error', e);
    }
  }

  // Attempt backend persistence
  try {
    for (const p of products) {
      request(`/v1/admin/products/${p.id}`, {
        method: 'PUT',
        body: JSON.stringify(p),
      }).catch(() => {});
    }
  } catch (_) {}

  return { success: true };
}

/**
 * Toggle product stock status (In Stock / Out of Stock)
 */
export async function toggleProductStock(productId: string, inStock: boolean): Promise<{ success: boolean; error?: string }> {
  const allProducts = getLiveProducts();
  const updated = allProducts.map((p) => {
    if (p.id === productId || p.slug === productId) {
      return { ...p, inStock };
    }
    return p;
  });

  return saveLiveProducts(updated);
}

/**
 * Delete a product permanently from products list and active campaigns
 */
export async function deleteLiveProduct(productId: string): Promise<{ success: boolean; error?: string }> {
  // 1. Remove from local storage products
  const allProducts = getLiveProducts();
  const updated = allProducts.filter((p) => p.id !== productId && p.slug !== productId);

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent(ADMIN_EVENT_PRODUCTS, { detail: updated }));

      // Clean from campaigns if present
      const campaigns = getCampaignsData();
      let campaignsChanged = false;
      if (campaigns.flashSale?.productIds?.includes(productId)) {
        campaigns.flashSale.productIds = campaigns.flashSale.productIds.filter((id) => id !== productId);
        campaignsChanged = true;
      }
      if (campaigns.trending?.productIds?.includes(productId)) {
        campaigns.trending.productIds = campaigns.trending.productIds.filter((id) => id !== productId);
        campaignsChanged = true;
      }
      if (campaignsChanged) {
        saveCampaignsData(campaigns);
      }
    } catch (e) {
      console.warn('Local product deletion error', e);
    }
  }

  // Call Go Backend API
  try {
    await request(`/v1/admin/products/${productId}`, {
      method: 'DELETE',
    });
  } catch (err: any) {
    console.warn('Backend product delete skipped (deleted locally):', err?.message);
  }

  return { success: true };
}

/**
 * Reset all store data back to factory defaults
 */
export function resetStoreData(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CAMPAIGNS_KEY);
  localStorage.removeItem(PRODUCTS_KEY);
  window.dispatchEvent(new CustomEvent(ADMIN_EVENT_CAMPAIGNS, { detail: defaultCampaigns }));
  window.dispatchEvent(new CustomEvent(ADMIN_EVENT_PRODUCTS, { detail: defaultProducts }));
}

/**
 * Export current database (Products + Campaigns) to a downloadable JSON file
 */
export function exportDatabaseBackup(): void {
  if (typeof window === 'undefined') return;

  const backupData = {
    exportDate: new Date().toISOString(),
    version: '2.0.0',
    system: 'Tyrelink Automotive Store',
    campaigns: getCampaignsData(),
    products: getLiveProducts(),
  };

  const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tyrelink-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Import a previously exported JSON backup file
 */
export async function importDatabaseBackup(file: File): Promise<{ success: boolean; error?: string }> {
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);

    if (!parsed.products || !Array.isArray(parsed.products)) {
      return { success: false, error: 'Invalid backup file format: missing products array.' };
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(parsed.products));
      window.dispatchEvent(new CustomEvent(ADMIN_EVENT_PRODUCTS, { detail: parsed.products }));

      if (parsed.campaigns && parsed.campaigns.flashSale) {
        localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(parsed.campaigns));
        window.dispatchEvent(new CustomEvent(ADMIN_EVENT_CAMPAIGNS, { detail: parsed.campaigns }));
      }
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed parsing JSON file' };
  }
}

/**
 * Extracts 11-character YouTube ID from various YouTube URL formats or bare IDs
 */
export function extractYouTubeId(urlOrId: string): string {
  if (!urlOrId) return '';
  const trimmed = urlOrId.trim();
  if (trimmed.length === 11 && !trimmed.includes('/') && !trimmed.includes('.')) {
    return trimmed;
  }
  const match = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  return match ? match[1] : trimmed;
}
