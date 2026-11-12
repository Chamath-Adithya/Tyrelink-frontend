import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Sparkles, Check, AlertCircle, Video, ShieldCheck, CreditCard, Calculator } from 'lucide-react';
import categoriesData from '../../data/categories.json';
import type { Product, ProductCategory } from '../../types';
import {
  getLiveProducts,
  saveLiveProducts,
  deleteLiveProduct,
  extractYouTubeId,
} from '../../utils/adminStore';

interface ProductEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
  onSaved?: () => void;
}

export default function ProductEditorModal({
  isOpen,
  onClose,
  productToEdit,
  onSaved,
}: ProductEditorModalProps) {
  const [title, setTitle] = useState('');
  const [sinhalaTitle, setSinhalaTitle] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState<ProductCategory>('car-tyres');
  const [price, setPrice] = useState<number>(0);
  const [originalPrice, setOriginalPrice] = useState<number>(0);
  const [kokoCount, setKokoCount] = useState<number>(3);
  const [kokoAmount, setKokoAmount] = useState<number>(0);
  const [payzyCount, setPayzyCount] = useState<number>(4);
  const [payzyAmount, setPayzyAmount] = useState<number>(0);
  const [inStock, setInStock] = useState<boolean>(true);
  const [maxOrderQuantity, setMaxOrderQuantity] = useState<number>(3);
  const [videoUrl, setVideoUrl] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [galleryImages, setGalleryImages] = useState<string>('');
  const [warranty, setWarranty] = useState('6 Months Genuine Warranty');
  const [isFlashDeal, setIsFlashDeal] = useState(false);
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [shortDescription, setShortDescription] = useState('');
  const [specs, setSpecs] = useState<Array<{ key: string; value: string }>>([
    { key: 'Brand', value: '' },
    { key: 'Warranty', value: '6 Months' },
  ]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Populate fields if editing
  useEffect(() => {
    if (productToEdit) {
      setTitle(productToEdit.title || '');
      setSinhalaTitle(productToEdit.sinhalaTitle || '');
      setBrand(productToEdit.brand || '');
      setCategory(productToEdit.category || 'car-tyres');
      setPrice(productToEdit.price || 0);
      setOriginalPrice(productToEdit.originalPrice || 0);
      const kCount = productToEdit.kokoInstallmentCount || productToEdit.installmentCount || 3;
      setKokoCount(kCount);
      const kAmount = productToEdit.kokoInstallmentAmount || productToEdit.installmentAmount || (productToEdit.price > 0 ? Math.round(productToEdit.price / kCount) : 0);
      setKokoAmount(kAmount);

      const pCount = productToEdit.payzyInstallmentCount || 4;
      setPayzyCount(pCount);
      const pAmount = productToEdit.payzyInstallmentAmount || (productToEdit.price > 0 ? Math.round(productToEdit.price / pCount) : 0);
      setPayzyAmount(pAmount);

      setInStock(productToEdit.inStock ?? true);
      setMaxOrderQuantity(productToEdit.maxOrderQuantity && productToEdit.maxOrderQuantity > 0 ? productToEdit.maxOrderQuantity : 3);
      setVideoUrl(productToEdit.youtubeReviewId ? `https://www.youtube.com/watch?v=${productToEdit.youtubeReviewId}` : '');
      setFeaturedImage(productToEdit.featuredImage || '');
      setGalleryImages((productToEdit.images || []).join('\n'));
      setWarranty(productToEdit.warranty || '6 Months Genuine Warranty');
      setIsFlashDeal(Boolean(productToEdit.isFlashDeal));
      setIsBestSeller(Boolean(productToEdit.isBestSeller));
      setShortDescription(productToEdit.shortDescription || '');

      const specList = Object.entries(productToEdit.specs || {}).map(([key, value]) => ({
        key,
        value: String(value),
      }));
      setSpecs(specList.length > 0 ? specList : [{ key: '', value: '' }]);
    } else {
      // Defaults for new product
      setTitle('');
      setSinhalaTitle('');
      setBrand('');
      setCategory('car-tyres');
      setPrice(0);
      setOriginalPrice(0);
      setKokoCount(3);
      setKokoAmount(0);
      setPayzyCount(4);
      setPayzyAmount(0);
      setInStock(true);
      setMaxOrderQuantity(3);
      setVideoUrl('');
      setFeaturedImage('');
      setGalleryImages('');
      setWarranty('6 Months Genuine Warranty');
      setIsFlashDeal(false);
      setIsBestSeller(false);
      setShortDescription('');
      setSpecs([
        { key: 'Connectivity', value: 'Wired USB-C' },
        { key: 'Compatibility', value: 'Windows / Mac' },
      ]);
    }
    setError(null);
  }, [productToEdit, isOpen]);

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

  const detectedVideoId = extractYouTubeId(videoUrl);

  const handleAddSpec = () => {
    setSpecs([...specs, { key: '', value: '' }]);
  };

  const handleRemoveSpec = (idx: number) => {
    setSpecs(specs.filter((_, i) => i !== idx));
  };

  const handleSpecChange = (idx: number, field: 'key' | 'value', val: string) => {
    const updated = [...specs];
    updated[idx][field] = val;
    setSpecs(updated);
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || price <= 0 || !featuredImage.trim()) {
      setError('Please provide Product Title, Valid Price, and Featured Image URL.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const allProducts = getLiveProducts();
      const specsObj: Record<string, string> = {};
      specs.forEach((s) => {
        if (s.key.trim() && s.value.trim()) {
          specsObj[s.key.trim()] = s.value.trim();
        }
      });

      const imagesArray = galleryImages
        .split('\n')
        .map((url) => url.trim())
        .filter((url) => url.length > 0);

      if (!imagesArray.includes(featuredImage.trim())) {
        imagesArray.unshift(featuredImage.trim());
      }

      const finalVideoId = detectedVideoId || undefined;
      const cleanMaxOrder = Math.max(1, Math.min(10, Number(maxOrderQuantity) || 3));

      const cleanKokoCount = Number(kokoCount) > 0 ? Number(kokoCount) : 3;
      const cleanKokoAmount = Number(kokoAmount) > 0 ? Number(kokoAmount) : (Number(price) > 0 ? Math.round(Number(price) / cleanKokoCount) : 0);

      const cleanPayzyCount = Number(payzyCount) > 0 ? Number(payzyCount) : 4;
      const cleanPayzyAmount = Number(payzyAmount) > 0 ? Number(payzyAmount) : (Number(price) > 0 ? Math.round(Number(price) / cleanPayzyCount) : 0);

      if (productToEdit) {
        // Update existing product
        const updatedList = allProducts.map((p) => {
          if (p.id === productToEdit.id) {
            return {
              ...p,
              title: title.trim(),
              sinhalaTitle: sinhalaTitle.trim() || undefined,
              brand: brand.trim() || 'Tyrelink',
              category,
              price: Number(price),
              originalPrice: originalPrice > price ? Number(originalPrice) : undefined,
              inStock: Boolean(inStock),
              maxOrderQuantity: cleanMaxOrder,
              installmentCount: cleanKokoCount,
              installmentAmount: cleanKokoAmount,
              kokoInstallmentCount: cleanKokoCount,
              kokoInstallmentAmount: cleanKokoAmount,
              payzyInstallmentCount: cleanPayzyCount,
              payzyInstallmentAmount: cleanPayzyAmount,
              youtubeReviewId: finalVideoId,
              featuredImage: featuredImage.trim(),
              images: imagesArray,
              warranty: warranty.trim(),
              isFlashDeal: Boolean(isFlashDeal),
              isBestSeller: Boolean(isBestSeller),
              shortDescription: shortDescription.trim() || title.trim(),
              specs: specsObj,
            };
          }
          return p;
        });

        await saveLiveProducts(updatedList);
      } else {
        // Add new product
        const slug = generateSlug(title);
        const newId = slug + '-' + Date.now().toString(36);

        const newProduct: Product = {
          id: newId,
          slug,
          title: title.trim(),
          sinhalaTitle: sinhalaTitle.trim() || undefined,
          brand: brand.trim() || 'Tyrelink',
          category,
          price: Number(price),
          originalPrice: originalPrice > price ? Number(originalPrice) : undefined,
          featuredImage: featuredImage.trim(),
          images: imagesArray,
          inStock: Boolean(inStock),
          maxOrderQuantity: cleanMaxOrder,
          installmentCount: cleanKokoCount,
          installmentAmount: cleanKokoAmount,
          kokoInstallmentCount: cleanKokoCount,
          kokoInstallmentAmount: cleanKokoAmount,
          payzyInstallmentCount: cleanPayzyCount,
          payzyInstallmentAmount: cleanPayzyAmount,
          youtubeReviewId: finalVideoId,
          warranty: warranty.trim(),
          isFeatured: true,
          isFlashDeal: Boolean(isFlashDeal),
          isBestSeller: Boolean(isBestSeller),
          shortDescription: shortDescription.trim() || title.trim(),
          specs: specsObj,
          rating: 4.8,
          reviewCount: 1,
        };

        const updatedList = [newProduct, ...allProducts];
        await saveLiveProducts(updatedList);
      }

      if (onSaved) onSaved();
      onClose();
    } catch (err: any) {
      setError('Save error: ' + (err?.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!productToEdit) return;
    const confirmed = window.confirm(
      `⚠️ ARE YOU SURE?\n\nPermanently delete "${productToEdit.title}"?\nThis will remove the item from the Tyrelink catalog and any active campaigns.`
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      const res = await deleteLiveProduct(productToEdit.id);
      if (!res.success) {
        setError(res.error || 'Failed to delete product');
        setDeleting(false);
        return;
      }

      onClose();
      // If we are currently on this product's page, navigate to shop
      if (typeof window !== 'undefined') {
        if (window.location.pathname.includes(`/product/${productToEdit.slug}`)) {
          window.location.href = '/shop';
        } else {
          window.location.reload();
        }
      }
    } catch (err: any) {
      setError('Delete error: ' + (err?.message || 'Unknown error'));
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 md:p-8 bg-black/85 backdrop-blur-xl overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl my-auto max-h-[88vh] bg-slate-900 border border-slate-700/80 rounded-[2rem] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden text-left text-slate-100">

        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black font-display text-white">
                {productToEdit ? 'Edit Product Details' : 'Add New Hardware Product'}
              </h2>
              <p className="text-xs text-slate-400">
                {productToEdit ? `Updating ID: ${productToEdit.id}` : 'Syncs directly to products.json database'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Basic Identifiers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="font-bold text-slate-300">Product Title (English) *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Michelin Energy XM2+ 195/65 R15"
                className="w-full h-11 px-3.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="font-bold text-slate-300">Sinhala Title (Optional display badge)</label>
              <input
                type="text"
                value={sinhalaTitle}
                onChange={(e) => setSinhalaTitle(e.target.value)}
                placeholder="e.g. මිචෙලින් කාර් ටයරය"
                className="w-full h-11 px-3.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-300">Brand *</label>
              <input
                type="text"
                required
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. Michelin, CEAT, DSI, Dunlop, Hankook"
                className="w-full h-11 px-3.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-300">Category (From categories.json) *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ProductCategory)}
                className="w-full h-11 px-3.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-brand-500 capitalize"
              >
                {categoriesData.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({cat.sinhalaName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Section 2: Pricing & Stock Limits (No numeric quantity needed, only binary stock + max order limit) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-950/50 border border-slate-800/80">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-300">Selling Price (Rs.) *</label>
              <input
                type="number"
                required
                min="100"
                value={price || ''}
                onChange={(e) => {
                  const newPrice = Number(e.target.value);
                  const oldKokoExpected = price > 0 ? Math.round(price / (kokoCount || 3)) : 0;
                  const oldPayzyExpected = price > 0 ? Math.round(price / (payzyCount || 4)) : 0;
                  setPrice(newPrice);
                  if (!kokoAmount || kokoAmount === oldKokoExpected) {
                    setKokoAmount(newPrice > 0 ? Math.round(newPrice / (kokoCount || 3)) : 0);
                  }
                  if (!payzyAmount || payzyAmount === oldPayzyExpected) {
                    setPayzyAmount(newPrice > 0 ? Math.round(newPrice / (payzyCount || 4)) : 0);
                  }
                }}
                placeholder="9950"
                className="w-full h-11 px-3.5 rounded-xl bg-slate-950 border border-slate-800 text-brand-400 font-mono font-bold focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-300">Original Price (Rs.)</label>
              <input
                type="number"
                min="0"
                value={originalPrice || ''}
                onChange={(e) => setOriginalPrice(Number(e.target.value))}
                placeholder="11500"
                className="w-full h-11 px-3.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 font-mono focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-300">Stock Availability</label>
              <button
                type="button"
                onClick={() => setInStock(!inStock)}
                className={`w-full h-11 rounded-xl font-bold flex items-center justify-center transition-all cursor-pointer ${inStock
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                    : 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                  }`}
              >
                {inStock ? '● In Stock (තොග ඇත)' : '✕ Out of Stock (තොග අවසන්)'}
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-300">Max Order Limit</label>
              <input
                type="number"
                min="1"
                max="10"
                value={maxOrderQuantity}
                onChange={(e) => setMaxOrderQuantity(Math.max(1, Math.min(10, Number(e.target.value))))}
                className="w-full h-11 px-3.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-brand-500"
                placeholder="3"
              />
              <p className="text-[10px] text-slate-500">Max qty 1 buyer can select</p>
            </div>
          </div>

          {/* Section 2.5: Separate Koko Pay & PayZy BNPL Installment Settings */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800 space-y-4">
            <div>
              <label className="font-bold text-white flex items-center gap-2 text-xs sm:text-sm">
                <CreditCard className="w-4 h-4 text-brand-400 shrink-0" />
                <span>BNPL Installment Plans: Koko Pay (paykoko.com) & PayZy (payzy.lk)</span>
              </label>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Koko Pay සහ PayZy සඳහා වාරික ගණන සහ එක් වාරිකයක මුදල වෙන වෙනම (separately) edit කළ හැක.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Card 1: Koko Pay */}
              <div className="p-3.5 rounded-xl bg-orange-950/20 border border-orange-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img
                      src="/images/payments/koko-logo.png"
                      alt="Koko Pay"
                      className="h-5 max-h-5 w-auto object-contain"
                      style={{ height: '20px', maxWidth: '75px', objectFit: 'contain' }}
                    />
                    <a
                      href="https://paykoko.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-4 h-4 rounded-full bg-slate-700 hover:bg-orange-500 text-white flex items-center justify-center text-[10px] font-bold font-serif transition-colors"
                      title="Visit paykoko.com (opens in new tab)"
                    >
                      i
                    </a>
                  </div>

                  {price > 0 && (
                    <button
                      type="button"
                      onClick={() => setKokoAmount(Math.round(price / (kokoCount || 3)))}
                      className="px-2 py-1 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/40 text-[9px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                      title="Auto-calculate Koko amount"
                    >
                      <Calculator className="w-3 h-3 text-orange-400" />
                      Auto (Rs. {Math.round(price / (kokoCount || 3)).toLocaleString('en-US')})
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-300">වාරික ගණන</label>
                      <div className="flex items-center gap-0.5">
                        {[2, 3, 4].map((cnt) => (
                          <button
                            key={cnt}
                            type="button"
                            onClick={() => {
                              setKokoCount(cnt);
                              if (price > 0) setKokoAmount(Math.round(price / cnt));
                            }}
                            className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${kokoCount === cnt
                                ? 'bg-orange-500 text-white'
                                : 'bg-slate-800 text-slate-400 hover:text-white'
                              }`}
                          >
                            {cnt}×
                          </button>
                        ))}
                      </div>
                    </div>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={kokoCount || ''}
                      onChange={(e) => setKokoCount(Math.max(1, Number(e.target.value)))}
                      placeholder="3"
                      className="w-full h-9 px-3 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300">වාරිකයක මුදල (Rs.)</label>
                    <input
                      type="number"
                      min="1"
                      value={kokoAmount || ''}
                      onChange={(e) => setKokoAmount(Math.max(0, Number(e.target.value)))}
                      placeholder="e.g. 23167"
                      className="w-full h-9 px-3 rounded-lg bg-slate-950 border border-slate-800 text-orange-400 font-mono font-bold text-xs focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>
              </div>

              {/* Card 2: PayZy */}
              <div className="p-3.5 rounded-xl bg-sky-950/20 border border-sky-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img
                      src="/images/payments/payzy-logo.png"
                      alt="PayZy"
                      className="h-5 max-h-5 w-auto object-contain"
                      style={{ height: '20px', maxWidth: '75px', objectFit: 'contain' }}
                    />
                    <a
                      href="https://payzy.lk/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-4 h-4 rounded-full bg-slate-700 hover:bg-sky-500 text-white flex items-center justify-center text-[10px] font-bold font-serif transition-colors"
                      title="Visit payzy.lk (opens in new tab)"
                    >
                      i
                    </a>
                  </div>

                  {price > 0 && (
                    <button
                      type="button"
                      onClick={() => setPayzyAmount(Math.round(price / (payzyCount || 4)))}
                      className="px-2 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 text-[9px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                      title="Auto-calculate PayZy amount"
                    >
                      <Calculator className="w-3 h-3 text-sky-400" />
                      Auto (Rs. {Math.round(price / (payzyCount || 4)).toLocaleString('en-US')})
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-300">වාරික ගණන</label>
                      <div className="flex items-center gap-0.5">
                        {[2, 3, 4, 6].map((cnt) => (
                          <button
                            key={cnt}
                            type="button"
                            onClick={() => {
                              setPayzyCount(cnt);
                              if (price > 0) setPayzyAmount(Math.round(price / cnt));
                            }}
                            className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${payzyCount === cnt
                                ? 'bg-sky-500 text-white'
                                : 'bg-slate-800 text-slate-400 hover:text-white'
                              }`}
                          >
                            {cnt}×
                          </button>
                        ))}
                      </div>
                    </div>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={payzyCount || ''}
                      onChange={(e) => setPayzyCount(Math.max(1, Number(e.target.value)))}
                      placeholder="4"
                      className="w-full h-9 px-3 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300">වාරිකයක මුදල (Rs.)</label>
                    <input
                      type="number"
                      min="1"
                      value={payzyAmount || ''}
                      onChange={(e) => setPayzyAmount(Math.max(0, Number(e.target.value)))}
                      placeholder="e.g. 17375"
                      className="w-full h-9 px-3 rounded-lg bg-slate-950 border border-slate-800 text-sky-400 font-mono font-bold text-xs focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Live Combined Storefront Preview */}
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400">
                Live Storefront Preview (Product Page):
              </span>
              <div className="p-3 rounded-xl bg-white text-slate-800 space-y-2 shadow-sm border border-slate-200">
                {/* Koko Row */}
                <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                  <span>or {kokoCount || 3} X</span>
                  <span className="font-mono font-black text-slate-900">
                    Rs.{(kokoAmount || (price > 0 ? Math.round(price / (kokoCount || 3)) : 0)).toLocaleString('en-US')}
                  </span>
                  <span>with</span>
                  <span className="inline-flex items-center gap-1">
                    <img
                      src="/images/payments/koko-logo.png"
                      alt="Koko"
                      className="h-4 max-h-4 w-auto object-contain"
                      style={{ height: '16px', maxWidth: '60px', objectFit: 'contain' }}
                    />
                    <span className="w-3.5 h-3.5 rounded-full bg-slate-800 text-white flex items-center justify-center text-[9px] font-bold font-serif">i</span>
                  </span>
                </div>
                {/* PayZy Row */}
                <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium pt-1.5 border-t border-slate-100">
                  <span>or up to {payzyCount || 4} X</span>
                  <span className="font-mono font-black text-slate-900">
                    Rs.{(payzyAmount || (price > 0 ? Math.round(price / (payzyCount || 4)) : 0)).toLocaleString('en-US')}
                  </span>
                  <span>with</span>
                  <span className="inline-flex items-center gap-1">
                    <img
                      src="/images/payments/payzy-logo.png"
                      alt="PayZy"
                      className="h-4 max-h-4 w-auto object-contain"
                      style={{ height: '16px', maxWidth: '60px', objectFit: 'contain' }}
                    />
                    <span className="w-3.5 h-3.5 rounded-full bg-slate-800 text-white flex items-center justify-center text-[9px] font-bold font-serif">i</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: YouTube Review Video URL (Optional - hidden if empty) */}
          <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800/80 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div>
                <label className="font-bold text-slate-200 flex items-center gap-2">
                  <Video className="w-4 h-4 text-red-400" />
                  <span>Hands-On Review Video URL (YouTube)</span>
                </label>
                <p className="text-[11px] text-slate-400">
                  වීඩියෝවක් නැතිනම් මෙම field එක හිස්ව තබන්න. එවිට Product පිටුවේ Review Video කොටස auto-hide (disable) වේ.
                </p>
              </div>
              {detectedVideoId && (
                <span className="self-start px-2.5 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-bold font-mono">
                  ID: {detectedVideoId}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="e.g. https://www.youtube.com/watch?v=F3_z8eL4Rtc or shortlink"
                className="flex-1 h-11 px-3.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-brand-500 text-xs"
              />
              {videoUrl && (
                <button
                  type="button"
                  onClick={() => setVideoUrl('')}
                  className="px-3 h-11 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer shrink-0"
                >
                  Clear Video
                </button>
              )}
            </div>

            {detectedVideoId ? (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
                <img
                  src={`https://i.ytimg.com/vi/${detectedVideoId}/hqdefault.jpg`}
                  alt="Video thumbnail"
                  className="w-20 h-12 object-cover rounded-lg border border-slate-700 bg-black shrink-0"
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
                <div>
                  <p className="font-bold text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    Video Attached & Active
                  </p>
                  <p className="text-[11px] text-slate-400">
                    This video will appear in the Hands-On Review section of this product's page.
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-slate-500 italic">
                {videoUrl.trim()
                  ? '⚠️ Invalid YouTube link. Please paste a valid YouTube watch/shorts URL or 11-char ID.'
                  : '○ No review video linked (Video Review section will stay completely hidden on the product page).'}
              </p>
            )}
          </div>

          {/* Section 4: Images & Preview */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-300">Primary Featured Image URL *</label>
              <input
                type="url"
                required
                value={featuredImage}
                onChange={(e) => setFeaturedImage(e.target.value)}
                placeholder="https://images.unsplash.com/photo-..."
                className="w-full h-11 px-3.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-brand-500"
              />
            </div>

            {featuredImage && (
              <div className="flex items-center gap-4 p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                <img
                  src={featuredImage}
                  alt="Preview"
                  className="w-16 h-16 object-cover rounded-xl border border-slate-700 bg-white shrink-0"
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
                <div className="text-xs text-slate-400 min-w-0">
                  <p className="font-bold text-white">Live Image Preview</p>
                  <p className="text-[11px] text-slate-500 truncate max-w-md">{featuredImage}</p>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="font-bold text-slate-300">Gallery Image URLs (1 per line)</label>
              <textarea
                rows={2}
                value={galleryImages}
                onChange={(e) => setGalleryImages(e.target.value)}
                placeholder="https://...&#10;https://..."
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs placeholder:text-slate-600 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {/* Section 5: Warranty & Description */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-300">Warranty Policy Statement</label>
              <input
                type="text"
                value={warranty}
                onChange={(e) => setWarranty(e.target.value)}
                placeholder="e.g. 6 Months Genuine Company Warranty"
                className="w-full h-11 px-3.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="space-y-1.5 flex items-center gap-6 pt-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFlashDeal}
                  onChange={(e) => setIsFlashDeal(e.target.checked)}
                  className="w-4 h-4 rounded text-brand-500 bg-slate-950 border-slate-700 focus:ring-0"
                />
                <span className="font-bold text-amber-400">⚡ Flash Deal Candidate</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isBestSeller}
                  onChange={(e) => setIsBestSeller(e.target.checked)}
                  className="w-4 h-4 rounded text-brand-500 bg-slate-950 border-slate-700 focus:ring-0"
                />
                <span className="font-bold text-brand-400">🔥 Best Seller</span>
              </label>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="font-bold text-slate-300">Short Description</label>
              <textarea
                rows={2}
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="High-mileage tread compound, wet grip performance, reinforced sidewall..."
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {/* Section 6: Specs Key-Values */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-300">Technical Specifications</label>
              <button
                type="button"
                onClick={handleAddSpec}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Spec Field
              </button>
            </div>

            <div className="space-y-2">
              {specs.map((spec, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={spec.key}
                    onChange={(e) => handleSpecChange(idx, 'key', e.target.value)}
                    placeholder="Spec Name (e.g. Size / Ply Rating)"
                    className="w-1/3 h-10 px-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium"
                  />
                  <input
                    type="text"
                    value={spec.value}
                    onChange={(e) => handleSpecChange(idx, 'value', e.target.value)}
                    placeholder="Value (e.g. 195/65 R15 91V)"
                    className="flex-1 h-10 px-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium"
                  />
                  {specs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSpec(idx)}
                      className="p-2.5 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </form>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between gap-3">
          {productToEdit ? (
            <button
              type="button"
              onClick={handleDeleteProduct}
              disabled={deleting || saving}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              <span>{deleting ? 'Deleting...' : 'Delete Product'}</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving || deleting}
              className="px-5 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 font-bold text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving || deleting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-amber-500 hover:from-brand-500 hover:to-amber-400 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-brand-500/25 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {saving ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{productToEdit ? 'Save Changes' : 'Publish Product'}</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
