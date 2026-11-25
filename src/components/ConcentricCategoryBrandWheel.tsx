import React, { useState, useEffect, useRef } from 'react';
import { Check, RotateCcw, ArrowRight } from 'lucide-react';
import categoriesData from '../data/categories.json';

const CATEGORY_PHOTOS: Record<string, string> = {
  'car-tyres': '/images/legacy/u-h-wheel.webp',
  'suv-4x4': '/images/legacy/tyrebass.webp',
  'motorcycle': '/images/legacy/yes-tube-sri-lanka.webp',
  'commercial': '/images/legacy/jcb-tyre.webp',
  'wheels': '/images/legacy/valves-sri-lanka.webp',
  'garage-tools': '/images/legacy/wrenches-sri-lanka.webp',
  'garage-equipment': '/images/legacy/nitrogen-machine.webp',
};

const BRANDS_9 = [
  { id: 'CEAT', name: 'CEAT', img: '/images/legacy/ceat.webp' },
  { id: 'Michelin', name: 'MICHELIN', img: '/images/legacy/michelin.webp' },
  { id: 'Dunlop', name: 'DUNLOP', img: '' },
  { id: 'Bridgestone', name: 'BRIDGESTONE', img: '' },
  { id: 'Hankook', name: 'HANKOOK', img: '' },
  { id: 'DSI', name: 'DSI', img: '' },
  { id: 'Yokohama', name: 'YOKOHAMA', img: '/images/legacy/yokohama-tyres.jpg' },
  { id: 'MRF', name: 'MRF', img: '/images/legacy/mrf-1.png' },
  { id: 'Tyrelink Pro', name: 'TYRELINK', img: '/branding/tyrelink-logo.png' },
];

