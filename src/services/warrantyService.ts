import { request } from './apiClient';
import mockWarranties from '../data/warranties.json';

export interface WarrantyVerification {
  invoice: string;
  dotCode?: string;
  productName?: string;
  customerName?: string;
  customerPhone?: string;
  startsAt?: string;
  endsAt?: string;
  status: string;
  warrantyType?: string;
  message?: string;
}

export async function verifyWarranty(query: string): Promise<WarrantyVerification | null> {
  const clean = query.trim().toUpperCase();
  try {
    const res = await request<WarrantyVerification>(`/v1/warranty/${encodeURIComponent(clean)}`, {
      method: 'GET',
    });
    if (res && res.status) return res;
  } catch (_) {}

  // Local fallback
  const found = (mockWarranties as any[]).find(
    (w) =>
      w.invoiceNumber?.toUpperCase() === clean ||
      w.dotCode?.toUpperCase() === clean ||
      w.serialNumber?.toUpperCase() === clean
  );

  if (found) {
    return {
      invoice: found.invoiceNumber,
      dotCode: found.dotCode || found.serialNumber,
      productName: found.productName,
      customerName: found.customerName,
      customerPhone: found.customerPhone,
      startsAt: found.purchaseDate,
      endsAt: found.expiryDate,
      status: found.status,
      warrantyType: found.warrantyType,
    };
  }

  return null;
}

