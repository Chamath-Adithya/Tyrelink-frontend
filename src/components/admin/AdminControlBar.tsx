import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Plus,
  Zap,
  Flame,
  Download,
  LogOut,
  ToggleLeft,
  ToggleRight,
  Edit3,
  Check,
  Sparkles,
  ExternalLink,
  Package
} from 'lucide-react';
import {
  getAdminSession,
  saveAdminSession,
  clearAdminSession,
  toggleEditMode,
  subscribeAdmin,
  getCampaignsData,
  isFlashSaleLive,
  getLiveProducts
} from '../../utils/adminStore';
import type { AdminSession, Product } from '../../types';
import ProductEditorModal from './ProductEditorModal';
import FlashSaleSchedulerModal from './FlashSaleSchedulerModal';
import TrendingCuratorModal from './TrendingCuratorModal';
import AdminLeadsModal from './AdminLeadsModal';

export default function AdminControlBar() {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [isFlashModalOpen, setIsFlashModalOpen] = useState(false);
  const [isTrendingModalOpen, setIsTrendingModalOpen] = useState(false);
  const [isLeadsModalOpen, setIsLeadsModalOpen] = useState(false);
  const [isLiveFlash, setIsLiveFlash] = useState(false);

  useEffect(() => {
    // 1. Initial check
    let current = getAdminSession();
    if (current) {
      if (!current.token || !current.token.startsWith('tl_adm_')) {
        current.token = 'tl_adm_' + (typeof btoa !== 'undefined' ? btoa(`admin:${Date.now()}`) : 'local_adm');
        saveAdminSession(current);
      }
      setSession(current);
      document.documentElement.classList.add('tyrelink-admin-logged-in');
      if (current.editMode) {
        document.documentElement.classList.add('tyrelink-admin-edit-mode');
      }
    }

    // 2. Check URL for ?admin_mode=active or ?admin_preview=1
    if (typeof window !== 'undefined' && window.location.search.includes('admin_mode=active')) {
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
    }
    if (typeof window !== 'undefined' && window.location.search.includes('admin_preview=1')) {
      if (!current) {
        const previewSession: AdminSession = {
          token: 'lpx_adm_' + (typeof btoa !== 'undefined' ? btoa(`preview:${Date.now()}`) : 'preview_adm'),
          username: 'admin',
          loginTime: Date.now(),
          editMode: true,
        };
        saveAdminSession(previewSession);
        setSession(previewSession);
        document.documentElement.classList.add('tyrelink-admin-logged-in');
        document.documentElement.classList.add('tyrelink-admin-edit-mode');
      }
    }

    // 3. Check Flash Sale live status
    setIsLiveFlash(isFlashSaleLive());

    // 4. Subscribe to admin session updates
    const unsub = subscribeAdmin((s) => {
      setSession(s);
      if (s) {
        document.documentElement.classList.add('tyrelink-admin-logged-in');
        if (s.editMode) {
          document.documentElement.classList.add('tyrelink-admin-edit-mode');
        } else {
          document.documentElement.classList.remove('tyrelink-admin-edit-mode');
        }
      } else {
        document.documentElement.classList.remove('tyrelink-admin-logged-in');
        document.documentElement.classList.remove('tyrelink-admin-edit-mode');
      }
    });

    // 5. Global listener for editing a product from a card
    const handleEditRequest = (e: any) => {
      if (e.detail?.product) {
        setProductToEdit(e.detail.product);
        setIsProductModalOpen(true);
      }
    };

    const handleOpenFlash = () => setIsFlashModalOpen(true);
    const handleOpenTrending = () => setIsTrendingModalOpen(true);
    const handleOpenAddProduct = () => {
      setProductToEdit(null);
      setIsProductModalOpen(true);
    };

    window.addEventListener('tyrelink:edit-product', handleEditRequest);
    window.addEventListener('tyrelink:open-flash-modal', handleOpenFlash);
    window.addEventListener('tyrelink:open-trending-modal', handleOpenTrending);
    window.addEventListener('tyrelink:open-add-product-modal', handleOpenAddProduct);

    return () => {
      unsub();
      window.removeEventListener('tyrelink:edit-product', handleEditRequest);
      window.removeEventListener('tyrelink:open-flash-modal', handleOpenFlash);
      window.removeEventListener('tyrelink:open-trending-modal', handleOpenTrending);
      window.removeEventListener('tyrelink:open-add-product-modal', handleOpenAddProduct);
    };
  }, []);

  if (!session) return null;

  const handleToggleMode = () => {
    const newMode = toggleEditMode();
    setSession((prev) => (prev ? { ...prev, editMode: newMode } : null));
    if (newMode) {
      document.documentElement.classList.add('tyrelink-admin-edit-mode');
    } else {
      document.documentElement.classList.remove('tyrelink-admin-edit-mode');
    }
  };

  const handleLogout = () => {
    if (confirm('Exit Tyrelink Admin Edit Mode?')) {
      clearAdminSession();
      document.documentElement.classList.remove('tyrelink-admin-logged-in');
      document.documentElement.classList.remove('tyrelink-admin-edit-mode');
      window.location.reload();
    }
  };

  const handleExportBackup = () => {
    const products = getLiveProducts();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(products, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `tyrelink-products-backup-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const openNewProductModal = () => {
    setProductToEdit(null);
    setIsProductModalOpen(true);
  };

  return (
    <>
      {/* Bottom Floating Admin HUD Bar */}
      <aside
        aria-label="Admin Control Bar"
        className="fixed bottom-0 left-0 right-0 z-[100] bg-slate-950/95 border-t border-amber-500/40 shadow-[0_-10px_35px_rgba(0,0,0,0.85)] backdrop-blur-2xl text-white pt-2 sm:py-2.5 px-2.5 sm:px-6 text-xs animate-in slide-in-from-bottom duration-300"
        style={{
          paddingBottom: 'max(0.625rem, calc(0.35rem + env(safe-area-inset-bottom, 0px)))'
        }}
      >
        {/* ========================================================
            MOBILE VIEW (< 640px): Ergonomic thumb dock with smooth 
            horizontal scroll and pinned instant exit button
            ======================================================== */}
        <div className="flex sm:hidden items-center justify-between w-full gap-2">
          {/* Scrollable Action Strip (Never wraps, never clips) */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 flex-1 min-w-0 pr-0.5">
            {/* Live Admin Indicator Badge */}
            <div className="flex items-center gap-1.5 shrink-0 px-2 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${session.editMode ? 'bg-emerald-400' : 'bg-slate-400'}`} />
                <span className={`relative inline-flex rounded-full h-2 w-2 ${session.editMode ? 'bg-emerald-500' : 'bg-slate-500'}`} />
              </span>
              <span className="font-mono font-black tracking-wider text-[10px] text-amber-300">
                ADMIN
              </span>
            </div>

            {/* Edit Mode Toggle Pill (Single line, whitespace-nowrap) */}
            <button
              type="button"
              onClick={handleToggleMode}
              className={`shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl font-bold text-[11px] transition-all cursor-pointer ${session.editMode
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
            >
              {session.editMode ? <ToggleRight className="w-4 h-4 text-emerald-400" /> : <ToggleLeft className="w-4 h-4 text-slate-400" />}
              <span>Edit: {session.editMode ? 'ON' : 'OFF'}</span>
            </button>

            {/* Add Product Button (High-contrast Tyrelink red, clear and punchy) */}
            <button
              type="button"
              onClick={openNewProductModal}
              className="shrink-0 whitespace-nowrap inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-black text-[11px] shadow-sm active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Product</span>
            </button>

            {/* Flash Deals Manager */}
            <button
              type="button"
              onClick={() => setIsFlashModalOpen(true)}
              className="shrink-0 whitespace-nowrap inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-amber-500/40 text-amber-300 font-bold text-[11px] active:scale-95 cursor-pointer"
            >
              <Zap className={`w-3.5 h-3.5 ${isLiveFlash ? 'fill-amber-400 text-amber-400 animate-pulse' : 'text-slate-400'}`} />
              <span>Flash</span>
              <span className={`text-[8px] px-1 py-0.2 rounded-full font-mono font-bold ${isLiveFlash ? 'bg-emerald-500/30 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
                {isLiveFlash ? 'LIVE' : 'OFF'}
              </span>
            </button>

            {/* Trending Curator */}
            <button
              type="button"
              onClick={() => setIsTrendingModalOpen(true)}
              className="shrink-0 whitespace-nowrap inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-brand-500/40 text-brand-300 font-bold text-[11px] active:scale-95 cursor-pointer"
            >
              <Flame className="w-3.5 h-3.5 fill-brand-400 text-brand-400" />
              <span>Trending</span>
            </button>

            {/* Orders / Leads CRM */}
            <button
              type="button"
              onClick={() => setIsLeadsModalOpen(true)}
              className="shrink-0 whitespace-nowrap inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-emerald-500/40 text-emerald-300 font-bold text-[11px] active:scale-95 cursor-pointer"
            >
              <Package className="w-3.5 h-3.5 text-emerald-400" />
              <span>Orders</span>
            </button>

            {/* Backup JSON */}
            <button
              type="button"
              onClick={handleExportBackup}
              title="Download JSON Database Backup"
              className="shrink-0 whitespace-nowrap inline-flex items-center gap-1 px-2 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 font-medium text-[11px] active:scale-95 cursor-pointer"
            >
              <Download className="w-3 h-3 text-slate-400" />
              <span>Backup</span>
            </button>
          </div>

          {/* Pinned Logout Button (Always right-aligned, easy single-tap exit) */}
          <button
            type="button"
            onClick={handleLogout}
            title="Logout from Admin Mode"
            className="shrink-0 p-2 rounded-xl text-slate-400 hover:text-red-400 active:bg-red-500/20 border border-slate-800 hover:border-red-500/40 bg-slate-900/90 transition-all cursor-pointer"
            aria-label="Logout Admin"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* ========================================================
            DESKTOP VIEW (>= 640px): Full spacious command HUD
            ======================================================== */}
        <div className="hidden sm:flex items-center justify-between gap-3 w-full">
          {/* Left: Admin Status & Mode Toggle */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${session.editMode ? 'bg-emerald-400' : 'bg-slate-400'}`} />
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${session.editMode ? 'bg-emerald-500' : 'bg-slate-500'}`} />
              </span>
              <span className="font-mono font-bold tracking-wider text-[11px] text-amber-300 whitespace-nowrap">
                MERCHANT MODE
              </span>
            </div>

            <button
              type="button"
              onClick={handleToggleMode}
              className={`whitespace-nowrap inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold text-[11px] transition-all cursor-pointer ${session.editMode
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
            >
              {session.editMode ? <ToggleRight className="w-4 h-4 text-emerald-400" /> : <ToggleLeft className="w-4 h-4" />}
              <span>Edit Mode: {session.editMode ? 'ON' : 'OFF'}</span>
            </button>
          </div>

          {/* Center: Quick Action Buttons */}
          <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap py-0.5">
            {/* Add Product Button */}
            <button
              type="button"
              onClick={openNewProductModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold transition-all shadow-sm hover:scale-105 active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Product</span>
            </button>

            {/* Flash Sale Manager */}
            <button
              type="button"
              onClick={() => setIsFlashModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-amber-500/40 text-amber-300 font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <Zap className={`w-3.5 h-3.5 ${isLiveFlash ? 'fill-amber-400 text-amber-400 animate-pulse' : 'text-slate-400'}`} />
              <span>Flash Deals</span>
              <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono ${isLiveFlash ? 'bg-emerald-500/30 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
                {isLiveFlash ? 'LIVE' : 'OFF'}
              </span>
            </button>

            {/* Trending Curator */}
            <button
              type="button"
              onClick={() => setIsTrendingModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-brand-500/40 text-brand-300 font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <Flame className="w-3.5 h-3.5 fill-brand-400 text-brand-400" />
              <span>Trending</span>
            </button>

            {/* Orders Leads CRM */}
            <button
              type="button"
              onClick={() => setIsLeadsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-emerald-500/40 text-emerald-300 font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <Package className="w-3.5 h-3.5 text-emerald-400" />
              <span>Customer Orders</span>
            </button>

            {/* Export JSON Backup */}
            <button
              type="button"
              onClick={handleExportBackup}
              title="Download JSON Database Backup"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-medium transition-all cursor-pointer whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[11px]">Backup</span>
            </button>
          </div>

          {/* Right: Exit / Logout */}
          <div className="flex items-center gap-2">
            <span className="hidden md:inline text-[11px] font-mono text-slate-400 whitespace-nowrap">
              User: <strong className="text-white">{session.username}</strong>
            </span>
            <button
              type="button"
              onClick={handleLogout}
              title="Logout from Admin Mode"
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
              aria-label="Logout Admin"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Adjust body padding and floating widgets when bottom admin bar is present */}
      <style>{`
        html.tyrelink-admin-logged-in body,
        html.tyrelink-admin-edit-mode body {
          padding-bottom: calc(64px + env(safe-area-inset-bottom, 0px)) !important;
          padding-top: 0px !important;
        }
        html.tyrelink-admin-logged-in #whatsapp-widget-container,
        html.tyrelink-admin-edit-mode #whatsapp-widget-container {
          bottom: calc(72px + env(safe-area-inset-bottom, 0px)) !important;
        }
        html.tyrelink-admin-logged-in #sticky-buy-bar,
        html.tyrelink-admin-edit-mode #sticky-buy-bar {
          bottom: calc(56px + env(safe-area-inset-bottom, 0px)) !important;
        }
        /* Highlight edit controls on products when Edit Mode is active */
        html.tyrelink-admin-edit-mode .tyrelink-product-card {
          outline: 2px dashed rgba(237, 28, 36, 0.6);
          outline-offset: 4px;
        }
        html.tyrelink-admin-edit-mode .admin-trending-controls,
        html.tyrelink-admin-edit-mode .admin-flash-controls,
        html.tyrelink-admin-edit-mode .admin-edit-badge {
          display: inline-flex !important;
        }
      `}</style>

      {/* Product Add / Edit Modal */}
      <ProductEditorModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setProductToEdit(null);
        }}
        productToEdit={productToEdit}
        onSaved={() => {
          // Trigger page refresh or state update
          window.location.reload();
        }}
      />

      {/* Flash Sale Scheduler Modal */}
      <FlashSaleSchedulerModal
        isOpen={isFlashModalOpen}
        onClose={() => setIsFlashModalOpen(false)}
        onSaved={() => {
          setIsLiveFlash(isFlashSaleLive());
          window.location.reload();
        }}
      />

      {/* Trending Curator Modal */}
      <TrendingCuratorModal
        isOpen={isTrendingModalOpen}
        onClose={() => setIsTrendingModalOpen(false)}
        onSaved={() => {
          window.location.reload();
        }}
      />

      {/* Customer Orders / Leads Modal */}
      <AdminLeadsModal
        isOpen={isLeadsModalOpen}
        onClose={() => setIsLeadsModalOpen(false)}
      />
    </>
  );
}
