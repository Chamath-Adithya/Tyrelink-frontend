import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ArrowRight, PackagePlus, ShieldCheck, Loader2, CheckCircle2 } from 'lucide-react';
import productsData from '../data/products.json';
import ProductCardSkeleton from './ProductCardSkeleton';
import type { Product } from '../types';

interface InfiniteProductFeedProps {
  currentProductId: string;
}

const BATCH_SIZE = 5;

export default function InfiniteProductFeed({ currentProductId }: InfiniteProductFeedProps) {
  // Initialize with non-empty list so SSR and initial client state render immediately
  const [shuffledProducts, setShuffledProducts] = useState<Product[]>(() => {
    return ((productsData as unknown) as Product[]).filter((p) => p.id !== currentProductId);
  });

  const [visibleCount, setVisibleCount] = useState<number>(BATCH_SIZE);
  const [isLoadingBatch, setIsLoadingBatch] = useState<boolean>(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Randomize available products on client mount
  useEffect(() => {
    const list = [...((productsData as unknown) as Product[])].filter((p) => p.id !== currentProductId);
    // Fisher-Yates Fast Shuffle
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    setShuffledProducts(list);
  }, [currentProductId]);

  const visibleProducts = useMemo(() => {
    return shuffledProducts.slice(0, visibleCount);
  }, [shuffledProducts, visibleCount]);

  // Pre-compute BNPL monthly prices once — eliminates N re-computations per render
  const bnplMap = useMemo(() => {
    const map: Record<string, { kokoCount: number; kokoAmount: number; payzyCount: number; payzyAmount: number }> = {};
    shuffledProducts.forEach(p => {
      const kokoCount = p.kokoInstallmentCount || p.installmentCount || 3;
      const kokoAmount = p.kokoInstallmentAmount || p.installmentAmount || Math.round(p.price / kokoCount);
      const payzyCount = p.payzyInstallmentCount || 4;
      const payzyAmount = p.payzyInstallmentAmount || Math.round(p.price / payzyCount);
      map[p.id] = { kokoCount, kokoAmount, payzyCount, payzyAmount };
    });
    return map;
  }, [shuffledProducts]);

  const hasMore = visibleCount < shuffledProducts.length;

  // Optimized IntersectionObserver for smooth infinite loading
  useEffect(() => {
    if (!hasMore || isLoadingBatch || shuffledProducts.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsLoadingBatch(true);
          setTimeout(() => {
            setVisibleCount((prev) => Math.min(prev + BATCH_SIZE, shuffledProducts.length));
            setIsLoadingBatch(false);
          }, 250); // Smooth skeleton shimmer window
        }
      },
      { rootMargin: '250px' }
    );

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoadingBatch, shuffledProducts.length]);

  const handleManualLoad = () => {
    setIsLoadingBatch(true);
    setTimeout(() => {
      setVisibleCount((prev) => Math.min(prev + BATCH_SIZE, shuffledProducts.length));
      setIsLoadingBatch(false);
    }, 250);
  };

  return (
    <section className="pt-16 sm:pt-20 border-t border-slate-200/70 space-y-8 text-left">
      
      {/* Header Stage */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-brand-600 bg-brand-50 px-2.5 py-0.5 rounded-md">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
              Dynamic Hardware Feed
            </span>
            <span className="text-xs text-slate-400 font-mono">
              ({visibleProducts.length} of {shuffledProducts.length} Items)
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-display tracking-tight">
            Explore More High-Performance Gear
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Scroll down to discover more tyres, wheel accessories and garage equipment.
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>Islandwide Delivery & Genuine Warranty</span>
        </div>
      </div>

      {/* Grid of Dynamic Products & Skeletons (Centered when < 5 or uneven rows) */}
      <div className="flex flex-wrap justify-center items-stretch gap-4 sm:gap-5">
        {visibleProducts.map((product, idx) => {
          const bnpl = bnplMap[product.id] ?? {
            kokoCount: product.kokoInstallmentCount || product.installmentCount || 3,
            kokoAmount: product.kokoInstallmentAmount || product.installmentAmount || Math.round(product.price / 3),
            payzyCount: product.payzyInstallmentCount || 4,
            payzyAmount: product.payzyInstallmentAmount || Math.round(product.price / 4),
          };
          const tyreSize = product.specs?.['Tyre Size'] || product.specs?.['Size'] || product.specs?.['Rim Size'] || '';
          const savings = product.originalPrice ? product.originalPrice - product.price : null;
          return (
            <div
              key={product.id}
              onClick={(e) => {
                const target = e.target as HTMLElement;
                if (target.closest('a, button')) return;
                window.location.href = `/product/${product.slug}`;
              }}
              style={{ animationDelay: `${(idx % 5) * 60}ms` }}
              className="product-card tyrelink-product-card bg-white w-full sm:w-[calc(50%-10px)] md:w-[calc(33.333%-13.33px)] lg:w-[calc(20%-16px)] max-w-[320px] lg:max-w-none h-[410px] flex flex-col justify-between p-4 group relative text-left rounded-xl border border-slate-200 hover:border-brand-500 transition-all duration-300 hover:-translate-y-1 overflow-hidden animate-[fadeIn_0.45s_ease_both] cursor-pointer shrink-0 select-none"
            >
              <div className="flex-1 flex flex-col min-h-0">
                {/* Uniform Fixed-Height Image Stage */}
                <a
                  href={`/product/${product.slug}`}
                  className="block relative h-[190px] w-full rounded-lg overflow-hidden border border-slate-200/80 mb-2.5 flex items-center justify-center p-3 bg-slate-50/50 shrink-0"
                >
                  <img
                    src={product.featuredImage}
                    alt={product.title}
                    loading="lazy"
                    className="w-full h-full object-contain group-hover:scale-106 transition-transform duration-500 ease-out"
                  />
                  
                  {/* Badges */}
                  <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10 pointer-events-none">
                    {product.isFlashDeal && product.flashDealDiscount && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-red-600 to-rose-500 text-white shadow-md">
                        -{product.flashDealDiscount}% OFF
                      </span>
                    )}
                    {savings && savings > 0 && !product.isFlashDeal && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-white shadow-sm">
                        Save Rs. {savings.toLocaleString('en-US')}
                      </span>
                    )}
                  </div>
                </a>

                {/* Brand & Spec Strip (Standardized 24px Height) */}
                <div className="flex items-center justify-between text-[11px] h-6 mb-1.5 shrink-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-brand-600 uppercase tracking-widest font-mono text-[10px] font-extrabold bg-brand-50/80 px-2 py-0.5 rounded-md border border-brand-100/60 shrink-0">{product.brand}</span>
                    {tyreSize ? (
                      <span className="text-[10px] font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 truncate">{tyreSize}</span>
                    ) : (
                      <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/80 truncate">GENUINE</span>
                    )}
                  </div>
                </div>

                {/* Product Title & Sinhala Subtitle (Standardized 52px Slot) */}
                <div className="h-[52px] flex flex-col justify-start overflow-hidden text-left">
                  <a href={`/product/${product.slug}`} className="block">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-2 group-hover:text-brand-600 transition-colors leading-snug font-sans">
                      {product.title}
                    </h3>
                  </a>
                  <p className="text-[11px] text-slate-400 font-sinhala truncate mt-0.5">
                    {product.sinhalaTitle || 'සත්‍ය සමාගම් වගකීම'}
                  </p>
                </div>
              </div>

              {/* Price & Action Footer (Standardized 64px Height) */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 h-[64px] shrink-0">
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-1.5 flex-nowrap">
                    <span className="text-base sm:text-lg font-black text-slate-900 font-display tracking-tight leading-none truncate">
                      Rs. {product.price.toLocaleString('en-US')}
                    </span>
                    {product.originalPrice ? (
                      <span className="text-[11px] text-slate-400 line-through font-mono shrink-0">
                        Rs. {product.originalPrice.toLocaleString('en-US')}
                      </span>
                    ) : (
                      <span className="text-[9px] text-emerald-600 font-bold uppercase tracking-wider font-mono shrink-0">
                        In Stock
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-1 font-medium truncate">
                    <span className="truncate">or {bnpl.kokoCount}× <b className="text-slate-800 font-mono font-bold">Rs. {bnpl.kokoAmount.toLocaleString('en-US')}</b></span>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <a
                        href="https://paykoko.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-0.5 hover:opacity-80 transition-opacity"
                        title="Pay with Koko (opens paykoko.com)"
                      >
                        <img src="/images/payments/koko-logo.png" alt="Koko" className="h-2.5 sm:h-3 object-contain" />
                        <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-slate-800 text-white inline-flex items-center justify-center text-[7px] sm:text-[8px] font-serif font-bold">i</span>
                      </a>
                      <span className="text-slate-300 text-[10px]">/</span>
                      <a
                        href="https://payzy.lk/"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-0.5 hover:opacity-80 transition-opacity"
                        title="Pay with PayZy (opens payzy.lk)"
                      >
                        <img src="/images/payments/payzy-logo.png" alt="PayZy" className="h-2 sm:h-2.5 object-contain" />
                        <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-slate-800 text-white inline-flex items-center justify-center text-[7px] sm:text-[8px] font-serif font-bold">i</span>
                      </a>
                    </div>
                  </div>
                </div>

                <div className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-xl bg-white/80 hover:bg-brand-500 text-slate-600 hover:text-white backdrop-blur-md border border-white/70 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_8px_20px_rgba(227,27,35,0.35)] shrink-0">
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </div>
          );
        })}

        {/* Shimmering Skeletons during batch loading */}
        {isLoadingBatch && (
          <>
            <div className="w-full sm:w-[calc(50%-10px)] md:w-[calc(33.333%-13.33px)] lg:w-[calc(20%-16px)] max-w-[320px] lg:max-w-none shrink-0"><ProductCardSkeleton /></div>
            <div className="w-full sm:w-[calc(50%-10px)] md:w-[calc(33.333%-13.33px)] lg:w-[calc(20%-16px)] max-w-[320px] lg:max-w-none shrink-0"><ProductCardSkeleton /></div>
            <div className="w-full sm:w-[calc(50%-10px)] md:w-[calc(33.333%-13.33px)] lg:w-[calc(20%-16px)] max-w-[320px] lg:max-w-none shrink-0"><ProductCardSkeleton /></div>
            <div className="w-full sm:w-[calc(50%-10px)] md:w-[calc(33.333%-13.33px)] lg:w-[calc(20%-16px)] max-w-[320px] lg:max-w-none shrink-0"><ProductCardSkeleton /></div>
            <div className="w-full sm:w-[calc(50%-10px)] md:w-[calc(33.333%-13.33px)] lg:w-[calc(20%-16px)] max-w-[320px] lg:max-w-none shrink-0"><ProductCardSkeleton /></div>
          </>
        )}
      </div>

      {/* Infinite Scroll Trigger Sentinel */}
      <div ref={sentinelRef} className="h-10 w-full pointer-events-none" />

      {/* Feed Bottom Controls / Completed Stage */}
      {hasMore ? (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={handleManualLoad}
            disabled={isLoadingBatch}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold shadow-soft hover:scale-105 active:scale-95 transition-all disabled:opacity-60 cursor-pointer"
          >
            {isLoadingBatch ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-brand-400" />
                <span>Loading Next Gear...</span>
              </>
            ) : (
              <>
                <PackagePlus className="w-4 h-4 text-brand-400" />
                <span>Load More Recommended Gear ({shuffledProducts.length - visibleProducts.length} Remaining)</span>
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="p-6 sm:p-7 rounded-xl bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-200/80 text-center space-y-1.5 max-w-xl mx-auto">
          <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-1">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <p className="font-bold text-slate-800 text-xs sm:text-sm">You've explored all recommended hardware in this session.</p>
          <p className="text-[11px] text-slate-400">Looking for a specific model? Search in our main catalog or contact Horana Tech Desk.</p>
        </div>
      )}

    </section>
  );
}
