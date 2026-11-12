import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Phone, MapPin, Package, MessageCircle, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import { fetchAdminLeads, type AdminLeadRecord } from '../../services/leadService';

interface AdminLeadsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminLeadsModal({ isOpen, onClose }: AdminLeadsModalProps) {
  const [leads, setLeads] = useState<AdminLeadRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLeads = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminLeads();
      setLeads(data);
    } catch (err: any) {
      setError('Could not load order leads from API: ' + (err?.message || 'Network error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadLeads();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl my-auto max-h-[90vh] bg-slate-900 border border-slate-700/80 rounded-[2rem] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden text-left text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black font-display text-white flex items-center gap-2">
                <span>Customer Order Leads & Inquiries</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 font-mono">
                  {leads.length} Records
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Incoming orders captured via Go API Backend from 1-Click WhatsApp Checkout
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadLeads}
              disabled={loading}
              title="Refresh order leads"
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-brand-400' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {leads.length === 0 && !loading && (
            <div className="py-16 text-center space-y-3">
              <Package className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-slate-400">No order leads recorded yet</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                When visitors place orders via the Cart Drawer or Order Now buttons, leads will appear here in real time.
              </p>
            </div>
          )}

          {leads.map((lead) => {
            const cleanPhone = (lead.phone1 || '').replace(/\D/g, '');
            const waNumber = cleanPhone.startsWith('0')
              ? '94' + cleanPhone.slice(1)
              : cleanPhone.startsWith('94')
              ? cleanPhone
              : '94' + cleanPhone;

            const waReplyUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(
              `Hello ${lead.customerName || 'Valued Customer'}, this is Tyrelink regarding your order #${lead.orderRef || lead.id}. We are confirming your delivery address and tyre fitment.`
            )}`;

            return (
              <div
                key={lead.id}
                className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 space-y-3 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-850 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-brand-400">
                      #{lead.orderRef || lead.id}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(lead.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {lead.status || 'NEW'}
                    </span>
                    <span className="text-xs font-mono font-black text-white">
                      Rs. {(lead.grandTotal || 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-slate-400 text-[11px]">Customer & Contact:</p>
                    <p className="font-bold text-white text-sm mt-0.5">{lead.customerName || 'Customer'}</p>
                    <div className="flex items-center gap-2 mt-1 text-slate-300">
                      <Phone className="w-3.5 h-3.5 text-brand-400" />
                      <span>{lead.phone1}</span>
                      {lead.phone2 && <span className="text-slate-500">/ {lead.phone2}</span>}
                    </div>
                  </div>

                  <div>
                    <p className="text-slate-400 text-[11px]">Delivery Destination:</p>
                    <div className="flex items-start gap-1.5 mt-1 text-slate-300">
                      <MapPin className="w-3.5 h-3.5 text-brand-400 shrink-0 mt-0.5" />
                      <span className="leading-snug">{lead.address || 'Address on file'}</span>
                    </div>
                  </div>
                </div>

                {/* Ordered Items summary */}
                {Array.isArray(lead.items) && lead.items.length > 0 && (
                  <div className="pt-2 border-t border-slate-850">
                    <p className="text-[11px] font-bold text-slate-400 mb-1.5">Ordered Tyres / Equipment:</p>
                    <div className="space-y-1">
                      {lead.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs text-slate-300">
                          <span className="truncate max-w-md">
                            • {item.title} <span className="text-slate-500">× {item.quantity}</span>
                          </span>
                          <span className="font-mono text-slate-400">
                            Rs. {((item.price || 0) * (item.quantity || 1)).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="pt-2 flex items-center justify-end gap-2.5">
                  {lead.phone1 && (
                    <a
                      href={waReplyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-bold transition-all shadow-sm hover:scale-105 active:scale-95"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp Customer</span>
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Go API Endpoint: /v1/admin/leads</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Close Dashboard
          </button>
        </div>

      </div>
    </div>
  );
}

