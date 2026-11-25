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

export async function fetchProducts(): Promise<{ products: Product[]; isBackend: boolean }> {
  try {
    const res = await request<{ data: Product[] }>('/v1/products', { method: 'GET' });
    if (Array.isArray(res?.data) && res.data.length > 0) {
      return { products: res.data.map(normalize), isBackend: true };
    }
  } catch (err) {
    console.warn('[productService] Backend products fetch failed, using local seed:', err);
  }
  return { products: localProducts as unknown as Product[], isBackend: false };
}

export async function fetchProductById(idOrSlug: string): Promise<Product | null> {
  try {
    const p = await request<Product>(`/v1/products/${encodeURIComponent(idOrSlug)}`, { method: 'GET' });
    if (p?.id) return normalize(p);
  } catch {}

  const found = (localProducts as unknown as Product[]).find(
    (p) => p.id === idOrSlug || p.slug === idOrSlug
  );
  return found || null;
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
