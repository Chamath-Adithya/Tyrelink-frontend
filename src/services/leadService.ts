import { request } from './apiClient';

export interface OrderLeadPayload {
  orderRef: string;
  customerName: string;
  address: string;
  phone1: string;
  phone2?: string;
  paymentMethod: string;
  items: Array<{
    id: string;
    title: string;
    price: number;
    quantity: number;
    image?: string;
    selectedUpgrades?: string[];
  }>;
  subtotal: number;
  courierCharge: number;
  grandTotal: number;
  timestamp?: string;
}

export interface AdminLeadRecord {
  id: string;
  orderRef: string;
  customerName: string;
  phone1: string;
  phone2?: string;
  address: string;
  paymentMethod: string;
  subtotal: number;
  courierCharge: number;
  grandTotal: number;
  status: string;
  createdAt: string;
  items: Array<{
    id: string;
    title: string;
    price: number;
    quantity: number;
  }>;
}

export async function submitOrderLead(payload: OrderLeadPayload): Promise<{ success: boolean; leadId?: string }> {
  try {
    const res = await request<{ leadId: string }>('/v1/order-leads', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return { success: true, leadId: res?.leadId };
  } catch (err) {
    console.warn('[leadService] Failed to send order lead to backend:', err);
    return { success: false };
  }
}

export async function fetchAdminLeads(): Promise<AdminLeadRecord[]> {
  try {
    const res = await request<{ data: AdminLeadRecord[] }>('/v1/admin/leads', {
      method: 'GET',
    });
    return res?.data || [];
  } catch (err) {
    console.warn('[leadService] Failed to fetch admin leads from backend:', err);
    return [];
  }
}

