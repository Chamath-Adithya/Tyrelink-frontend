import React, { useEffect, useState } from 'react';
import productsSeed from '../../data/products.json';
import defaultCampaigns from '../../data/campaigns.json';
import { request } from '../../services/apiClient';
import { invalidateDeliveryRateCache, getFlatDeliveryRate, type Review, type DeliveryRate } from '../../services/customerService';
import {
  fetchAdminStats,
  fetchAdminAuditLogs,
  fetchCampaignsFromApi,
  deleteAdminReview,
  type AdminStatsSummary,
  type AuditLogEntry,
} from '../../services/productService';
import {
  fetchAdminLeads,
  updateOrderLead,
  deleteOrderLead,
  type AdminLeadRecord,
} from '../../services/leadService';
import {
  saveCampaignsData,
  exportDatabaseBackup,
  clearAdminSession,
} from '../../utils/adminStore';
import { logoutAdmin } from '../../services/authService';
import type { CampaignsData, Product } from '../../types';
import ProductEditorModal from './ProductEditorModal';
import AdminLeadsModal from './AdminLeadsModal';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Zap,
  Star,
  Truck,
  ShieldCheck,
  Plus,
  Search,
  RefreshCw,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Trash2,
  Eye,
  Download,
  ExternalLink,
  MessageCircle,
  Save,
  Flame,
  Database,
  Activity,
} from 'lucide-react';

type AdminProductItem = Product & {
  published?: boolean;
  size?: string;
  sku?: string;
};

type TabKey =
  | 'overview'
  | 'catalog'
  | 'orders'
  | 'campaigns'
  | 'reviews'
  | 'delivery';

const LEAD_STATUSES = [
  'new',
  'contacted',
  'qualified',
  'dispatched',
  'delivered',
  'cancelled',
  'spam',
] as const;

