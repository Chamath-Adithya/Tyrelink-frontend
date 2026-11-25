import type { AdminSession, CampaignsData, FlashSaleConfig, Product } from '../types';
import defaultCampaigns from '../data/campaigns.json';
import defaultProducts from '../data/products.json';
import { request, clearStoredToken } from '../services/apiClient';
import { createAdminProduct, updateAdminProduct, deleteAdminProduct, saveCampaignsToApi, invalidateProductCache } from '../services/productService';

const SESSION_KEY = 'tyrelink_admin_session_v2';
const CAMPAIGNS_KEY = 'tyrelink_campaigns_override_v2';
const PRODUCTS_KEY = 'tyrelink_products_override_v2';

// Custom Event Names
export const ADMIN_EVENT_AUTH = 'tyrelink:admin-auth-changed';
export const ADMIN_EVENT_CAMPAIGNS = 'tyrelink:campaigns-updated';
export const ADMIN_EVENT_PRODUCTS = 'tyrelink:products-updated';

export function getAdminSession(): AdminSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session: AdminSession = JSON.parse(raw);

    // Non-secret UI state only; real authorization relies on HttpOnly session cookie (12h expiry)
    clearStoredToken();
    const MAX_AGE = 12 * 60 * 60 * 1000;
    if (!session.loginTime || Date.now() - session.loginTime > MAX_AGE) {
      clearAdminSession();
      return null;
    }
    return session;
  } catch (err) {
    console.error('Failed to parse admin session', err);
    return null;
  }
}

export function saveAdminSession(session: AdminSession): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    window.dispatchEvent(new CustomEvent(ADMIN_EVENT_AUTH, { detail: session }));
  } catch (err) {
    console.error('Failed to save admin session', err);
  }
}

export function clearAdminSession(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(SESSION_KEY);
    clearStoredToken();
    window.dispatchEvent(new CustomEvent(ADMIN_EVENT_AUTH, { detail: null }));
  } catch (err) {
    console.error('Failed to clear admin session', err);
  }
}

export function isEditModeActive(): boolean {
  const session = getAdminSession();
  return Boolean(session && session.editMode);
}

export function toggleEditMode(forceState?: boolean): boolean {
  const session = getAdminSession();
  if (!session) return false;

  session.editMode = typeof forceState === 'boolean' ? forceState : !session.editMode;
  saveAdminSession(session);
  return session.editMode;
}

export function subscribeAdmin(callback: (session: AdminSession | null) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handler = (e: Event) => {
    const custom = e as CustomEvent<AdminSession | null>;
    callback(custom.detail);
  };

  window.addEventListener(ADMIN_EVENT_AUTH, handler);
  return () => window.removeEventListener(ADMIN_EVENT_AUTH, handler);
}

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

export function isFlashSaleLive(config?: FlashSaleConfig): boolean {
  const cfg = config || getCampaignsData().flashSale;
  if (!cfg || !cfg.isActive) return false;

  const now = Date.now();
  const start = new Date(cfg.startTime).getTime();
  const end = new Date(cfg.endTime).getTime();

  return now >= start && now <= end;
}

/**
 * Save Campaigns Data to Go API Backend + localStorage cache
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
  const apiRes = await saveCampaignsToApi(data);
  if (!apiRes.success) {
    return {
      success: false,
      error: apiRes.error || 'Saved in browser only. Sign in and ensure API is connected to persist.',
    };
  }
  return { success: true };
}

export function getLiveProducts(): Product[] {
  if (typeof window === 'undefined') return defaultProducts as unknown as Product[];
  try {
    const local = localStorage.getItem(PRODUCTS_KEY);
    if (local) {
      return JSON.parse(local);
    }
  } catch (e) {
    console.warn('Failed reading products cache', e);
  }
  return defaultProducts as unknown as Product[];
}

export function setLocalProductsCache(products: Product[]): void {
  if (typeof window === 'undefined') return;
  invalidateProductCache();
  try {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
    window.dispatchEvent(new CustomEvent(ADMIN_EVENT_PRODUCTS, { detail: products }));
  } catch (e) {
    console.warn('Local products storage error', e);
  }
}

/**
 * Persist a single created or updated product to Go API Backend + local cache
 */
