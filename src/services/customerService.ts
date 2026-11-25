import { request } from './apiClient';
export interface Review {
  photoDataUrl?: string;
  id: string;
  productId: string;
  name: string;
  rating: number;
  text: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}
export interface DeliveryRate {
  town: string;
  fee: number;
  estimate: string;
}
export async function getReviews(productId: string): Promise<Review[]> {
  const res = await request<{ data: Review[] }>(`/v1/products/${encodeURIComponent(productId)}/reviews`);
  return res.data || [];
}
export async function submitReview(
  productId: string,
  review: { name: string; rating: number; text: string; photoDataUrl?: string }
): Promise<void> {
  await request(`/v1/products/${encodeURIComponent(productId)}/reviews`, {
    method: 'POST',
    body: JSON.stringify(review),
  });
}
const DEFAULT_FLAT_RATE: DeliveryRate = {
  town: 'Islandwide',
  fee: 450,
  estimate: '1–3 working days islandwide',
};
const FLAT_RATE_LOCAL_KEY = 'tyrelink_flat_delivery_v1';
let flatRateCache: { value: DeliveryRate; expiresAt: number } | null = null;
let flatRateInFlight: Promise<DeliveryRate> | null = null;

export function invalidateDeliveryRateCache(): void {
  flatRateCache = null;
  flatRateInFlight = null;
}

export function saveFlatDeliveryRateLocal(rate: DeliveryRate): void {
  invalidateDeliveryRateCache();
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(FLAT_RATE_LOCAL_KEY, JSON.stringify(rate));
    } catch {}
  }
  flatRateCache = { value: rate, expiresAt: Date.now() + 30_000 };
}

function getLocalFlatDeliveryRate(): DeliveryRate {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(FLAT_RATE_LOCAL_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.fee === 'number') return parsed;
      }
    } catch {}
  }
  return DEFAULT_FLAT_RATE;
}

export async function getFlatDeliveryRate(): Promise<DeliveryRate> {
  if (flatRateCache && Date.now() < flatRateCache.expiresAt) {
    return flatRateCache.value;
  }
  if (flatRateInFlight) {
    return flatRateInFlight;
  }

  flatRateInFlight = (async () => {
    try {
      const res = await request<{ data?: DeliveryRate[]; flatRate?: DeliveryRate }>('/v1/delivery-rates');
      const resolved = res.flatRate || (res.data && res.data.length > 0 ? res.data[0] : getLocalFlatDeliveryRate());
      flatRateCache = { value: resolved, expiresAt: Date.now() + 30_000 };
      return resolved;
    } catch {
      return getLocalFlatDeliveryRate();
    } finally {
      flatRateInFlight = null;
    }
  })();

  return flatRateInFlight;
}

export async function getDeliveryRates(): Promise<DeliveryRate[]> {
  const rate = await getFlatDeliveryRate();
  return [rate];
}
