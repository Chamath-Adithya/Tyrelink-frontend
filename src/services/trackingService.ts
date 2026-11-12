import { request } from './apiClient';
import mockTracking from '../data/tracking.json';

export interface TrackingTimelineStep {
  status: 'completed' | 'current' | 'upcoming';
  title: string;
  location: string;
  timestamp: string;
  description: string;
}

export interface TrackingResult {
  orderRef: string;
  currentStatus: string;
  carrier: string;
  estimatedDate: string;
  steps: TrackingTimelineStep[];
}

export async function trackOrder(orderId: string): Promise<TrackingResult | null> {
  const clean = orderId.trim().toUpperCase();
  try {
    const res = await request<TrackingResult>(`/v1/orders/${encodeURIComponent(clean)}`, {
      method: 'GET',
    });
    if (res && res.steps) return res;
  } catch (_) {}

  // Local fallback
  const found = (mockTracking as any[]).find(
    (t) => t.trackingNumber?.toUpperCase() === clean || t.orderId?.toUpperCase() === clean
  );

  if (found) {
    return {
      orderRef: found.orderId || found.trackingNumber,
      currentStatus: found.currentStatus,
      carrier: found.courierService,
      estimatedDate: found.estimatedDelivery,
      steps: found.steps,
    };
  }

  return null;
}

