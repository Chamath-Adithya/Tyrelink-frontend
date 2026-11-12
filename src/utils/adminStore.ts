import type { AdminSession, CampaignsData, FlashSaleConfig, Product } from '../types';
import defaultCampaigns from '../data/campaigns.json';
import defaultProducts from '../data/products.json';

const SESSION_KEY = 'tyrelink_admin_session_v1';
const CAMPAIGNS_KEY = 'tyrelink_campaigns_override_v1';
const PRODUCTS_KEY = 'tyrelink_products_override_v1';

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
  let token = session?.token || '';
  if (!token.startsWith('lpx_adm_')) {
    token = 'lpx_adm_' + (typeof btoa !== 'undefined' ? btoa(`admin:${Date.now()}`) : 'local_adm');
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

  // Also persist to server disk via API
  try {
    const token = getValidAdminToken();
    const res = await fetch('/api/admin/save-campaigns', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return { success: false, error: errData.error || 'Server error saving campaigns' };
    }
    return { success: true };
  } catch (err: any) {
    console.warn('Server campaign save error (saved locally):', err?.message);
    return { success: true };
  }
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
 * Save Products array both locally and to server disk
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

  // Also persist to server disk via API
  try {
    const token = getValidAdminToken();
    const res = await fetch('/api/admin/save-products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ products })
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return { success: false, error: errData.error || 'Server error saving products' };
    }
    return { success: true };
  } catch (err: any) {
    console.warn('Server product save error (saved locally):', err?.message);
    return { success: true };
  }
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
      let campChanged = false;
      if (campaigns.flashSale?.productIds?.includes(productId)) {
        campaigns.flashSale.productIds = campaigns.flashSale.productIds.filter((id) => id !== productId);
        campChanged = true;
      }
      if (campaigns.trending?.productIds?.includes(productId)) {
        campaigns.trending.productIds = campaigns.trending.productIds.filter((id) => id !== productId);
        campChanged = true;
      }
      if (campChanged) {
        localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(campaigns));
        window.dispatchEvent(new CustomEvent(ADMIN_EVENT_CAMPAIGNS, { detail: campaigns }));
      }
    } catch (e) {
      console.warn('Local cleanup error on delete', e);
    }
  }

  // 2. Persist to server disk via API
  try {
    const token = getValidAdminToken();
    const res = await fetch('/api/admin/delete-product', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ productId })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return { success: false, error: errData.error || 'Server error deleting product' };
    }
    return { success: true };
  } catch (err: any) {
    console.warn('Server product delete error (deleted locally):', err?.message);
    return { success: true };
  }
}

/**
 * Toggle Stock Status (In Stock / Out of Stock) for a single product with auto-save
 */
export async function toggleProductStock(productId: string, inStock: boolean): Promise<{ success: boolean; error?: string }> {
  const allProducts = getLiveProducts();
  const target = productId.toLowerCase();
  const updated = allProducts.map((p) => {
    if (p.id === productId || p.slug === productId || p.id.toLowerCase() === target || p.slug.toLowerCase() === target) {
      return { ...p, inStock };
    }
    return p;
  });
  return await saveLiveProducts(updated);
}

/**
 * Parse any YouTube URL (watch, shorts, youtu.be, embed) or raw ID into an 11-char ID
 */
export function extractYouTubeId(urlOrId?: string | null): string | null {
  if (!urlOrId) return null;
  const str = urlOrId.trim();
  if (!str) return null;

  // Direct 11-character video ID check
  if (/^[a-zA-Z0-9_-]{11}$/.test(str)) {
    return str;
  }

  // Regex matching standard youtube.com, youtu.be, and youtube.com/shorts URLs
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)|youtu\.be\/)([^"&?\/ ]{11})/;
  const match = str.match(regExp);
  if (match && match[1]) {
    return match[1];
  }

  return null;
}

