import React, { useState, useEffect } from 'react';
import {
  X,
  RefreshCw,
  Phone,
  MapPin,
  Package,
  MessageCircle,
  AlertCircle,
  Clock,
  CheckCircle,
  Search,
  Trash2,
  Download,
  Save,
} from 'lucide-react';
import {
  fetchAdminLeads,
  updateOrderLead,
  deleteOrderLead,
  type AdminLeadRecord,
} from '../../services/leadService';

interface AdminLeadsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LEAD_STATUSES = [
  'new',
  'contacted',
  'qualified',
  'dispatched',
  'delivered',
  'cancelled',
  'spam',
] as const;

const STATUS_BADGE: Record<string, string> = {
  new: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  contacted: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  qualified: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
  dispatched: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  delivered: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  cancelled: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  spam: 'bg-slate-700/40 text-slate-400 border-slate-600/40',
};

export default function AdminLeadsModal({ isOpen, onClose }: AdminLeadsModalProps) {
  const [leads, setLeads] = useState<AdminLeadRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});

  const loadLeads = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminLeads();
      setLeads(data);
      const initialNotes: Record<string, string> = {};
      data.forEach((l) => {
        initialNotes[l.id] = l.adminNotes || '';
      });
      setNotesDraft(initialNotes);
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

  const filteredLeads = leads.filter((l) => {
    if (statusFilter !== 'all' && l.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const hay = `${l.orderRef} ${l.customerName} ${l.phone1} ${l.address} ${l.adminNotes || ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const handleStatusChange = async (lead: AdminLeadRecord, nextStatus: string) => {
    setBusyId(lead.id);
    setError(null);
    const note = notesDraft[lead.id] ?? lead.adminNotes ?? '';
    const res = await updateOrderLead(lead.id, nextStatus, note);
    if (res.success) {
      setLeads((prev) =>
        prev.map((item) => (item.id === lead.id ? { ...item, status: nextStatus, adminNotes: note } : item))
      );
    } else {
      setError(res.error || 'Could not update status');
    }
    setBusyId(null);
  };

  const handleSaveNotes = async (lead: AdminLeadRecord) => {
    await handleStatusChange(lead, lead.status || 'new');
  };

  const handleDeleteLead = async (lead: AdminLeadRecord) => {
    if (!window.confirm(`Delete order lead #${lead.orderRef || lead.id}?`)) return;
    setBusyId(lead.id);
    const res = await deleteOrderLead(lead.id);
    if (res.success) {
      setLeads((prev) => prev.filter((item) => item.id !== lead.id));
    } else {
      setError(res.error || 'Failed to delete lead');
    }
    setBusyId(null);
  };

  const handleExportCSV = () => {
    const header = ['OrderRef', 'Customer', 'Phone1', 'Phone2', 'Address', 'Payment', 'TotalLKR', 'Status', 'CreatedAt', 'Notes'];
    const esc = (val: unknown) => `"${String(val ?? '').replace(/"/g, '""')}"`;
    const rows = filteredLeads.map((l) =>
      [l.orderRef, l.customerName, l.phone1, l.phone2, l.address, l.paymentMethod, l.grandTotal, l.status, l.createdAt, l.adminNotes]
        .map(esc)
        .join(',')
    );
    const csv = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tyrelink-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl my-auto max-h-[92vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden text-left text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black font-display text-white flex items-center gap-2">
                <span>Order Leads &amp; Fulfillment CRM</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 font-mono">
                  {filteredLeads.length} / {leads.length}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Track enquiries, update fulfillment statuses, record dispatch notes, and reply via WhatsApp
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={filteredLeads.length === 0}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
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

        {/* Filter & Search Toolbar */}
        <div className="px-6 py-3 border-b border-slate-800/80 bg-slate-950/40 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {(['all', ...LEAD_STATUSES] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider whitespace-nowrap cursor-pointer border transition-colors ${
                  statusFilter === st
                    ? 'bg-brand-600 text-white border-brand-500'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ref, name, phone..."
              className="w-full h-8 pl-8 pr-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500"
            />
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

          {filteredLeads.length === 0 && !loading && (
            <div className="py-16 text-center space-y-3">
              <Package className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-slate-400">No matching order leads</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Incoming customer enquiries submitted through Checkout or WhatsApp Quick Order appear here in real time.
              </p>
            </div>
          )}

          {filteredLeads.map((lead) => {
            const cleanPhone = (lead.phone1 || '').replace(/\D/g, '');
            const waNumber = cleanPhone.startsWith('0')
              ? '94' + cleanPhone.slice(1)
              : cleanPhone.startsWith('94')
              ? cleanPhone
              : '94' + cleanPhone;

            const waReplyUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(
              `Hello ${lead.customerName || 'Valued Customer'}, this is Tyrelink regarding your order #${lead.orderRef || lead.id}.`
            )}`;

            const badgeClass = STATUS_BADGE[lead.status] || STATUS_BADGE.new;

            return (
              <div
                key={lead.id}
                className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 space-y-3 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono text-xs font-bold text-brand-400">
                      #{lead.orderRef || lead.id}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(lead.createdAt).toLocaleString()}
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${badgeClass}`}>
                      {lead.status || 'new'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      aria-label={`Order status for ${lead.orderRef || lead.id}`}
                      value={lead.status || 'new'}
                      disabled={busyId === lead.id}
                      onChange={(e) => handleStatusChange(lead, e.target.value)}
                      className="h-8 px-2.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-bold text-white cursor-pointer focus:outline-none focus:border-brand-500"
                    >
                      {LEAD_STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {st.toUpperCase()}
                        </option>
                      ))}
                    </select>
                    <span className="text-xs font-mono font-black text-white">
                      Rs. {(lead.grandTotal || 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-slate-400 text-[11px]">Customer &amp; Contact:</p>
                    <p className="font-bold text-white text-sm mt-0.5">{lead.customerName || 'Customer'}</p>
                    <div className="flex items-center gap-2 mt-1 text-slate-300">
                      <Phone className="w-3.5 h-3.5 text-brand-400" />
                      <span>{lead.phone1}</span>
                      {lead.phone2 && <span className="text-slate-500">/ {lead.phone2}</span>}
                    </div>
                  </div>

                  <div>
                    <p className="text-slate-400 text-[11px]">Delivery Destination ({lead.paymentMethod || 'COD'}):</p>
                    <div className="flex items-start gap-1.5 mt-1 text-slate-300">
                      <MapPin className="w-3.5 h-3.5 text-brand-400 shrink-0 mt-0.5" />
                      <span className="leading-snug">{lead.address || 'Address on file'}</span>
                    </div>
                  </div>
                </div>

                {Array.isArray(lead.items) && lead.items.length > 0 && (
                  <div className="pt-2 border-t border-slate-800/70">
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

                {/* Internal Admin Notes + Actions */}
                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 border-t border-slate-800/70">
                  <div className="flex items-center gap-1.5 flex-1">
                    <input
                      type="text"
                      value={notesDraft[lead.id] ?? lead.adminNotes ?? ''}
                      onChange={(e) => setNotesDraft((prev) => ({ ...prev, [lead.id]: e.target.value }))}
                      placeholder="Add internal dispatch / fitment note..."
                      className="flex-1 h-8 px-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-500"
                    />
                    <button
                      type="button"
                      disabled={busyId === lead.id}
                      onClick={() => handleSaveNotes(lead)}
                      className="h-8 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Save className="w-3 h-3" />
                      <span>Save Note</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    {lead.phone1 && (
                      <a
                        href={waReplyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-bold transition-all shadow-sm"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </a>
                    )}
                    <button
                      type="button"
                      disabled={busyId === lead.id}
                      onClick={() => handleDeleteLead(lead)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-bold cursor-pointer"
                      title="Delete lead"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Synced with /v1/admin/leads</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Close CRM
          </button>
        </div>
      </div>
    </div>
  );
}
