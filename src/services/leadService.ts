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
  adminNotes?: string;
  createdAt: string;
  updatedAt?: string;
  items: Array<{
    id: string;
    title: string;
    price: number;
    quantity: number;
  }>;
}

export async function submitOrderLead(payload: OrderLeadPayload): Promise<{ success: boolean; leadId?: string }> {
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
        status: 'new',
        createdAt: new Date().toISOString(),
        items: payload.items.map((it) => ({
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

export async function fetchAdminLeads(filters?: { status?: string; q?: string }): Promise<AdminLeadRecord[]> {
  try {
    const params = new URLSearchParams();
    if (filters?.status && filters.status !== 'all') params.set('status', filters.status);
    if (filters?.q?.trim()) params.set('q', filters.q.trim());
    const qs = params.toString() ? `?${params.toString()}` : '';

    const res = await request<{ data: AdminLeadRecord[] }>(`/v1/admin/leads${qs}`, {
      method: 'GET',
    });
    if (Array.isArray(res?.data)) {
      return res.data;
    }
  } catch (err) {
    console.warn('[leadService] Backend leads unavailable, falling back to local CRM cache:', err);
  }

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

export async function updateOrderLead(
  id: string,
  status: string,
  adminNotes: string = ''
): Promise<{ success: boolean; error?: string }> {
  try {
    await request(`/v1/admin/leads/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify({ status, adminNotes }),
    });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Could not update order status' };
  }
}

export async function deleteOrderLead(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await request(`/v1/admin/leads/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Could not delete order lead' };
  }
}
