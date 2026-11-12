import React, { useState, useMemo } from 'react';
import {
  Boxes,
  ShoppingBag,
  ArrowRight,
  ArrowUp,
  Layers,
  Flame,
  CheckCircle2,
  Check
} from 'lucide-react';
import productsData from '../data/products.json';
import categoriesData from '../data/categories.json';
import { addToCart } from '../utils/cartStore';
import type { Product } from '../types';

const INITIAL_BATCH = 8;
const LOAD_STEP = 4;

const CATEGORY_TABS = [
  { id: 'all', label: 'Shop tyres & tools', sinhala: 'සියලුම භාණ්ඩ' },
  ...categoriesData.map(c => ({
    id: c.id,
    label: c.name,
    sinhala: c.sinhalaName || c.name
  }))
];

export default function HomeExploreProducts() {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [visibleCount, setVisibleCount] = useState<number>(INITIAL_BATCH);
  const [addedItemIds, setAddedItemIds] = useState<Record<string, boolean>>({});

  const allProducts = (productsData as unknown) as Product[];

  // Filter products by selected category
  const filteredProducts = useMemo(() => {
    if (activeCategory === 'all') return allProducts;
    return allProducts.filter(p => p.category === activeCategory);
  }, [activeCategory, allProducts]);

  const displayedProducts = useMemo(() => {
    return filteredProducts.slice(0, visibleCount);
  }, [filteredProducts, visibleCount]);

  const hasMore = visibleCount < filteredProducts.length;
  const remainingCount = Math.max(0, filteredProducts.length - visibleCount);
  const progressPercent = Math.min(100, Math.round((displayedProducts.length / (filteredProducts.length || 1)) * 100));

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allProducts.length };
    allProducts.forEach(p => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [allProducts]);

  const handleCategoryChange = (catId: string) => {
    setActiveCategory(catId);
    setVisibleCount(INITIAL_BATCH);
  };

  const shopCatalogUrl = activeCategory !== 'all'
    ? `/shop?category=${encodeURIComponent(activeCategory)}#catalog-products`
    : '/shop#catalog-products';

  const handleQuickAddToCart = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();

    addToCart({
      id: product.id,
      slug: product.slug,
      title: product.title,
      price: product.price,
      image: product.featuredImage,
      brand: product.brand
    });

    setAddedItemIds(prev => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedItemIds(prev => ({ ...prev, [product.id]: false }));
    }, 2000);
  };

  return (
    <section id="explore-feed-section" className="py-12 border-t border-slate-200/80 reveal">

      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-200/80 text-brand-600 text-[11px] font-bold uppercase tracking-wider mb-2.5">
              <Layers className="w-3.5 h-3.5 text-brand-500" />
              <span>All Store Gear • සම්පූර්ණ එකතුව</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-display tracking-tight">
              Explore Tyres & Garage Equipment
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-sinhala mt-1">
              දිවයින පුරා COD සහ Genuine Company Warranty සහිත අපගේ සියලුම ටයර් සහ Garage Equipment එකම තැනින්
            </p>
          </div>

          {/* Live Counter Badge */}
          <div className="flex items-center gap-3">
            <div className="px-3.5 py-1.5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-2 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-slate-500">Showing</span>
              <span className="font-bold text-slate-900">{displayedProducts.length}</span>
              <span className="text-slate-400">/</span>
              <span className="font-bold text-brand-600">{filteredProducts.length}</span>
              <span className="text-slate-500">Items</span>
            </div>
          </div>
        </div>

        {/* Category Filter Tabs with smooth edge-to-edge mobile swipe */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 sm:mb-8 no-scrollbar scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0">
          {CATEGORY_TABS.map((tab) => {
            const isActive = activeCategory === tab.id;
            const count = categoryCounts[tab.id] ?? 0;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleCategoryChange(tab.id)}
                className={`shrink-0 flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs font-bold transition-all duration-200 cursor-pointer ${isActive
                      ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-md shadow-brand-500/25 scale-[1.02]'
                      : 'bg-white text-slate-700 hover:text-brand-600 hover:bg-brand-50/50 border border-slate-200/80'
                  }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${isActive ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Products Grid: 1 column on mobile, responsive multi-column on desktop */}
        <div className="max-w-[1440px] mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5 lg:gap-6">
          {displayedProducts.map((product, idx) => {
            const kokoCount = product.kokoInstallmentCount || product.installmentCount || 3;
            const kokoMonthly = product.kokoInstallmentAmount || product.installmentAmount || Math.round(product.price / kokoCount);
            const payzyCount = product.payzyInstallmentCount || 4;
            const payzyMonthly = product.payzyInstallmentAmount || Math.round(product.price / payzyCount);
            const isAdded = !!addedItemIds[product.id];
            const savings = product.originalPrice ? product.originalPrice - product.price : null;

            return (
              <div
                key={product.id}
                className="product-card tyrelink-product-card flex flex-col justify-between p-4 sm:p-4.5 rounded-xl border hover:border-brand-500 transition-all duration-300 hover:-translate-y-1 text-left group relative overflow-hidden"
              >
                <div>
                  {/* Product Thumbnail Frame with Frosted Glass Canvas */}
                  <a
                    href={`/product/${product.slug}`}
                    className="product-image-stage block relative aspect-[4/3] sm:aspect-square max-h-[250px] sm:max-h-none w-full rounded-lg overflow-hidden border border-slate-200/80 mb-3 flex items-center justify-center p-3 cursor-pointer"
                  >
                    <img
                      src={product.featuredImage}
                      alt={product.title}
                      loading="lazy"
                      className="w-full h-full object-contain group-hover:scale-106 transition-transform duration-500 ease-out"
                    />

                    {/* Top Left Discount Badges */}
                    <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10 pointer-events-none">
                      {product.isFlashDeal && product.flashDealDiscount && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-red-600 to-rose-500 text-white shadow-sm">
                          <Flame className="w-2.5 h-2.5 fill-current" />
                          -{product.flashDealDiscount}% OFF
                        </span>
                      )}
                      {savings && savings > 0 && !product.isFlashDeal && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-white shadow-sm">
                          Save Rs. {savings.toLocaleString('en-US')}
                        </span>
                      )}
                    </div>

                    {/* Stock pill */}
                    {typeof product.stockCount === 'number' && product.stockCount > 0 && product.stockCount <= 5 && (
                      <div className="absolute bottom-2 left-2 z-10 pointer-events-none">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-slate-900/80 text-amber-300 backdrop-blur-sm">
                          Only {product.stockCount} left
                        </span>
                      </div>
                    )}
                  </a>

                  {/* Brand & In-Stock Micro-Strip */}
                  <div className="flex items-center justify-between text-[11px] mb-1.5">
                    <span className="text-brand-600 uppercase tracking-widest font-mono text-[10px] font-extrabold bg-brand-50/80 px-2 py-0.5 rounded-md border border-brand-100/60">{product.brand}</span>
                    <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      In Stock
                    </span>
                  </div>

                  {/* Title & Sinhala Title */}
                  <div className="space-y-0.5 sm:space-y-1">
                    <a
                      href={`/product/${product.slug}`}
                      className="block text-sm font-bold text-slate-900 line-clamp-2 hover:text-brand-600 transition-colors leading-snug font-sans"
                    >
                      {product.title}
                    </a>
                    {product.sinhalaTitle && (
                      <p className="text-xs sm:text-[11px] text-slate-400 font-sinhala line-clamp-1">
                        {product.sinhalaTitle}
                      </p>
                    )}
                  </div>
                </div>

                {/* Price & Full-Width Cart Action */}
                <div className="mt-3.5 pt-3 sm:mt-3.5 sm:pt-3 border-t border-slate-100 space-y-2.5">
                  <div className="space-y-1">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-base sm:text-lg font-black text-slate-900 font-display tracking-tight leading-none">
                        Rs. {product.price.toLocaleString('en-US')}
                      </span>
                      {product.originalPrice && (
                        <span className="text-xs sm:text-[11px] text-slate-400 line-through font-mono">
                          Rs. {product.originalPrice.toLocaleString('en-US')}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium flex-wrap">
                      <span>or 3× <b className="text-slate-800 font-mono font-bold">Rs. {kokoMonthly.toLocaleString('en-US')}</b></span>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <a
                          href="https://paykoko.com/"
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-0.5 hover:opacity-80 transition-opacity"
                          title="Pay with Koko (opens paykoko.com)"
                        >
                          <img src="/images/payments/koko-logo.png" alt="Koko" className="h-3 object-contain" />
                          <span className="w-3 h-3 rounded-full bg-slate-800 text-white inline-flex items-center justify-center text-[8px] font-serif font-bold">i</span>
                        </a>
                        <span className="text-slate-300">/</span>
                        <a
                          href="https://payzy.lk/"
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-0.5 hover:opacity-80 transition-opacity"
                          title="Pay with PayZy (opens payzy.lk)"
                        >
                          <img src="/images/payments/payzy-logo.png" alt="PayZy" className="h-2.5 object-contain" />
                          <span className="w-3 h-3 rounded-full bg-slate-800 text-white inline-flex items-center justify-center text-[8px] font-serif font-bold">i</span>
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Touch-Friendly Full-Width Add to Cart Button */}
                  <button
                    type="button"
                    onClick={(e) => handleQuickAddToCart(e, product)}
                    aria-label={`Add ${product.title} to cart`}
                    className={`w-full py-2.5 sm:py-2.5 px-4 rounded-xl sm:rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${isAdded
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-brand-50 hover:bg-brand-500 text-brand-600 hover:text-white border border-brand-200/60 hover:border-transparent active:scale-95 shadow-2xs'
                      }`}
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Added!</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4" />
                        <span>Add to Cart</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Editorial Storefront Discovery Portal Banner */}
        {/* Clean Bold Hero CTA Button */}
        <div className="mt-14 mb-6 flex flex-col items-center justify-center text-center">
          {hasMore ? (
            <a
              href={shopCatalogUrl}
              className="w-full max-w-md sm:max-w-lg md:max-w-xl inline-flex items-center justify-between gap-4 px-6 sm:px-10 py-5 sm:py-6 rounded-2xl sm:rounded-xl bg-gradient-to-r from-brand-600 via-brand-500 to-red-500 hover:from-brand-500 hover:to-red-600 text-white font-black shadow-[0_20px_50px_-10px_rgba(237,28,36,0.35),0_8px_20px_rgba(0,0,0,0.08)] hover:shadow-[0_25px_60px_-10px_rgba(237,28,36,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 group cursor-pointer border-t border-white/30 border-b border-black/10"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <span className="text-lg sm:text-2xl font-black tracking-tight text-white font-sinhala leading-normal">
                  සියලුම භාණ්ඩ බලන්න
                </span>
                <span className="inline-flex items-center justify-center px-3 py-1 rounded-xl bg-white/25 text-white text-xs sm:text-sm font-mono font-black tracking-wide shadow-sm">
                  +{remainingCount}
                </span>
              </div>

              <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-xl sm:rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 group-hover:translate-x-1.5 group-hover:bg-white/30 transition-all duration-300 shadow-inner">
                <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 stroke-[3] text-white" />
              </div>
            </a>
          ) : (
            /* Finished Shop tyres & tools in Category */
            <div className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl bg-white/80 backdrop-blur-md border border-white/90 shadow-sm text-slate-600 text-xs sm:text-sm font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>ඔබ මෙම කාණ්ඩයේ සියලුම භාණ්ඩ බලා ඇත</span>
              <a
                href="/shop#catalog-products"
                className="text-brand-600 font-bold hover:underline ml-1 inline-flex items-center gap-1"
              >
                Shop එකට යන්න <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>

    </section>
  );
}