export default function MerchantWorkspace() {
  const [tab, setTab] = useState<TabKey>('overview');
  const [live, setLive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; tone: 'info' | 'ok' | 'err' } | null>(null);

  // Core Data
  const [stats, setStats] = useState<AdminStatsSummary | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [items, setItems] = useState<AdminProductItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [leads, setLeads] = useState<AdminLeadRecord[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [flatRate, setFlatRate] = useState<DeliveryRate>({
    town: 'Islandwide',
    fee: 450,
    estimate: '1–3 working days islandwide',
  });
  const [campaigns, setCampaigns] = useState<CampaignsData>(defaultCampaigns as CampaignsData);

  // Filters & Modals
  const [catalogSearch, setCatalogSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [leadFilter, setLeadFilter] = useState('all');
  const [leadSearch, setLeadSearch] = useState('');
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProductItem | null>(null);
  const [previewItem, setPreviewItem] = useState<AdminProductItem | null>(null);
  const [leadsModalOpen, setLeadsModalOpen] = useState(false);

  // Flat Islandwide Delivery Form
  const [rateForm, setRateForm] = useState<{ fee: number; estimate: string }>({
    fee: 450,
    estimate: '1–3 working days islandwide',
  });

  const notify = (text: string, tone: 'info' | 'ok' | 'err' = 'info') => {
    setMessage({ text, tone });
  };

  async function loadAll(): Promise<boolean> {
    setBusy(true);
    try {
      const [catalogRes, statsRes, auditRes, campRes] = await Promise.all([
        request<{ data: AdminProductItem[] }>('/v1/admin/catalog'),
        fetchAdminStats().catch(() => null),
        fetchAdminAuditLogs().catch(() => []),
        fetchCampaignsFromApi().catch(() => null),
      ]);

      setItems(Array.isArray(catalogRes?.data) ? catalogRes.data : []);
      if (statsRes) setStats(statsRes);
      if (Array.isArray(auditRes)) setAuditLogs(auditRes);
      if (campRes) setCampaigns(campRes);
      setLive(true);
      notify('Connected to live Tyrelink Go API, PostgreSQL & Redis.', 'ok');
      return true;
    } catch (e: any) {
      setLive(false);
      setItems(productsSeed as unknown as AdminProductItem[]);
      notify(e?.message || 'Could not authenticate with Go API. Showing local preview.', 'err');
      return false;
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedTab = params.get('tab') as TabKey | null;
    loadAll().then((connected) => {
      if (requestedTab && ['overview', 'catalog', 'orders', 'campaigns', 'reviews', 'delivery'].includes(requestedTab)) {
        loadTabDetails(requestedTab, connected);
      }
    });
  }, []);

  async function loadTabDetails(next: TabKey, forceLive?: boolean) {
    setTab(next);
    if (!(forceLive ?? live)) return;
    setBusy(true);
    try {
      if (next === 'overview') {
        const [s, a] = await Promise.all([fetchAdminStats(), fetchAdminAuditLogs()]);
        setStats(s);
        setAuditLogs(a);
      } else if (next === 'catalog') {
        const res = await request<{ data: AdminProductItem[] }>('/v1/admin/catalog');
        setItems(res.data || []);
      } else if (next === 'orders') {
        const l = await fetchAdminLeads();
        setLeads(l);
        const draft: Record<string, string> = {};
        l.forEach((x) => {
          draft[x.id] = x.adminNotes || '';
        });
        setNotesDraft(draft);
      } else if (next === 'campaigns') {
        const c = await fetchCampaignsFromApi();
        if (c) setCampaigns(c);
      } else if (next === 'reviews') {
        const r = await request<{ data: Review[] }>('/v1/admin/reviews');
        setReviews(r.data || []);
      } else if (next === 'delivery') {
        const fr = await getFlatDeliveryRate();
        setFlatRate(fr);
        setRateForm({ fee: fr.fee, estimate: fr.estimate });
      }
    } catch (e: any) {
      notify(e?.message || 'Failed loading tab data', 'err');
    } finally {
      setBusy(false);
    }
  }

  function editCatalogCell(id: string, key: string, value: unknown) {
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, [key]: value } : p)));
    setSelectedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }

  async function saveCatalogEdits() {
    const changed = items.filter((p) => selectedIds.includes(p.id));
    if (changed.length === 0) {
      notify('Select or edit at least 1 product row first.', 'info');
      return;
    }
    if (!live) {
      localStorage.setItem('tyrelink-merchant-draft', JSON.stringify(changed));
      notify('Saved preview draft locally in browser only.', 'info');
      return;
    }
    setBusy(true);
    try {
      await request('/v1/admin/catalog', {
        method: 'PUT',
        body: JSON.stringify({
          items: changed.map((p) => ({
            id: p.id,
            price: Number(p.price),
            stockCount: Number(p.stockCount ?? (p.inStock ? 5 : 0)),
            published: p.published !== false,
            manufactureDate: p.specs?.['Manufacture date'] || '',
          })),
        }),
      });
      setSelectedIds([]);
      notify(`Saved ${changed.length} product update(s) to PostgreSQL & flushed Redis cache.`, 'ok');
      const s = await fetchAdminStats().catch(() => null);
      if (s) setStats(s);
    } catch (e: any) {
      notify(e?.message || 'Failed saving catalog edits', 'err');
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveCampaigns() {
    setBusy(true);
    try {
      const res = await saveCampaignsData(campaigns);
      if (!res.success) throw new Error(res.error);
      notify('Flash Deals & Trending collections saved to PostgreSQL & synced to storefront.', 'ok');
    } catch (e: any) {
      notify(e?.message || 'Failed updating campaigns', 'err');
    } finally {
      setBusy(false);
    }
  }

  async function handleReviewModerate(id: string, status: Review['status']) {
    setBusy(true);
    try {
      await request(`/v1/admin/reviews/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
      notify(`Review marked ${status} and product rating recalculated.`, 'ok');
    } catch (e: any) {
      notify(e?.message || 'Could not moderate review', 'err');
    } finally {
      setBusy(false);
    }
  }

  async function handleReviewDelete(id: string) {
    if (!window.confirm('Delete this customer review permanently?')) return;
    setBusy(true);
    try {
      await deleteAdminReview(id);
      setReviews((prev) => prev.filter((r) => r.id !== id));
      notify('Review deleted permanently.', 'ok');
    } catch (e: any) {
      notify(e?.message || 'Failed deleting review', 'err');
    } finally {
      setBusy(false);
    }
  }

  async function handleRateSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!live) return notify('Sign in at /admin to save delivery rate.', 'err');
    setBusy(true);
    try {
      await request('/v1/admin/delivery-rates', {
        method: 'PUT',
        body: JSON.stringify({ town: 'Islandwide', fee: Number(rateForm.fee), estimate: rateForm.estimate.trim() }),
      });
      invalidateDeliveryRateCache();
      const updated = await getFlatDeliveryRate();
      setFlatRate(updated);
      setStats((s) => (s ? { ...s, flatDeliveryFee: updated.fee } : s));
      notify(`Saved uniform islandwide delivery fee (Rs. ${updated.fee.toLocaleString()}).`, 'ok');
    } catch (e: any) {
      notify(e?.message || 'Failed saving delivery rate', 'err');
    } finally {
      setBusy(false);
    }
  }

  const handleSignOut = async () => {
    await logoutAdmin();
    clearAdminSession();
    window.location.href = '/admin';
  };

  const filteredItems = items.filter((p) => {
    if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
    if (!catalogSearch.trim()) return true;
    const q = catalogSearch.toLowerCase();
    return `${p.title} ${p.brand} ${p.category} ${p.size || ''} ${p.sku || ''}`.toLowerCase().includes(q);
  });

  const filteredLeads = leads.filter((l) => {
    if (leadFilter !== 'all' && l.status !== leadFilter) return false;
    if (!leadSearch.trim()) return true;
    const q = leadSearch.toLowerCase();
    return `${l.orderRef} ${l.customerName} ${l.phone1} ${l.address}`.toLowerCase().includes(q);
  });

  const navTabs: Array<{ id: TabKey; label: string; icon: React.ReactNode; badge?: number }> = [
    { id: 'overview', label: 'Overview & Audit', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'catalog', label: 'Catalog & Stock', icon: <Package className="w-4 h-4" />, badge: items.length },
    { id: 'orders', label: 'Orders CRM', icon: <ShoppingBag className="w-4 h-4" />, badge: stats?.newLeads },
    { id: 'campaigns', label: 'Campaigns', icon: <Zap className="w-4 h-4" /> },
    { id: 'reviews', label: 'Reviews', icon: <Star className="w-4 h-4" />, badge: stats?.pendingReviews },
    { id: 'delivery', label: 'Delivery Fee', icon: <Truck className="w-4 h-4" /> },
  ];

  return (
    <section className="min-h-screen bg-[#0b0b0d] text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1440px] mx-auto space-y-6">
        {/* Top Command Header */}
        <header className="p-6 rounded-2xl bg-[#141418] border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xl">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-red-600/20 text-red-400 border border-red-500/30">
                Tyrelink Store Console
              </span>
              <span
                className={`inline-flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-0.5 rounded-full border ${
                  live
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${live ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                {live ? 'API + Postgres Live' : 'Offline / Auth Required'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-display text-white mt-2">
              Merchant &amp; Operations Command Center
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Full inventory CRUD, order fulfillment CRM, flash deals &amp; trending campaigns, review moderation, and flat islandwide delivery pricing.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {!live ? (
              <a
                href="/admin"
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Sign In</span>
              </a>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setEditingProduct(null);
                    setEditorOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-red-600/20 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Product</span>
                </button>
                <button
                  type="button"
                  onClick={exportDatabaseBackup}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Backup JSON</span>
                </button>
                <a
                  href="/?admin_mode=active"
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Storefront</span>
                </a>
                <button
                  type="button"
                  onClick={loadAll}
                  disabled={busy}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                  title="Refresh console"
                >
                  <RefreshCw className={`w-4 h-4 ${busy ? 'animate-spin' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-red-950/50 border border-slate-800 hover:border-red-500/40 text-slate-400 hover:text-red-300 cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </header>

        {/* Status Banner */}
        {message && (
          <div
            role="status"
            className={`px-4 py-3 rounded-xl border text-xs font-semibold flex items-center justify-between gap-2 ${
              message.tone === 'ok'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : message.tone === 'err'
                ? 'bg-red-500/10 border-red-500/30 text-red-300'
                : 'bg-slate-800/80 border-slate-700 text-slate-300'
            }`}
          >
            <span className="flex items-center gap-2">
              {message.tone === 'err' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
              {message.text}
            </span>
            <button type="button" onClick={() => setMessage(null)} className="text-slate-400 hover:text-white cursor-pointer">
              ×
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <nav aria-label="Merchant console sections" className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {navTabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => loadTabDetails(t.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap border transition-all cursor-pointer ${
                tab === t.id
                  ? 'bg-red-600 text-white border-red-500 shadow-lg shadow-red-600/20'
                  : 'bg-[#141418] text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
              }`}
            >
              {t.icon}
              <span>{t.label}</span>
              {typeof t.badge === 'number' && t.badge > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-black/30 text-white">
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* TAB 1: OVERVIEW & AUDIT LOGS */}
        {tab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-[#141418] border border-slate-800">
                <p className="text-[11px] font-bold uppercase text-slate-400">Catalog Products</p>
                <p className="text-3xl font-black text-white mt-1 font-mono">{stats?.publishedProducts ?? items.length}</p>
                <p className="text-xs text-slate-400 mt-1">
                  {stats?.outOfStockProducts ?? 0} out of stock · {stats?.flashDealCount ?? 0} flash deals
                </p>
              </div>
              <div className="p-5 rounded-2xl bg-[#141418] border border-slate-800">
                <p className="text-[11px] font-bold uppercase text-slate-400">Customer Orders / Leads</p>
                <p className="text-3xl font-black text-white mt-1 font-mono">{stats?.totalLeads ?? 0}</p>
                <p className="text-xs text-emerald-400 mt-1">
                  {stats?.newLeads ?? 0} new · {stats?.dispatchedLeads ?? 0} dispatched · {stats?.deliveredLeads ?? 0} delivered
                </p>
              </div>
              <div className="p-5 rounded-2xl bg-[#141418] border border-slate-800">
                <p className="text-[11px] font-bold uppercase text-slate-400">Order Pipeline Value</p>
                <p className="text-3xl font-black text-red-400 mt-1 font-mono">
                  Rs. {(stats?.leadsPipelineLkr ?? 0).toLocaleString()}
                </p>
                <p className="text-xs text-slate-400 mt-1">Excludes cancelled &amp; spam</p>
              </div>
              <div className="p-5 rounded-2xl bg-[#141418] border border-slate-800">
                <p className="text-[11px] font-bold uppercase text-slate-400">Reviews &amp; Flat Courier</p>
                <p className="text-3xl font-black text-white mt-1 font-mono">
                  Rs. {(stats?.flatDeliveryFee ?? flatRate.fee).toLocaleString()}
                </p>
                <p className="text-xs text-amber-400 mt-1">
                  Islandwide flat fee · {stats?.pendingReviews ?? 0} pending reviews
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* System Health */}
              <div className="p-6 rounded-2xl bg-[#141418] border border-slate-800 space-y-4">
                <h2 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-red-400" />
                  <span>Infrastructure Health</span>
                </h2>
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-300">PostgreSQL 16 Database</span>
                    <span className={`font-mono font-bold ${stats?.postgresConnected ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {stats?.postgresConnected ? 'CONNECTED' : 'OFFLINE'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-300">Redis 7 Edge Cache</span>
                    <span className={`font-mono font-bold ${stats?.redisConnected ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {stats?.redisConnected ? 'CONNECTED' : 'MEMORY FALLBACK'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-300">Auth Security</span>
                    <span className="font-mono font-bold text-emerald-400">HMAC + RATE GUARD</span>
                  </div>
                </div>
              </div>

              {/* Recent Audit Logs */}
              <div className="lg:col-span-2 p-6 rounded-2xl bg-[#141418] border border-slate-800 space-y-4">
                <h2 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-red-400" />
                  <span>Recent Admin Audit Trail</span>
                </h2>
                {auditLogs.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">No admin audit events recorded yet.</p>
                ) : (
                  <div className="divide-y divide-slate-800 max-h-64 overflow-y-auto">
                    {auditLogs.slice(0, 20).map((log) => (
                      <div key={log.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                        <div className="min-w-0">
                          <span className="font-mono font-bold text-red-400">{log.action}</span>{' '}
                          <span className="text-slate-400">
                            {log.entityType} ({log.entityId || 'n/a'})
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-500 shrink-0">
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CATALOG & STOCK */}
        {tab === 'catalog' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#141418] border border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[240px]">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    placeholder="Search title, brand, size, SKU..."
                    className="w-full h-9 pl-9 pr-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  />
                </div>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="h-9 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                >
                  <option value="all">All Categories</option>
                  <option value="car-tyres">Car Tyres</option>
                  <option value="suv-4x4">SUV &amp; 4x4</option>
                  <option value="motorcycle">Motorcycle</option>
                  <option value="commercial">Commercial</option>
                  <option value="wheels">Wheels &amp; Valves</option>
                  <option value="garage-tools">Garage Tools</option>
                  <option value="garage-equipment">Workshop Equipment</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={busy || selectedIds.length === 0}
                  onClick={saveCatalogEdits}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Selected ({selectedIds.length})</span>
                </button>
              </div>
            </div>

            <div className="rounded-2xl bg-[#141418] border border-slate-800 overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-3">Sel</th>
                    <th className="p-3">Product</th>
                    <th className="p-3">Price (Rs.)</th>
                    <th className="p-3">Stock</th>
                    <th className="p-3">Batch / DOT</th>
                    <th className="p-3">Published</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredItems.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-900/50">
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(p.id)}
                          onChange={(e) =>
                            setSelectedIds((prev) =>
                              e.target.checked ? [...prev, p.id] : prev.filter((x) => x !== p.id)
                            )
                          }
                        />
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={p.featuredImage}
                            alt={p.title}
                            className="w-10 h-10 rounded-lg object-contain bg-white p-0.5 shrink-0"
                          />
                          <div>
                            <p className="font-bold text-white">{p.title}</p>
                            <p className="text-[11px] text-slate-400">
                              {p.brand} · {p.size || p.category}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          min="0"
                          value={p.price}
                          onChange={(e) => editCatalogCell(p.id, 'price', Number(e.target.value))}
                          className="w-28 h-8 px-2.5 rounded-lg bg-slate-950 border border-slate-800 text-red-400 font-mono font-bold"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          min="0"
                          value={p.stockCount ?? 0}
                          onChange={(e) => editCatalogCell(p.id, 'stockCount', Number(e.target.value))}
                          className="w-20 h-8 px-2.5 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="text"
                          maxLength={80}
                          placeholder="DOT / Batch"
                          value={p.specs?.['Manufacture date'] || ''}
                          onChange={(e) =>
                            editCatalogCell(p.id, 'specs', {
                              ...(p.specs || {}),
                              'Manufacture date': e.target.value,
                            })
                          }
                          className="w-36 h-8 px-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={p.published !== false}
                          onChange={(e) => editCatalogCell(p.id, 'published', e.target.checked)}
                        />
                      </td>
                      <td className="p-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingProduct(p);
                              setEditorOpen(true);
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
                            title="Full edit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setPreviewItem(p)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
                            title="Quick preview"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: ORDERS CRM */}
        {tab === 'orders' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#141418] border border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {(['all', ...LEAD_STATUSES] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setLeadFilter(st)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase cursor-pointer border ${
                      leadFilter === st
                        ? 'bg-red-600 text-white border-red-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={leadSearch}
                  onChange={(e) => setLeadSearch(e.target.value)}
                  placeholder="Search orders..."
                  className="h-9 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
                <button
                  type="button"
                  onClick={() => setLeadsModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white cursor-pointer"
                >
                  Open Full Modal / CSV
                </button>
              </div>
            </div>

            {filteredLeads.length === 0 ? (
              <div className="p-12 rounded-2xl bg-[#141418] border border-slate-800 text-center text-xs text-slate-400">
                No matching order leads recorded yet.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredLeads.map((lead) => {
                  const cleanPhone = (lead.phone1 || '').replace(/\D/g, '');
                  const waNumber = cleanPhone.startsWith('0')
                    ? '94' + cleanPhone.slice(1)
                    : cleanPhone.startsWith('94')
                    ? cleanPhone
                    : '94' + cleanPhone;
                  return (
                    <div
                      key={lead.id}
                      className="p-4 rounded-2xl bg-[#141418] border border-slate-800 space-y-3 text-xs"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-red-400">#{lead.orderRef || lead.id}</span>
                          <span className="font-bold text-white">{lead.customerName}</span>
                          <span className="text-slate-400">{lead.phone1}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            value={lead.status || 'new'}
                            onChange={async (e) => {
                              const next = e.target.value;
                              const res = await updateOrderLead(lead.id, next, notesDraft[lead.id] ?? lead.adminNotes ?? '');
                              if (res.success) {
                                setLeads((prev) => prev.map((x) => (x.id === lead.id ? { ...x, status: next } : x)));
                                notify(`Order #${lead.orderRef} updated to ${next}`, 'ok');
                              }
                            }}
                            className="h-8 px-2 rounded-lg bg-slate-950 border border-slate-700 font-bold text-white"
                          >
                            {LEAD_STATUSES.map((s) => (
                              <option key={s} value={s}>{s.toUpperCase()}</option>
                            ))}
                          </select>
                          <span className="font-mono font-black text-white">Rs. {(lead.grandTotal || 0).toLocaleString()}</span>
                        </div>
                      </div>
                      <p className="text-slate-400">{lead.address}</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          type="text"
                          value={notesDraft[lead.id] ?? lead.adminNotes ?? ''}
                          onChange={(e) => setNotesDraft((p) => ({ ...p, [lead.id]: e.target.value }))}
                          placeholder="Internal note..."
                          className="flex-1 min-w-[200px] h-8 px-3 rounded-lg bg-slate-950 border border-slate-800 text-white"
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            const res = await updateOrderLead(lead.id, lead.status || 'new', notesDraft[lead.id] || '');
                            if (res.success) notify('Order note saved.', 'ok');
                          }}
                          className="h-8 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 font-bold cursor-pointer"
                        >
                          Save Note
                        </button>
                        {lead.phone1 && (
                          <a
                            href={`https://wa.me/${waNumber}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-8 px-3 rounded-lg bg-[#25D366] text-white font-bold inline-flex items-center gap-1"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={async () => {
                            if (!window.confirm('Delete lead?')) return;
                            const res = await deleteOrderLead(lead.id);
                            if (res.success) setLeads((prev) => prev.filter((x) => x.id !== lead.id));
                          }}
                          className="h-8 px-2.5 rounded-lg bg-red-500/15 text-red-300 border border-red-500/30 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: CAMPAIGNS (FLASH DEALS & TRENDING) */}
        {tab === 'campaigns' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-[#141418] border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-black text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Flash Sale Schedule</span>
                </h2>
                <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={campaigns.flashSale?.isActive}
                    onChange={(e) =>
                      setCampaigns((c) => ({
                        ...c,
                        flashSale: { ...c.flashSale, isActive: e.target.checked },
                      }))
                    }
                  />
                  <span>Active</span>
                </label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <label className="space-y-1">
                  <span className="text-slate-400 font-bold">Start Time</span>
                  <input
                    type="datetime-local"
                    value={(campaigns.flashSale?.startTime || '').slice(0, 16)}
                    onChange={(e) =>
                      setCampaigns((c) => ({
                        ...c,
                        flashSale: { ...c.flashSale, startTime: new Date(e.target.value).toISOString() },
                      }))
                    }
                    className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-slate-400 font-bold">End Time</span>
                  <input
                    type="datetime-local"
                    value={(campaigns.flashSale?.endTime || '').slice(0, 16)}
                    onChange={(e) =>
                      setCampaigns((c) => ({
                        ...c,
                        flashSale: { ...c.flashSale, endTime: new Date(e.target.value).toISOString() },
                      }))
                    }
                    className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                  />
                </label>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-800 border border-slate-800 rounded-xl bg-slate-950">
                {items.map((p) => {
                  const checked = campaigns.flashSale?.productIds?.includes(p.id);
                  return (
                    <label key={p.id} className="flex items-center justify-between p-2.5 text-xs cursor-pointer hover:bg-slate-900">
                      <span className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            const ids = campaigns.flashSale?.productIds || [];
                            const next = e.target.checked ? [...ids, p.id] : ids.filter((x) => x !== p.id);
                            setCampaigns((c) => ({ ...c, flashSale: { ...c.flashSale, productIds: next } }));
                          }}
                        />
                        <span className="font-semibold text-white">{p.title}</span>
                      </span>
                      <span className="font-mono text-red-400">Rs. {p.price.toLocaleString()}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[#141418] border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-black text-white flex items-center gap-2">
                  <Flame className="w-4 h-4 text-red-400" />
                  <span>Trending &amp; Best Sellers</span>
                </h2>
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleSaveCampaigns}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save All Campaigns</span>
                </button>
              </div>
              <div className="max-h-88 overflow-y-auto divide-y divide-slate-800 border border-slate-800 rounded-xl bg-slate-950">
                {items.map((p) => {
                  const checked = campaigns.trending?.productIds?.includes(p.id);
                  return (
                    <label key={p.id} className="flex items-center justify-between p-2.5 text-xs cursor-pointer hover:bg-slate-900">
                      <span className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            const ids = campaigns.trending?.productIds || [];
                            const next = e.target.checked ? [...ids, p.id] : ids.filter((x) => x !== p.id);
                            setCampaigns((c) => ({ ...c, trending: { ...c.trending, productIds: next } }));
                          }}
                        />
                        <span className="font-semibold text-white">{p.title}</span>
                      </span>
                      <span className="font-mono text-red-400">Rs. {p.price.toLocaleString()}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: REVIEWS MODERATION */}
        {tab === 'reviews' && (
          <div className="p-6 rounded-2xl bg-[#141418] border border-slate-800 space-y-4">
            <h2 className="text-base font-black text-white">Customer Review Moderation</h2>
            {reviews.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">No customer reviews submitted yet.</p>
            ) : (
              <div className="space-y-3">
                {reviews.map((r) => (
                  <article key={r.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row justify-between gap-4 text-xs">
                    <div className="space-y-1">
                      <p className="font-bold text-white">
                        {r.name} · <span className="text-amber-400">{r.rating}/5</span> ·{' '}
                        <span className="uppercase text-slate-400">{r.status}</span>
                      </p>
                      <p className="text-[11px] font-mono text-slate-500">Product: {r.productId}</p>
                      <p className="text-slate-300 mt-1">{r.text}</p>
                      {r.photoDataUrl && <img src={r.photoDataUrl} alt="Review upload" className="w-24 h-24 object-cover rounded-lg mt-2 border border-slate-700" />}
                    </div>
                    <div className="flex sm:flex-col gap-1.5 shrink-0">
                      {(['approved', 'rejected', 'pending'] as const).map((status) => (
                        <button
                          key={status}
                          type="button"
                          disabled={busy || r.status === status}
                          onClick={() => handleReviewModerate(r.id, status)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-bold capitalize cursor-pointer"
                        >
                          {status}
                        </button>
                      ))}
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleReviewDelete(r.id)}
                        className="px-3 py-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/30 text-xs font-bold cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 6: SINGLE FLAT ISLANDWIDE DELIVERY FEE */}
        {tab === 'delivery' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <form onSubmit={handleRateSubmit} className="p-6 rounded-2xl bg-[#141418] border border-slate-800 space-y-4 text-xs">
              <div>
                <h2 className="text-base font-black text-white">Uniform Islandwide Delivery Fee</h2>
                <p className="text-slate-400 mt-1">
                  This single courier charge applies automatically across the entire island at Checkout and on every product page.
                </p>
              </div>
              <label className="block space-y-1">
                <span className="text-slate-400 font-bold">Flat Delivery Fee Everywhere (Rs.)</span>
                <input
                  required
                  type="number"
                  min="0"
                  value={rateForm.fee}
                  onChange={(e) => setRateForm({ ...rateForm, fee: Number(e.target.value) })}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-base font-bold"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-slate-400 font-bold">Estimated Islandwide Delivery Window</span>
                <input
                  required
                  maxLength={120}
                  value={rateForm.estimate}
                  onChange={(e) => setRateForm({ ...rateForm, estimate: e.target.value })}
                  placeholder="e.g. 1–3 working days islandwide"
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </label>
              <button
                type="submit"
                disabled={busy || !live}
                className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold disabled:opacity-40 cursor-pointer"
              >
                Save Islandwide Delivery Rate
              </button>
            </form>

            <div className="p-6 rounded-2xl bg-[#141418] border border-slate-800 flex flex-col justify-center space-y-3 text-xs">
              <span className="text-[10px] font-black uppercase tracking-widest text-red-400">Active Storefront Courier Rate</span>
              <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <p className="text-3xl font-black font-mono text-white">Rs. {flatRate.fee.toLocaleString()}</p>
                <p className="text-slate-300 font-semibold">{flatRate.estimate}</p>
                <p className="text-slate-500">Applies uniformly to all 25 districts in Sri Lanka.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Product Preview Modal */}
      {previewItem && (
        <div
          className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-amber-400">Draft Preview</span>
              <button type="button" onClick={() => setPreviewItem(null)} className="text-slate-400 hover:text-white cursor-pointer">
                Close ×
              </button>
            </div>
            <img src={previewItem.featuredImage} alt={previewItem.title} className="w-full h-44 object-contain rounded-xl bg-white p-2" />
            <h3 className="text-lg font-black text-white">{previewItem.title}</h3>
            <p className="text-xl font-black text-red-400 font-mono">Rs. {previewItem.price.toLocaleString()}</p>
            <p className="text-slate-300">{previewItem.shortDescription}</p>
            <a href={`/product/${previewItem.slug}/`} className="inline-flex items-center gap-1 text-red-400 underline font-bold">
              Open live storefront page ↗
            </a>
          </div>
        </div>
      )}

      {/* Full Add/Edit Product Modal */}
      <ProductEditorModal
        isOpen={editorOpen}
        onClose={() => {
          setEditorOpen(false);
          setEditingProduct(null);
        }}
        productToEdit={editingProduct}
        onSaved={() => loadTabDetails('catalog')}
      />

      {/* Full Order Leads Modal */}
      <AdminLeadsModal isOpen={leadsModalOpen} onClose={() => setLeadsModalOpen(false)} />
    </section>
  );
}
