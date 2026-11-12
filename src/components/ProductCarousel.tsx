import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Zap, ArrowRight, Clock, AlertTriangle, Plus, Edit3 } from 'lucide-react';
import type { Product } from '../types';
import { getCampaignsData, isFlashSaleLive, isEditModeActive, subscribeAdmin, ADMIN_EVENT_CAMPAIGNS } from '../utils/adminStore';

interface ProductCarouselProps {
  title: string;
  sinhalaTitle?: string;
  badge?: string;
  products: Product[];
  countdownTimer?: string;
}

export default function ProductCarousel({
  title,
  sinhalaTitle,
  badge = 'FLASH DEALS',
  products,
}: ProductCarouselProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isRedGlow, setIsRedGlow] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLive, setIsLive] = useState(true);
  const [timeLeft, setTimeLeft] = useState({ h: 4, m: 35, s: 22 });

  // Calculate live countdown based on campaign schedule
  const syncCampaignStatus = () => {
    const adminActive = isEditModeActive();
    setIsAdmin(adminActive);

    if (badge === 'FLASH DEALS') {
      const cfg = getCampaignsData().flashSale;
      if (!cfg || !cfg.isActive) {
        setIsLive(false);
        const wrapper = document.getElementById('flash-deals-sticky-wrapper');
        if (wrapper && !adminActive) wrapper.style.display = 'none';
        return;
      }

      const now = Date.now();
      const start = new Date(cfg.startTime).getTime();
      const end = new Date(cfg.endTime).getTime();

      if (now < start || now > end) {
        setIsLive(false);
        const wrapper = document.getElementById('flash-deals-sticky-wrapper');
        if (wrapper && !adminActive) wrapper.style.display = 'none';
        return;
      }

      // Flash sale is actively live
      setIsLive(true);
      const wrapper = document.getElementById('flash-deals-sticky-wrapper');
      if (wrapper) wrapper.style.display = '';

      const diff = Math.max(0, end - now);
      const totalSecs = Math.floor(diff / 1000);
      const h = Math.floor(totalSecs / 3600);
      const m = Math.floor((totalSecs % 3600) / 60);
      const s = totalSecs % 60;
      setTimeLeft({ h, m, s });
    }
  };

  useEffect(() => {
    syncCampaignStatus();
    const interval = setInterval(syncCampaignStatus, 1000);

    const onCampaignChange = () => syncCampaignStatus();
    window.addEventListener(ADMIN_EVENT_CAMPAIGNS, onCampaignChange);

    const unsubAdmin = subscribeAdmin((s) => {
      setIsAdmin(Boolean(s?.editMode));
    });

    return () => {
      clearInterval(interval);
      window.removeEventListener(ADMIN_EVENT_CAMPAIGNS, onCampaignChange);
      unsubAdmin();
    };
  }, [badge]);

  // Trigger smooth dark-to-orange crossfade only after scrolling well into the section
  useEffect(() => {
    let timerId: ReturnType<typeof setTimeout> | null = null;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Smooth ignition into vivid racing red glow as user scrolls into Flash Deals
          timerId = setTimeout(() => {
            setIsRedGlow(true);
          }, 150);
        } else {
          if (timerId) clearTimeout(timerId);
          setIsRedGlow(false);
        }
      },
      {
        threshold: 0.05, // Low threshold ensures it triggers seamlessly on both mobile vertical layout and desktop
        rootMargin: '0px 0px -40px 0px',
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      observer.disconnect();
      if (timerId) clearTimeout(timerId);
    };
  }, []);

  const updateScrollState = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 8);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 8);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const pad = (n: number) => String(n).padStart(2, '0');

  // If Flash Deals is ended/inactive and user is NOT an admin, completely hide section
  if (badge === 'FLASH DEALS' && !isLive && !isAdmin) {
    return null;
  }

  return (
    <section
      ref={sectionRef}
      className="relative w-full overflow-hidden rounded-none border-none bg-gradient-to-r from-red-700 via-brand-500 to-rose-600 py-10 sm:py-14 my-0 transition-colors duration-1000"
    >
      {/* Admin Notice if viewing inactive campaign */}
      {badge === 'FLASH DEALS' && !isLive && isAdmin && (
        <div className="relative z-20 max-w-[1680px] mx-auto px-4 mb-4">
            <div className="p-3 rounded-2xl bg-slate-950/90 border border-brand-500/50 text-brand-300 flex items-center justify-between text-xs">
              <span className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-brand-400" />
                <strong>Flash Sale Inactive / Ended:</strong> Hidden from regular visitors. Visible only because you are in Admin Edit Mode.
              </span>
              <span className="font-mono text-[11px] text-slate-400">Schedule in top bar</span>
            </div>
          </div>
      )}
          {/* Dynamic ambient lighting spheres that scale and ignite into blazing warmth */}
          <div
            className="absolute -top-32 right-1/4 w-[550px] h-[550px] rounded-full blur-3xl pointer-events-none"
            style={{
              transform: isRedGlow ? 'scale(1.25)' : 'scale(0.95)',
              opacity: isRedGlow ? 0.8 : 0.3,
              backgroundColor: 'rgba(237, 28, 36, 0.40)',
              transition: 'transform 1800ms cubic-bezier(0.16, 1, 0.3, 1), opacity 1800ms cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          />
          <div
            className="absolute -bottom-32 left-1/4 w-[550px] h-[550px] rounded-full blur-3xl pointer-events-none"
            style={{
              transform: isRedGlow ? 'scale(1.25)' : 'scale(0.95)',
              opacity: isRedGlow ? 0.75 : 0.2,
              backgroundColor: 'rgba(220, 38, 38, 0.35)',
              transition: 'transform 1800ms cubic-bezier(0.16, 1, 0.3, 1), opacity 1800ms cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          />
          <div className="absolute inset-0 tech-dot-grid-dark opacity-15 pointer-events-none" />

          {/* Seamless Zero-Line Dark Obsidian Crossfade Layer (luxuriously dissolves without any lines) */}
          <div
            className="absolute inset-0 z-0 pointer-events-none overflow-hidden"
            style={{
              opacity: isRedGlow ? 0 : 1,
              transition: 'opacity 1600ms cubic-bezier(0.16, 1, 0.3, 1)',
              willChange: 'opacity',
            }}
          >
            <div className="absolute inset-0 bg-[#090D16]">
              <div className="absolute inset-0 tech-dot-grid-dark opacity-25" />
              <div className="absolute -top-40 right-1/4 w-[500px] h-[500px] rounded-full blur-3xl bg-brand-500/15 pointer-events-none" />
              <div className="absolute -bottom-40 left-1/4 w-[500px] h-[500px] rounded-full blur-3xl bg-red-600/10 pointer-events-none" />
            </div>
          </div>

          {/* Header inside Safe Layout Container */}
          <div className="relative z-10 max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4 text-left">
            <div className="space-y-2">
              {/* Flash badge with live countdown - Obsidian Dark Glass on Orange */}
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-slate-950 text-[11px] font-black uppercase tracking-wider text-white border border-white/20 shadow-[0_8px_25px_rgba(0,0,0,0.35)] backdrop-blur-md">
                <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-400 animate-pulse shrink-0" />
                <span className="tracking-widest">{badge}</span>
                <span className="text-white/30 font-light">|</span>
                <span className="font-mono text-amber-300 font-black tabular-nums tracking-wider text-xs">
                  {pad(timeLeft.h)}:{pad(timeLeft.m)}:{pad(timeLeft.s)}
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white font-display tracking-tight leading-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.25)]">
                {title}
              </h2>
              {sinhalaTitle && (
                <p className="text-xs sm:text-sm text-white/90 font-sinhala font-medium drop-shadow-[0_1px_4px_rgba(0,0,0,0.2)]">
                  {sinhalaTitle}
                </p>
              )}
            </div>

            {/* Header Action Buttons (Admin in-section buttons + View All Deals) */}
            <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
              {/* Admin In-Section Actions (Shown only when in Edit Mode) */}
              {badge === 'FLASH DEALS' && (
                <div className={`items-center gap-1.5 sm:gap-2 ${isAdmin ? 'inline-flex' : 'hidden'}`}>
                  <button
                    type="button"
                    onClick={() => window.dispatchEvent(new CustomEvent('tyrelink:open-flash-modal'))}
                    title="Select Existing Products for Flash Deals"
                    className="inline-flex items-center gap-1 px-3 py-1.5 sm:px-3.5 sm:py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-[11px] sm:text-xs font-black transition-all shadow-md hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>+ Pick Products</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => window.dispatchEvent(new CustomEvent('tyrelink:open-flash-modal'))}
                    title="Adjust Flash Sale Start/End Time & Schedule"
                    className="inline-flex items-center gap-1 px-3 py-1.5 sm:px-3.5 sm:py-2.5 rounded-xl bg-slate-950 hover:bg-black border border-brand-500/60 text-brand-300 text-[11px] sm:text-xs font-bold transition-all shadow-md hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-md"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-brand-400" />
                    <span>Edit Schedule & Time</span>
                  </button>
                </div>
              )}

              {/* View all Deals Link - Obsidian Dark Pill Button */}
              <a
                href="/shop"
                className="inline-flex items-center gap-1.5 sm:gap-2.5 px-3.5 py-1.5 sm:px-5 sm:py-2.5 rounded-xl bg-slate-950 hover:bg-black text-white text-xs font-black transition-all border border-white/20 group shadow-[0_8px_25px_rgba(0,0,0,0.35)] hover:scale-105 active:scale-95 shrink-0 cursor-pointer"
              >
                <span>View All Deals</span>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-brand-400 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </div>

          {/* Carousel Track Stage with Left & Right Floating Arrows (Hidden on mobile for native touch swiping) */}
          <div className="relative z-10 w-full max-w-[1440px] mx-auto group/stage">
            {/* Left Floating Arrow Key (Desktop only) */}
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className={`hidden absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 sm:w-12 sm:h-12 rounded-full items-center justify-center transition-all duration-300 border cursor-pointer backdrop-blur-md ${canScrollLeft
                ? 'bg-slate-950 hover:bg-black text-white border-white/30 shadow-[0_8px_30px_rgba(0,0,0,0.6)] hover:scale-110 active:scale-95 opacity-100'
                : 'bg-slate-950/40 text-white/20 border-white/5 opacity-0 pointer-events-none'
                }`}
              aria-label="Previous Flash Deals"
            >
              <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
            </button>

            {/* Right Floating Arrow Key (Desktop only) */}
            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className={`hidden absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 sm:w-12 sm:h-12 rounded-full items-center justify-center transition-all duration-300 border cursor-pointer backdrop-blur-md ${canScrollRight
                ? 'bg-slate-950 hover:bg-black text-white border-white/30 shadow-[0_8px_30px_rgba(0,0,0,0.6)] hover:scale-110 active:scale-95 opacity-100'
                : 'bg-slate-950/40 text-white/20 border-white/5 opacity-0 pointer-events-none'
                }`}
              aria-label="Next Flash Deals"
            >
              <ChevronRight className="w-5 h-5 stroke-[2.5]" />
            </button>

            {/* Flash Deals Container: 1-column vertical stack on mobile, horizontal carousel on desktop */}
            <div
              ref={scrollRef}
              onScroll={updateScrollState}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 items-stretch gap-4 sm:gap-5 lg:gap-6 overflow-x-visible pb-4 pt-1 px-4 sm:px-6 lg:px-8"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {products.map((product, i) => {
                const kokoCount = product.kokoInstallmentCount || product.installmentCount || 3;
                const kokoMonthly = product.kokoInstallmentAmount || product.installmentAmount || Math.round(product.price / kokoCount);
                const payzyCount = product.payzyInstallmentCount || 4;
                const payzyMonthly = product.payzyInstallmentAmount || Math.round(product.price / payzyCount);
                const savings = product.originalPrice ? product.originalPrice - product.price : null;
                return (
                  <div
                    key={product.id}
                    onClick={(e) => {
                      const target = e.target as HTMLElement;
                      if (target.closest('a, button')) return;
                      window.location.href = `/product/${product.slug}`;
                    }}
                    className="tyrelink-product-card relative overflow-hidden w-full flex flex-col justify-between p-4 sm:p-4.5 group text-left rounded-xl border hover:border-brand-500 transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <div>
                      {/* Full-bleed Glass Image Stage */}
                      <a
                        href={`/product/${product.slug}`}
                        className="product-image-stage block relative aspect-[4/3] sm:aspect-square max-h-[250px] sm:max-h-none w-full rounded-lg overflow-hidden mb-3 border border-slate-200/80 flex items-center justify-center p-3"
                      >
                        <img
                          src={product.featuredImage}
                          alt={product.title}
                          loading="lazy"
                          className="w-full h-full object-contain group-hover:scale-106 transition-transform duration-500 ease-out"
                        />

                        {/* Badges */}
                        {product.flashDealDiscount && (
                          <span className="absolute top-2.5 left-2.5 z-20 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-red-600 to-rose-500 text-white shadow-md">
                            <Zap className="w-2.5 h-2.5 fill-current" />
                            -{product.flashDealDiscount}% OFF
                          </span>
                        )}
                        {savings && savings > 0 && !product.flashDealDiscount && (
                          <span className="absolute top-2.5 left-2.5 z-20 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-white shadow-sm">
                            Save Rs. {savings.toLocaleString('en-US')}
                          </span>
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

                      {/* Product Info */}
                      <div className="space-y-0.5 sm:space-y-1 flex-1">
                        <a href={`/product/${product.slug}`} className="block">
                          <h3 className="text-sm font-bold text-slate-900 line-clamp-2 group-hover:text-brand-600 transition-colors leading-snug">
                            {product.title}
                          </h3>
                        </a>
                        {product.sinhalaTitle && (
                          <p className="text-xs sm:text-[11px] text-slate-400 font-sinhala line-clamp-1">
                            {product.sinhalaTitle}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Price Footer */}
                    <div className="mt-3.5 pt-3 sm:mt-4 sm:pt-3.5 border-t border-slate-100 flex items-end justify-between gap-2">
                      <div className="min-w-0 flex-1">
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
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-1 font-medium flex-wrap">
                          <span>or {kokoCount}× <b className="text-slate-800 font-mono font-bold">Rs. {kokoMonthly.toLocaleString('en-US')}</b></span>
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

                      <div className="w-8.5 h-8.5 sm:w-8.5 sm:h-8.5 rounded-xl sm:rounded-2xl bg-white/80 hover:bg-brand-500 text-slate-600 hover:text-white backdrop-blur-md border border-white/70 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_8px_20px_rgba(227,27,35,0.35)] shrink-0">
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-300" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      );
}
