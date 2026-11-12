import React, { useState, useEffect } from 'react';
import { Edit3, Trash2, CheckCircle2, XCircle, Video, ShieldAlert, Sparkles } from 'lucide-react';
import type { Product } from '../../types';
import {
  getAdminSession,
  subscribeAdmin,
  getLiveProducts,
  toggleProductStock,
  deleteLiveProduct,
} from '../../utils/adminStore';

interface ProductAdminBarProps {
  product: Product;
}

export default function ProductAdminBar({ product: initialProduct }: ProductAdminBarProps) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product>(initialProduct);
  const [inStock, setInStock] = useState<boolean>(initialProduct.inStock ?? true);
  const [isTogglingStock, setIsTogglingStock] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    // Check initial admin session
    const session = getAdminSession();
    setIsAdmin(Boolean(session));
    setIsEditMode(Boolean(session?.editMode));

    // Try to get fresh product state from live products cache
    const liveList = getLiveProducts();
    const found = liveList.find((p) => p.id === initialProduct.id || p.slug === initialProduct.slug);
    if (found) {
      setCurrentProduct(found);
      setInStock(found.inStock ?? true);
    }

    // Subscribe to session changes
    const unsub = subscribeAdmin((s) => {
      setIsAdmin(Boolean(s));
      setIsEditMode(Boolean(s?.editMode));
    });

    return () => unsub();
  }, [initialProduct.id, initialProduct.slug]);

  if (!isAdmin || !isEditMode) {
    return null;
  }

  const handleEditClick = () => {
    // Dispatch global event for AdminControlBar's ProductEditorModal
    window.dispatchEvent(
      new CustomEvent('tyrelink:edit-product', {
        detail: { product: currentProduct },
      })
    );
  };

  const handleToggleStock = async () => {
    if (isTogglingStock) return;
    setIsTogglingStock(true);
    const nextState = !inStock;
    setInStock(nextState);

    try {
      const res = await toggleProductStock(currentProduct.id, nextState);
      if (res.success) {
        setCurrentProduct((prev) => ({ ...prev, inStock: nextState }));
        setToastMessage(nextState ? '✓ Stock: In Stock (තොග ඇත)' : '✓ Stock: Out of Stock (තොග අවසන්)');
        setTimeout(() => setToastMessage(null), 3000);
      } else {
        // Revert on failure
        setInStock(!nextState);
        alert('Failed to update stock status: ' + (res.error || 'Unknown error'));
      }
    } catch (e: any) {
      setInStock(!nextState);
      alert('Error updating stock status: ' + e?.message);
    } finally {
      setIsTogglingStock(false);
    }
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await deleteLiveProduct(currentProduct.id);
      if (res.success) {
        window.location.href = '/shop';
      } else {
        alert('Failed to delete product: ' + (res.error || 'Unknown error'));
        setIsDeleting(false);
        setShowDeleteConfirm(false);
      }
    } catch (e: any) {
      alert('Error deleting product: ' + e?.message);
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const hasVideo = Boolean(currentProduct.youtubeReviewId && currentProduct.youtubeReviewId.trim());

  return (
    <>
      {/* Top Floating Merchant Control Dock on Product Page */}
      <div className="w-full mb-6 p-4 sm:p-5 rounded-2xl bg-slate-950/95 border-2 border-brand-500/50 shadow-[0_16px_40px_rgba(237,28,36,0.18)] text-white backdrop-blur-2xl transition-all animate-in fade-in slide-in-from-top-2 duration-300">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Left: Product Meta Badges */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold uppercase tracking-wider text-[11px]">
              <Sparkles className="w-3.5 h-3.5" />
              Product Admin Controls
            </span>

            <span className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-mono text-[11px]">
              ID: {currentProduct.id}
            </span>

            <span className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-medium text-[11px]">
              Max Order Limit: <b className="text-amber-400 font-mono">{currentProduct.maxOrderQuantity || 3}</b>
            </span>

            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border text-[11px] font-semibold ${
                hasVideo
                  ? 'bg-red-500/10 text-red-400 border-red-500/30'
                  : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}
            >
              <Video className="w-3 h-3" />
              {hasVideo ? `Review Video: Active` : `No Review Video (Hidden)`}
            </span>
          </div>

          {/* Right: Quick Action Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {toastMessage && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 font-bold text-xs animate-in fade-in slide-in-from-right duration-200">
                {toastMessage}
              </span>
            )}
            {/* Quick 1-Click Stock Availability Toggle */}
            <button
              type="button"
              onClick={handleToggleStock}
              disabled={isTogglingStock}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs border transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95 disabled:opacity-50 ${
                inStock
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                  : 'bg-red-500/20 text-red-300 border-red-500/40 hover:bg-red-500/30'
              }`}
              title="Click to toggle between In Stock and Out of Stock instantly"
            >
              {inStock ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>● In Stock (තොග ඇත)</span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-red-400" />
                  <span>✕ Out of Stock (තොග අවසන්)</span>
                </>
              )}
            </button>

            {/* Edit Full Product Details */}
            <button
              type="button"
              onClick={handleEditClick}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs transition-all shadow-md shadow-brand-500/30 hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Details</span>
            </button>

            {/* Delete Product */}
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-600/40 font-bold text-xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>

        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 text-left shadow-2xl space-y-5 text-white">
            <div className="flex items-center gap-3 text-red-400">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <ShieldAlert className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-base font-black font-display text-white">Permanently Delete Product?</h3>
                <p className="text-xs text-slate-400">This action cannot be undone.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-3">
              <img
                src={currentProduct.featuredImage}
                alt={currentProduct.title}
                className="w-14 h-14 object-contain rounded-xl bg-white p-1"
              />
              <div className="min-w-0 flex-1 text-xs">
                <p className="font-bold text-white truncate">{currentProduct.title}</p>
                <p className="text-brand-400 font-mono font-bold">Rs. {currentProduct.price.toLocaleString('en-US')}</p>
                <p className="text-slate-500 text-[10px] uppercase">{currentProduct.category}</p>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Deleting this product will remove it from the store catalog, flash deals, and trending recommendation lists immediately.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-all shadow-lg shadow-red-600/30 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? 'Deleting Product...' : 'Yes, Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
