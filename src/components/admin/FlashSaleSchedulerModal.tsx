import React, { useState, useEffect } from 'react';
import { X, Zap, Calendar, Clock, Check, Search, AlertCircle, CheckCircle2 } from 'lucide-react';
import { getCampaignsData, saveCampaignsData, getLiveProducts, saveLiveProducts } from '../../utils/adminStore';
import type { Product, FlashSaleConfig } from '../../types';

interface FlashSaleSchedulerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export default function FlashSaleSchedulerModal({
  isOpen,
  onClose,
  onSaved,
}: FlashSaleSchedulerModalProps) {
  const [isActive, setIsActive] = useState(true);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Initialize data from current campaigns & inventory
  useEffect(() => {
    if (isOpen) {
      const allProducts = getLiveProducts();
      setProducts(allProducts);

      const campaigns = getCampaignsData();
      const cfg: FlashSaleConfig = campaigns.flashSale || {
        isActive: true,
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
        productIds: [],
      };

      setIsActive(cfg.isActive);

      // Format to datetime-local format: YYYY-MM-DDTHH:mm
      try {
        const s = new Date(cfg.startTime);
        const e = new Date(cfg.endTime);
        setStartTime(s.toISOString().slice(0, 16));
        setEndTime(e.toISOString().slice(0, 16));
      } catch {
        const now = new Date();
        const plus2Days = new Date(Date.now() + 48 * 3600 * 1000);
        setStartTime(now.toISOString().slice(0, 16));
        setEndTime(plus2Days.toISOString().slice(0, 16));
      }

      setSelectedProductIds(cfg.productIds || []);
      setError(null);
      setSuccess(false);
    }
  }, [isOpen]);

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

  // Status calculation
  const getSaleStatus = () => {
    if (!isActive) return { label: 'INACTIVE', color: 'text-slate-400 bg-slate-800 border-slate-700' };
    const now = Date.now();
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();

    if (now < start) {
      return { label: 'SCHEDULED (Not Started)', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
    }
    if (now > end) {
      return { label: 'EXPIRED (Ended)', color: 'text-red-400 bg-red-500/10 border-red-500/30' };
    }
    return { label: 'LIVE NOW (Visible to Visitors)', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
  };

  const status = getSaleStatus();

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
    if (!startTime || !endTime) {
      setError('Please set both Start Time and End Time.');
      return;
    }

    if (new Date(endTime).getTime() <= new Date(startTime).getTime()) {
      setError('End Time must be after Start Time.');
      return;
    }

    if (isActive && selectedProductIds.length === 0) {
      setError('Please select at least 1 product to include in Flash Deals.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const currentCampaigns = getCampaignsData();
      const updatedFlashSale: FlashSaleConfig = {
        isActive,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        productIds: selectedProductIds,
      };

      const updatedCampaigns = {
        ...currentCampaigns,
        flashSale: updatedFlashSale,
      };

      // 1. Save campaigns schedule
      await saveCampaignsData(updatedCampaigns);

      // 2. Synchronize isFlashDeal attribute on all products
      const updatedProducts = products.map((p) => ({
        ...p,
        isFlashDeal: selectedProductIds.includes(p.id),
      }));

      await saveLiveProducts(updatedProducts);

      setSuccess(true);
      if (onSaved) onSaved();

      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      setError('Save error: ' + (err?.message || 'Failed to update campaign'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl my-auto max-h-[88vh] bg-slate-900 border border-slate-700/80 rounded-xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden text-left text-slate-100">

        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black font-display text-white">
                  Flash Sale Campaign Manager
                </h2>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${status.color}`}>
                  {status.label}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Automated timed deals shown in Today's Flash Deals carousel
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
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Flash Sale configuration saved successfully!</span>
            </div>
          )}

          {/* Master Active Toggle & Timers */}
          <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-white text-sm">Flash Sale Master Status</p>
                <p className="text-[11px] text-slate-400">When disabled, section completely hides from users</p>
              </div>
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`w-14 h-8 rounded-full p-1 transition-colors cursor-pointer ${isActive ? 'bg-amber-500' : 'bg-slate-800'
                  }`}
              >
                <div
                  className={`w-6 h-6 rounded-full bg-white transition-transform ${isActive ? 'translate-x-6' : 'translate-x-0'
                    }`}
                />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800/80">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>Start Date & Time</span>
                </label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>End Date & Time (Auto-Hides)</span>
                </label>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Product Selection Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-sm">Select Flash Sale Products</h3>
                <p className="text-[11px] text-slate-400">
                  {selectedProductIds.length} item(s) currently assigned
                </p>
              </div>

              <div className="relative w-48 sm:w-60">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter inventory..."
                  className="w-full h-8 pl-8 pr-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Product selection list */}
            <div className="border border-slate-800 rounded-2xl bg-slate-950/40 divide-y divide-slate-850 max-h-60 overflow-y-auto">
              {filteredProducts.map((p) => {
                const isSelected = selectedProductIds.includes(p.id);
                return (
                  <div
                    key={p.id}
                    onClick={() => toggleProduct(p.id)}
                    className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${isSelected ? 'bg-amber-500/10' : 'hover:bg-slate-900'
                      }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${isSelected
                            ? 'bg-amber-500 border-amber-500 text-slate-950 font-bold'
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
                      <span className="font-mono font-bold text-amber-400 text-xs">
                        Rs. {p.price.toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
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
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-brand-500/20 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <span className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
            ) : (
              <>
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Save Schedule & Sync Products</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