export async function saveSingleProduct(
  product: Product,
  isNew: boolean
): Promise<{ success: boolean; product?: Product; error?: string }> {
  const payload = {
    ...product,
    size: product.specs?.['Size'] || (product as any).size || '',
  };

  const apiRes = isNew
    ? await createAdminProduct(payload)
    : await updateAdminProduct(product.id, payload);

  const savedProduct = apiRes.product || product;
  const allProducts = getLiveProducts();
  const updatedList = isNew
    ? [savedProduct, ...allProducts.filter((p) => p.id !== savedProduct.id)]
    : allProducts.map((p) => (p.id === savedProduct.id ? savedProduct : p));
  setLocalProductsCache(updatedList);

  if (!apiRes.success) {
    return {
      success: false,
      error: apiRes.error || 'Saved in this browser only. Sign in and connect the API to publish.',
    };
  }
  return { success: true, product: savedProduct };
}

/**
 * Legacy multi-product updater (used by batch tools); updates only changed items or persists bulk stock/flags
 */
export async function saveLiveProducts(products: Product[]): Promise<{ success: boolean; error?: string }> {
  setLocalProductsCache(products);
  try {
    for (const p of products) {
      await request(`/v1/admin/products/${encodeURIComponent(p.id)}`, {
        method: 'PUT',
        body: JSON.stringify({ ...p, name: p.title }),
      });
    }
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Saved in this browser only. Sign in and connect the API to publish.',
    };
  }
  return { success: true };
}

/**
 * Toggle single product stock availability cleanly without touching all other products
 */
export async function toggleProductStock(productId: string, inStock: boolean): Promise<{ success: boolean; error?: string }> {
  const allProducts = getLiveProducts();
  const target = allProducts.find((p) => p.id === productId || p.slug === productId);
  if (!target) return { success: false, error: 'Product not found' };

  const updatedProduct: Product = {
    ...target,
    inStock,
    stockCount: inStock ? Math.max(1, target.stockCount || 5) : 0,
  };
  return saveSingleProduct(updatedProduct, false);
}

/**
 * Delete a product from local cache, campaigns, and Go Backend API
 */
export async function deleteLiveProduct(productId: string, permanent = false): Promise<{ success: boolean; error?: string }> {
  const allProducts = getLiveProducts();
  const updated = allProducts.filter((p) => p.id !== productId && p.slug !== productId);
  setLocalProductsCache(updated);

  if (typeof window !== 'undefined') {
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
      await saveCampaignsData(campaigns);
    }
  }

  const res = await deleteAdminProduct(productId, permanent);
  if (!res.success) {
    return { success: false, error: res.error || 'Could not remove from backend database' };
  }
  return { success: true };
}

export function resetStoreData(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CAMPAIGNS_KEY);
  localStorage.removeItem(PRODUCTS_KEY);
  window.dispatchEvent(new CustomEvent(ADMIN_EVENT_CAMPAIGNS, { detail: defaultCampaigns }));
  window.dispatchEvent(new CustomEvent(ADMIN_EVENT_PRODUCTS, { detail: defaultProducts }));
}

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

export async function importDatabaseBackup(file: File): Promise<{ success: boolean; error?: string }> {
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);

    if (!parsed.products || !Array.isArray(parsed.products)) {
      return { success: false, error: 'Invalid backup file format: missing products array.' };
    }

    setLocalProductsCache(parsed.products);

    if (parsed.campaigns && parsed.campaigns.flashSale) {
      await saveCampaignsData(parsed.campaigns);
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed parsing JSON file' };
  }
}

export function extractYouTubeId(urlOrId: string): string {
  if (!urlOrId) return '';
  const trimmed = urlOrId.trim();
  if (trimmed.length === 11 && !trimmed.includes('/') && !trimmed.includes('.')) {
    return trimmed;
  }
  const match = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  return match ? match[1] : trimmed;
}
