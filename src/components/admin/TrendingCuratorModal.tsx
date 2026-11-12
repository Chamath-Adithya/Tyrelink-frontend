import React, { useState, useEffect } from 'react';
import { X, Flame, Search, Check, AlertCircle, CheckCircle2 } from 'lucide-react';
import { getCampaignsData, saveCampaignsData, getLiveProducts, saveLiveProducts } from '../../utils/adminStore';
import type { Product, TrendingConfig } from '../../types';

interface TrendingCuratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export default function TrendingCuratorModal({
  isOpen,
  onClose,
  onSaved,
}: TrendingCuratorModalProps) {
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const allProducts = getLiveProducts();
      setProducts(allProducts);

      const campaigns = getCampaignsData();
      const cfg: TrendingConfig = campaigns.trending || {
        isActive: true,
        productIds: [],
      };

      setSelectedProductIds(cfg.productIds || []);
      setError(null);
      setSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleProduct = (id: string) => {
    if (selectedProductIds.includes(id)) {
      setSelectedProductIds(selectedProductIds.filter((pId) => pId !== id));
    } else {
      setSelectedProductIds([...selectedProductIds, id]);
    }
  };

  const filteredProducts = products.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    return !q || p.title.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
  });

  const handleSave = async () => {
    if (selectedProductIds.length === 0) {
      setError('Please select at least 1 product for Trending & Best Sellers.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const currentCampaigns = getCampaignsData();
      const updatedTrending: TrendingConfig = {
        isActive: true,
        productIds: selectedProductIds,
      };

      const updatedCampaigns = {
        ...currentCampaigns,
        trending: updatedTrending,
      };

      // 1. Save campaigns config
      await saveCampaignsData(updatedCampaigns);

      // 2. Synchronize isBestSeller on products
      const updatedProducts = products.map((p) => ({
        ...p,
        isBestSeller: selectedProductIds.includes(p.id),
      }));

      await saveLiveProducts(updatedProducts);

      setSuccess(true);
      if (onSaved) onSaved();

      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      setError('Save error: ' + (err?.message || 'Failed to update trending items'));
    } finally {
      setSaving(false);
    }
  };

  // Lock body scroll while modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl my-auto max-h-[88vh] bg-slate-900 border border-slate-700/80 rounded-[2rem] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden text-left text-slate-100">

        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold">
                <Flame className="w-5 h-5 fill-current" />
              </div>
              <div>
                <h2 className="text-lg font-black font-display text-white">
                  Trending & Best Sellers Curator
                </h2>
                <p className="text-xs text-slate-400">
                  Choose flagship tyres and equipment featured on the homepage carousel
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Trending items updated successfully!</span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-white text-sm">Select Tyres & Equipment to Feature</p>
                <p className="text-[11px] text-slate-400">
                  {selectedProductIds.length} item(s) selected
                </p>
              </div>

              <div className="relative w-48 sm:w-60">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="w-full h-8 pl-8 pr-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            {/* Product list */}
            <div className="border border-slate-800 rounded-2xl bg-slate-950/40 divide-y divide-slate-850 max-h-80 overflow-y-auto">
              {filteredProducts.map((p) => {
                const isSelected = selectedProductIds.includes(p.id);
                return (
                  <div
                    key={p.id}
                    onClick={() => toggleProduct(p.id)}
                    isSelected ? 'bg-brand-500/10' : 'hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w - 5 h - 5 rounded - md flex items - center justify - center border transition - all ${
                isSelected
                  ? 'bg-brand-500 border-brand-500 text-white font-bold'
                          : 'border-slate-700 bg-slate-900'
                      }`}
                    >
              {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </div>
            <img
              src={p.featuredImage}
              alt={p.title}
              className="w-10 h-10 rounded-lg object-cover bg-white shrink-0 border border-slate-700"
            />
            <div className="truncate">
              <p className="font-bold text-white truncate text-xs">{p.title}</p>
              <p className="text-[11px] text-slate-400">
                {p.brand} • <span className="capitalize">{p.category}</span>
              </p>
            </div>
          </div>

          <div className="text-right shrink-0 ml-3">
              <span className="font-mono font-bold text-brand-400 text-xs">
                Rs. {p.price.toLocaleString()}
              </span>
          </div>
        </div>
        );
            })}
      </div>
    </div>

        {/* Footer */ }
  <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-end gap-3">
    <button
      type="button"
      onClick={onClose}
      className="px-5 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 font-bold text-xs transition-colors cursor-pointer"
    >
      Cancel
    </button>
    <button
      type="button"
      onClick={handleSave}
      disabled={saving}
      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-brand-500/25 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
    >
      {saving ? (
        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : (
        <>
          <Check className="w-4 h-4 stroke-[2.5]" />
          <span>Save Trending Collection</span>
        </>
      )}
    </button>
  </div>

      </div >
    </div >
  );
}
