import { request } from './apiClient';
import type { CampaignsData, Product } from '../types';
import localProducts from '../data/products.json';

const normalize = (p: Product & { name?: string }): Product => ({
  ...p,
  title: p.title || p.name || '',
  specs: p.specs || {},
  images: Array.isArray(p.images) && p.images.length > 0 ? p.images : [p.featuredImage || '/hero-tyre.png'],
});

export interface AdminStatsSummary {
  totalProducts: number;
  publishedProducts: number;
  outOfStockProducts: number;
  flashDealCount: number;
  bestSellerCount: number;
  totalLeads: number;
  newLeads: number;
  contactedLeads: number;
  dispatchedLeads: number;
  deliveredLeads: number;
  leadsPipelineLkr: number;
  pendingReviews: number;
  approvedReviews: number;
  flatDeliveryFee: number;
  postgresConnected: boolean;
  redisConnected: boolean;
}

export interface AuditLogEntry {
  id: string;
  actor: string;
  action: string;
  entityType: string;
  entityId: string;
  details?: Record<string, any>;
  createdAt: string;
}

const CACHE_TTL_MS = 15_000;
let productsCache: { value: { products: Product[]; isBackend: boolean }; expiresAt: number } | null = null;
let productsInFlight: Promise<{ products: Product[]; isBackend: boolean }> | null = null;
const productByIdCache = new Map<string, { value: Product | null; expiresAt: number }>();
const productByIdInFlight = new Map<string, Promise<Product | null>>();

export function invalidateProductCache(): void {
  productsCache = null;
  productsInFlight = null;
  productByIdCache.clear();
  productByIdInFlight.clear();
}

export async function fetchProducts(): Promise<{ products: Product[]; isBackend: boolean }> {
  const now = Date.now();
  if (productsCache && now < productsCache.expiresAt) {
    return productsCache.value;
  }
  if (productsInFlight) {
    return productsInFlight;
  }

  productsInFlight = (async () => {
    try {
      const res = await request<{ data: Product[] }>('/v1/products', { method: 'GET' });
      if (Array.isArray(res?.data) && res.data.length > 0) {
        const result = { products: res.data.map(normalize), isBackend: true };
        productsCache = { value: result, expiresAt: Date.now() + CACHE_TTL_MS };
        return result;
      }
    } catch (err) {
      console.warn('[productService] Backend products fetch failed, using local seed:', err);
    } finally {
      productsInFlight = null;
    }
    return { products: localProducts as unknown as Product[], isBackend: false };
  })();

  return productsInFlight;
}

export async function fetchProductById(idOrSlug: string): Promise<Product | null> {
  const cached = productByIdCache.get(idOrSlug);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.value;
  }
  const existing = productByIdInFlight.get(idOrSlug);
  if (existing) return existing;

  const job = (async () => {
    try {
      const p = await request<Product>(`/v1/products/${encodeURIComponent(idOrSlug)}`, { method: 'GET' });
      if (p?.id) {
        const norm = normalize(p);
        productByIdCache.set(idOrSlug, { value: norm, expiresAt: Date.now() + CACHE_TTL_MS });
        return norm;
      }
    } catch {} finally {
      productByIdInFlight.delete(idOrSlug);
    }

    const found = (localProducts as unknown as Product[]).find(
      (p) => p.id === idOrSlug || p.slug === idOrSlug
    );
    return found ? normalize(found) : null;
  })();

  productByIdInFlight.set(idOrSlug, job);
  return job;
}

export async function createAdminProduct(product: Partial<Product>): Promise<{ success: boolean; product?: Product; error?: string }> {
  try {
    const res = await request<{ success: boolean; product: Product }>('/v1/admin/products', {
      method: 'POST',
      body: JSON.stringify({ ...product, name: product.title || (product as any).name }),
    });
    return { success: true, product: res?.product ? normalize(res.product) : undefined };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed creating product' };
  }
}

export async function updateAdminProduct(id: string, product: Partial<Product>): Promise<{ success: boolean; product?: Product; error?: string }> {
  try {
    const res = await request<{ success: boolean; product?: Product }>(`/v1/admin/products/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify({ ...product, name: product.title || (product as any).name }),
    });
    return { success: true, product: res?.product ? normalize(res.product) : undefined };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed updating product' };
  }
}

export async function deleteAdminProduct(id: string, permanent = false): Promise<{ success: boolean; error?: string }> {
  try {
    const qs = permanent ? '?permanent=true' : '';
    await request(`/v1/admin/products/${encodeURIComponent(id)}${qs}`, {
      method: 'DELETE',
    });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed deleting product' };
  }
}

export async function fetchCampaignsFromApi(): Promise<CampaignsData | null> {
  try {
    return await request<CampaignsData>('/v1/campaigns', { method: 'GET' });
  } catch {
    return null;
  }
}

export async function saveCampaignsToApi(data: CampaignsData): Promise<{ success: boolean; error?: string }> {
  try {
    await request('/v1/admin/campaigns', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed saving campaigns' };
  }
}

export async function fetchAdminStats(): Promise<AdminStatsSummary> {
  return request<AdminStatsSummary>('/v1/admin/stats', { method: 'GET' });
}

export async function fetchAdminAuditLogs(): Promise<AuditLogEntry[]> {
  const res = await request<{ data: AuditLogEntry[] }>('/v1/admin/audit-logs', { method: 'GET' });
  return res?.data || [];
}

export async function deleteAdminReview(id: string): Promise<void> {
  await request(`/v1/admin/reviews/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
