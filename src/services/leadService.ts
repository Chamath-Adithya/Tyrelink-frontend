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
  // Always persist to localStorage for instant local CRM access
  try {
    if (typeof window !== 'undefined') {
      const localLeads: AdminLeadRecord[] = JSON.parse(localStorage.getItem('tyrelink_order_leads') || '[]');
      const newRecord: AdminLeadRecord = {
        id: 'lead-' + Date.now(),
        orderRef: payload.orderRef,
        customerName: payload.customerName,
        phone1: payload.phone1,
        phone2: payload.phone2,
        address: payload.address,
        paymentMethod: payload.paymentMethod,
        subtotal: payload.subtotal,
        courierCharge: payload.courierCharge,
        grandTotal: payload.grandTotal,
        status: 'pending',
        createdAt: new Date().toISOString(),
        items: payload.items.map(it => ({
          id: it.id,
          title: it.title,
          price: it.price,
          quantity: it.quantity,
        })),
      };
      localLeads.unshift(newRecord);
      localStorage.setItem('tyrelink_order_leads', JSON.stringify(localLeads.slice(0, 50)));
    }
  } catch (e) {
    console.error('[leadService] local storage save error', e);
  }

  try {
    const res = await request<{ leadId: string }>('/v1/order-leads', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return { success: true, leadId: res?.leadId };
  } catch (err) {
    console.warn('[leadService] Backend offline, order stored in local storage:', err);
    return { success: true };
  }
}

export async function fetchAdminLeads(): Promise<AdminLeadRecord[]> {
  try {
    const res = await request<{ data: AdminLeadRecord[] }>('/v1/admin/leads', {
      method: 'GET',
    });
    if (res?.data && res.data.length > 0) {
      return res.data;
    }
  } catch (err) {
    console.warn('[leadService] Backend offline, reading from local CRM store:', err);
  }

  // Graceful fallback to local CRM store
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('tyrelink_order_leads');
      if (stored) {
        return JSON.parse(stored);
      }
    }
  } catch (e) {
    console.error('[leadService] error reading local leads', e);
  }
  return [];
}

