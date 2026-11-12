import { request } from './apiClient';
import type { Product } from '../types';
import localProducts from '../data/products.json';

export async function fetchProducts(): Promise<{ products: Product[]; isBackend: boolean }> {
  try {
    const res = await request<{ data: Product[] }>('/v1/products', { method: 'GET' });
    if (Array.isArray(res?.data) && res.data.length > 0) {
      return { products: res.data, isBackend: true };
    }
  } catch (err) {
    console.warn('[productService] Backend products fetch failed, using local seed:', err);
  }
  return { products: localProducts as Product[], isBackend: false };
}

export async function fetchProductById(idOrSlug: string): Promise<Product | null> {
  try {
    const p = await request<Product>(`/v1/products/${idOrSlug}`, { method: 'GET' });
    if (p?.id) return p;
  } catch (_) {}

  const found = (localProducts as Product[]).find(
    (p) => p.id === idOrSlug || p.slug === idOrSlug
  );
  return found || null;
}

export async function createAdminProduct(product: Partial<Product>): Promise<{ success: boolean; product?: Product }> {
  try {
    const res = await request<{ success: boolean; product: Product }>('/v1/admin/products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
    return { success: true, product: res?.product };
  } catch (err: any) {
    console.warn('[productService] Backend product creation failed, falling back to local:', err);
    return { success: false };
  }
}

export async function updateAdminProduct(id: string, product: Partial<Product>): Promise<{ success: boolean }> {
  try {
    await request(`/v1/admin/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(product),
    });
    return { success: true };
  } catch (err: any) {
    console.warn('[productService] Backend product update failed, falling back to local:', err);
    return { success: false };
  }
}

export async function deleteAdminProduct(id: string): Promise<{ success: boolean }> {
  try {
    await request(`/v1/admin/products/${id}`, {
      method: 'DELETE',
    });
    return { success: true };
  } catch (err: any) {
    console.warn('[productService] Backend product delete failed, falling back to local:', err);
    return { success: false };
  }
}