export default function ConcentricCategoryBrandWheel() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);

  useEffect(() => {
    let ticking = false;
    const updateScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const el = wrapperRef.current;
        if (el && window.innerWidth >= 1024) {
          const rect = el.getBoundingClientRect();
          const totalTravel = Math.max(1, el.offsetHeight - window.innerHeight);
          // Finish forming the wheel at 55% of the sticky runway, then hold it steady for selection!
          const raw = -rect.top / (totalTravel * 0.55);
          const clamped = Math.min(1, Math.max(0, raw));
          setProgress(clamped);
        }
        ticking = false;
      });
    };

    window.addEventListener('scroll', updateScroll, { passive: true });
    window.addEventListener('resize', updateScroll, { passive: true });
    updateScroll();
    return () => {
      window.removeEventListener('scroll', updateScroll);
      window.removeEventListener('resize', updateScroll);
    };
  }, []);

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const toggleBrand = (id: string) => {
    setSelectedBrands((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]
    );
  };

  const handleClear = () => {
    setSelectedCategories([]);
    setSelectedBrands([]);
  };

  const handleGo = () => {
    const params = new URLSearchParams();
    if (selectedCategories.length > 0) {
      params.set('category', selectedCategories[0]);
    }
    if (selectedBrands.length > 0) {
      params.set('brand', selectedBrands.join(','));
    }
    const qs = params.toString();
    window.location.href = qs ? `/shop?${qs}#catalog-products` : '/shop#catalog-products';
  };

  const hasSelection = selectedCategories.length > 0 || selectedBrands.length > 0;

  // Smooth ease-in-out curve for the morph from horizontal row -> outer circle
  const ease =
    progress < 0.5
      ? 2 * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 2) / 2;

  // Inner ring (9 Brands) & Center Hub appear smoothly in the second half of the scroll
  const innerProgress = Math.min(1, Math.max(0, (progress - 0.3) / 0.65));

  return (
    <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8">
      {/* Desktop Scroll-Driven Morphing Stage: Horizontal Row -> Concentric Wheel (Pinned Hold) */}
      <div ref={wrapperRef} className="hidden lg:block relative h-[210vh] min-h-[1500px]">
        <div className="sticky top-[calc(var(--header-height,84px)+8px)] h-[calc(100vh-96px)] min-h-[760px] flex flex-col items-center justify-center overflow-hidden">
          {/* Dynamic Instruction Banner */}
          <div
            className="text-center max-w-2xl mx-auto mb-2 transition-opacity duration-300"
            style={{ opacity: 0.65 + 0.35 * innerProgress }}
          >
            <p className="text-xs sm:text-sm font-semibold text-slate-600">
              {progress < 0.45 ? (
                <span>
                  Scroll down to form the <span className="text-[#e31b23] font-bold">Category &amp; Brand Wheel</span>, or click any category directly.
                </span>
              ) : (
                <span>
                  Select one or more <span className="text-slate-900 font-bold">Categories</span> (outer ring) and <span className="text-slate-900 font-bold">Brands</span> (inner ring), then click <span className="text-[#e31b23] font-black">Go →</span>
                </span>
              )}
            </p>
          </div>

          {/* Morphing Coordinate Stage */}
          <div className="relative w-full max-w-[1280px] h-[760px] flex items-center justify-center">
            {/* Concentric Ring Guides (Fade in as wheel forms) */}
            <div
              className="absolute w-[680px] h-[680px] rounded-full border-2 border-dashed border-slate-300/80 pointer-events-none transition-transform duration-150"
              style={{
                opacity: innerProgress,
                transform: `scale(${0.75 + 0.25 * innerProgress})`,
              }}
            />
            <div
              className="absolute w-[400px] h-[400px] rounded-full border-2 border-dashed border-slate-300/80 pointer-events-none transition-transform duration-150"
              style={{
                opacity: innerProgress,
                transform: `scale(${0.75 + 0.25 * innerProgress})`,
              }}
            />

            {/* THE 7 CATEGORY CARDS: Morph smoothly from horizontal row to outer circle */}
            {categoriesData.map((cat, idx) => {
              // Start: Horizontal row across screen
              const startX = (idx - 3) * 182;
              const startY = -40;

              // End: Outer ring of the circle
              const angle = (idx / categoriesData.length) * 2 * Math.PI - Math.PI / 2;
              const radius = 325;
              const endX = Math.cos(angle) * radius;
              const endY = Math.sin(angle) * radius;

              const x = startX + (endX - startX) * ease;
              const y = startY + (endY - startY) * ease;
              const rot = Math.sin(ease * Math.PI) * (idx % 2 === 0 ? 8 : -8);
              const isSelected = selectedCategories.includes(cat.id);

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleCategory(cat.id)}
                  style={{
                    transform: `translate(${x}px, ${y}px) rotate(${rot}deg)`,
                  }}
                  className={`absolute z-20 w-[162px] p-3.5 rounded-2xl border-2 transition-colors duration-200 flex flex-col items-center text-center cursor-pointer shadow-md hover:shadow-xl ${
                    isSelected
                      ? 'bg-red-50 border-[#e31b23] ring-4 ring-[#e31b23]/20'
                      : 'bg-white border-slate-200 hover:border-slate-400'
                  }`}
                >
                  {isSelected && (
                    <span className="absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full bg-[#e31b23] text-white flex items-center justify-center shadow-md">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                  )}
                  <img
                    src={CATEGORY_PHOTOS[cat.id] || '/images/legacy/u-h-wheel.webp'}
                    alt={cat.name}
                    className="w-24 h-16 object-contain mb-1.5"
                    loading="lazy"
                  />
                  <span className="text-xs font-extrabold text-slate-900 leading-tight line-clamp-1">
                    {cat.name}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium mt-0.5">
                    {cat.itemCount || '10+'} Items
                  </span>
                </button>
              );
            })}

            {/* INNER RING: 9 Brands (Emerge as categories form the outer circle) */}
            {BRANDS_9.map((brand, idx) => {
              const angle = (idx / BRANDS_9.length) * 2 * Math.PI - Math.PI / 2;
              const radius = 198;
              const x = Math.cos(angle) * radius * (0.4 + 0.6 * innerProgress);
              const y = Math.sin(angle) * radius * (0.4 + 0.6 * innerProgress);
              const isSelected = selectedBrands.includes(brand.id);

              return (
                <button
                  key={brand.id}
                  type="button"
                  onClick={() => toggleBrand(brand.id)}
                  style={{
                    transform: `translate(${x}px, ${y}px) scale(${0.5 + 0.5 * innerProgress})`,
                    opacity: innerProgress,
                    pointerEvents: innerProgress > 0.35 ? 'auto' : 'none',
                  }}
                  className={`absolute z-20 w-[112px] h-[60px] p-2 rounded-2xl border-2 transition-colors duration-200 flex items-center justify-center cursor-pointer shadow-sm hover:shadow-lg ${
                    isSelected
                      ? 'bg-red-50 border-[#e31b23] ring-4 ring-[#e31b23]/20'
                      : 'bg-white border-slate-200 hover:border-slate-400'
                  }`}
                  title={brand.name}
                >
                  {isSelected && (
                    <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[#e31b23] text-white flex items-center justify-center shadow-md">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}
                  {brand.img ? (
                    <img
                      src={brand.img}
                      alt={brand.name}
                      className="max-w-full max-h-9 object-contain"
                      loading="lazy"
                    />
                  ) : (
                    <span className="text-[11px] font-black text-slate-900 tracking-wider">
                      {brand.name}
                    </span>
                  )}
                </button>
              );
            })}

            {/* CENTER HUB: Clear & Go Buttons (Emerge with Inner Ring) */}
            <div
              style={{
                opacity: innerProgress,
                transform: `scale(${0.65 + 0.35 * innerProgress})`,
                pointerEvents: innerProgress > 0.4 ? 'auto' : 'none',
              }}
              className="relative z-30 w-[210px] h-[210px] rounded-full bg-white border-2 border-slate-200 shadow-[0_18px_45px_rgba(15,23,42,0.12)] flex flex-col items-center justify-center p-5 text-center"
            >
              <span className="text-[10px] font-black uppercase tracking-widest text-[#e31b23] mb-1">
                Quick Filter
              </span>
              <p className="text-xs font-bold text-slate-800 leading-snug mb-3.5">
                {hasSelection
                  ? `${selectedCategories.length} Cat · ${selectedBrands.length} Brand`
                  : 'Pick Categories & Brands'}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={!hasSelection}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Clear</span>
                </button>
                <button
                  type="button"
                  onClick={handleGo}
                  className="px-4 py-1.5 rounded-xl bg-[#e31b23] hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1 shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  <span>Go</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile / Tablet Compact Multi-Select Grid + Clear & Go */}
      <div className="lg:hidden bg-white rounded-2xl border border-slate-200 p-4 space-y-4 shadow-sm mt-4">
        <div>
          <span className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">
            Select Categories
          </span>
          <div className="flex flex-wrap gap-2">
            {categoriesData.map((cat) => {
              const isSelected = selectedCategories.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#e31b23] text-white border-[#e31b23]'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <span className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">
            Select Brands (9)
          </span>
          <div className="flex flex-wrap gap-2">
            {BRANDS_9.map((brand) => {
              const isSelected = selectedBrands.includes(brand.id);
              return (
                <button
                  key={brand.id}
                  type="button"
                  onClick={() => toggleBrand(brand.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#e31b23] text-white border-[#e31b23]'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  {brand.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={handleClear}
            disabled={!hasSelection}
            className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold disabled:opacity-40"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={handleGo}
            className="px-5 py-2 rounded-xl bg-[#e31b23] text-white text-xs font-bold flex items-center gap-1.5"
          >
            <span>Go</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
