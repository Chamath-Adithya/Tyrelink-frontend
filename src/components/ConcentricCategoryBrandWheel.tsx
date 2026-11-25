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
  const [marqueeDrift, setMarqueeDrift] = useState(0);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);

  useEffect(() => {
    let animId = 0;
    let startTime = performance.now();
    const tick = (now: number) => {
      const elapsed = (now - startTime) / 1000;
      setMarqueeDrift(Math.sin(elapsed * 0.7) * 45);
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

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
          // Complete morph crisply with the mouse wheel (35% of runway), then hold steady
          const raw = -rect.top / (totalTravel * 0.35);
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

  // Background transitions from light (#fafaf8) to dark workshop (#0b0b0d) as user scrolls into wheel
  const bgDarkness = Math.min(1, Math.max(0, progress * 1.4));

  return (
    <div
      className="w-full transition-colors duration-300"
      style={{
        backgroundColor: `rgb(${Math.round(250 - 239 * bgDarkness)}, ${Math.round(
          250 - 239 * bgDarkness
        )}, ${Math.round(248 - 235 * bgDarkness)})`,
      }}
    >
      {/* Workshop SVG Keyframe Animations */}
      <style>{`
        .ws-fb{transform-box:fill-box;transform-origin:center}
        .ws-sway{transform-box:fill-box;transform-origin:50% 0;animation:ws-sway 3.6s ease-in-out infinite alternate}
        .ws-sway:nth-child(2n){animation-duration:4.4s;animation-delay:-1s}
        .ws-sway:nth-child(3n){animation-duration:3.1s;animation-delay:-2s}
        @keyframes ws-sway{from{transform:rotate(-3.5deg)}to{transform:rotate(3.5deg)}}
        .ws-lamp{animation:ws-lamp 4.5s ease-in-out infinite alternate}
        .ws-lamp-b{animation-duration:5.5s;animation-delay:-2s}
        @keyframes ws-lamp{from{transform:rotate(-7deg)}to{transform:rotate(7deg)}}
        .ws-spin{animation:ws-spin .4s linear infinite}
        .ws-slow{animation:ws-spin 9s linear infinite}
        @keyframes ws-spin{to{transform:rotate(360deg)}}
        .ws-blink{animation:ws-blink 1s steps(1) infinite}
        @keyframes ws-blink{50%{opacity:.2}}
        .ws-drawer{animation:ws-drawer 6s ease-in-out infinite}
        @keyframes ws-drawer{0%,15%{transform:translateX(0)}35%,65%{transform:translateX(24px)}85%,100%{transform:translateX(0)}}
        .ws-needle{transform-origin:1230px 206px;animation:ws-needle 5s ease-in-out infinite alternate}
        @keyframes ws-needle{from{transform:rotate(-45deg)}to{transform:rotate(50deg)}}
        .ws-air{stroke-dasharray:6 10;animation:ws-air .6s linear infinite}
        @keyframes ws-air{to{stroke-dashoffset:-16}}
        .ws-spark{animation:ws-spark 1.1s linear infinite}
        .ws-spark:nth-child(2){animation-delay:.35s}
        .ws-spark:nth-child(3){animation-delay:.7s}
        @keyframes ws-spark{0%{opacity:0;transform:translate(0,0)}15%{opacity:1}100%{opacity:0;transform:translate(14px,-16px)}}
        .ws-dust{animation:ws-dust 5s ease-in-out infinite alternate}
        @keyframes ws-dust{to{transform:translateY(-10px);opacity:.15}}
      `}</style>
      <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Desktop Scroll-Driven Morphing Stage: Horizontal Row -> Concentric Wheel (Pinned Hold) */}
        <div ref={wrapperRef} className="hidden lg:block relative h-[200vh] min-h-[1450px]">
          <div className="sticky top-[calc(var(--header-height,96px)+8px)] h-[calc(100vh-104px)] min-h-[780px] flex flex-col items-center justify-center pt-4 overflow-visible">
            {/* Morphing Coordinate Stage */}
            <div className="relative w-full max-w-[1380px] h-[740px] flex items-center justify-center">
              {/* Animated Colorful Workshop Scene Illustration (Full width along bottom floor) */}
              <div
                className="absolute inset-x-0 -bottom-6 flex items-end justify-center pointer-events-none select-none overflow-hidden"
                style={{ opacity: 0.25 + 0.65 * bgDarkness }}
              >
                <svg className="w-full max-w-[1440px] h-auto max-h-[240px]" viewBox="0 0 1440 300" aria-hidden="true">
                  <defs>
                    <pattern id="ws-peg" width="14" height="14" patternUnits="userSpaceOnUse">
                      <circle cx="7" cy="7" r="1.3" fill="#2a2a31" />
                    </pattern>
                    <linearGradient id="ws-cone" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stopColor="#ffd27a" stopOpacity=".35" />
                      <stop offset="1" stopColor="#ffd27a" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {/* Pegboard with swaying tools */}
                  <rect x="70" y="70" width="250" height="180" rx="6" fill="#141418" stroke="#26262c" />
                  <rect x="70" y="70" width="250" height="180" rx="6" fill="url(#ws-peg)" />
                  <g strokeLinecap="round" fill="none">
                    <g transform="translate(110 96)"><g className="ws-sway"><path d="M0 0V70" stroke="#a9a9b2" strokeWidth="8" /><circle cx="0" cy="80" r="12" stroke="#a9a9b2" strokeWidth="6" /><rect x="-3" y="66" width="6" height="12" fill="#141418" stroke="none" /></g></g>
                    <g transform="translate(155 96)"><g className="ws-sway"><path d="M0 0V74" stroke="#e11d2a" strokeWidth="7" /><circle cx="0" cy="-2" r="9" stroke="#e11d2a" strokeWidth="5" /><circle cx="0" cy="82" r="9" stroke="#e11d2a" strokeWidth="5" /></g></g>
                    <g transform="translate(205 96)"><g className="ws-sway"><path d="M0 0V70" stroke="#7a5a3a" strokeWidth="6" /><rect x="-18" y="-8" width="36" height="16" rx="3" fill="#a9a9b2" stroke="none" /></g></g>
                    <g transform="translate(250 96)"><g className="ws-sway"><path d="M-9 0L-2 56M9 0L2 56" stroke="#e11d2a" strokeWidth="6" /><path d="M-3 56L-1 72M3 56L1 72" stroke="#a9a9b2" strokeWidth="5" /></g></g>
                    <g transform="translate(290 96)"><g className="ws-sway"><rect x="-6" y="-8" width="12" height="30" rx="4" fill="#e11d2a" stroke="none" /><path d="M0 22V74" stroke="#a9a9b2" strokeWidth="4" /></g></g>
                  </g>
                  <rect x="85" y="214" width="220" height="6" rx="3" fill="#26262c" />

                  {/* Ceiling lamps with warm amber light cones */}
                  <g transform="translate(450 0)"><g className="ws-lamp" style={{ transformOrigin: '0 0' }}><path d="M0 0V58" stroke="#3a3a42" strokeWidth="3" /><path d="M-22 84L-10 58H10L22 84Z" fill="#b3121c" /><polygon points="-18,86 18,86 70,262 -70,262" fill="url(#ws-cone)" /></g></g>
                  <g transform="translate(975 0)"><g className="ws-lamp ws-lamp-b" style={{ transformOrigin: '0 0' }}><path d="M0 0V50" stroke="#3a3a42" strokeWidth="3" /><path d="M-22 76L-10 50H10L22 76Z" fill="#b3121c" /><polygon points="-18,78 18,78 70,160 -70,160" fill="url(#ws-cone)" /></g></g>

                  {/* Tyre rack */}
                  <g fill="#1c1c21"><rect x="350" y="140" width="8" height="130" /><rect x="562" y="140" width="8" height="130" /><rect x="350" y="200" width="220" height="6" /></g>
                  <g>
                    <g transform="translate(386 172)"><circle r="28" fill="#0e0e10" stroke="#2c2c33" strokeWidth="2" /><circle r="22" fill="none" stroke="#e11d2a" strokeOpacity=".6" /><circle r="14" fill="#1a1a1f" stroke="#c9c9cf" strokeWidth="1.5" /><circle r="4" fill="#c9c9cf" /></g>
                    <g transform="translate(456 172)"><circle r="28" fill="#0e0e10" stroke="#2c2c33" strokeWidth="2" /><circle r="22" fill="none" stroke="#e11d2a" strokeOpacity=".6" /><g className="ws-slow ws-fb"><circle r="14" fill="#1a1a1f" stroke="#c9c9cf" strokeWidth="1.5" /><path d="M0-14V14M-14 0H14" stroke="#c9c9cf" /></g></g>
                    <g transform="translate(526 172)"><circle r="28" fill="#0e0e10" stroke="#2c2c33" strokeWidth="2" /><circle r="22" fill="none" stroke="#e11d2a" strokeOpacity=".6" /><circle r="14" fill="#1a1a1f" stroke="#c9c9cf" strokeWidth="1.5" /><circle r="4" fill="#c9c9cf" /></g>
                  </g>
                  <g transform="translate(386 242)"><circle r="28" fill="#0e0e10" stroke="#2c2c33" strokeWidth="2" /><circle r="22" fill="none" stroke="#e11d2a" strokeOpacity=".6" /><circle r="14" fill="#1a1a1f" stroke="#c9c9cf" strokeWidth="1.5" /><circle r="4" fill="#c9c9cf" /></g>
                  <g transform="translate(456 242)"><circle r="28" fill="#0e0e10" stroke="#2c2c33" strokeWidth="2" /><circle r="22" fill="none" stroke="#e11d2a" strokeOpacity=".6" /><circle r="14" fill="#1a1a1f" stroke="#c9c9cf" strokeWidth="1.5" /><circle r="4" fill="#c9c9cf" /></g>
                  <g transform="translate(526 242)"><circle r="28" fill="#0e0e10" stroke="#2c2c33" strokeWidth="2" /><circle r="22" fill="none" stroke="#e11d2a" strokeOpacity=".6" /><circle r="14" fill="#1a1a1f" stroke="#c9c9cf" strokeWidth="1.5" /><circle r="4" fill="#c9c9cf" /></g>

                  {/* Wheel balancer */}
                  <rect x="640" y="168" width="62" height="102" rx="6" fill="#1c1c21" stroke="#2e2e35" />
                  <rect x="652" y="180" width="38" height="22" rx="3" fill="#0b0b0d" /><circle className="ws-blink" cx="662" cy="191" r="3.5" fill="#e11d2a" /><circle cx="676" cy="191" r="3.5" fill="#3a3a42" />
                  <path d="M702 222H770" stroke="#8d8d96" strokeWidth="6" />
                  <g transform="translate(770 222)">
                    <circle r="40" fill="#0e0e10" stroke="#2c2c33" strokeWidth="2" />
                    <circle r="34" fill="none" stroke="#e11d2a" strokeOpacity=".5" strokeDasharray="10 6" />
                    <g className="ws-spin ws-fb"><circle r="22" fill="#1a1a1f" stroke="#c9c9cf" strokeWidth="2" /><path d="M0-22V22M-22 0H22M-15.5-15.5L15.5 15.5M-15.5 15.5L15.5-15.5" stroke="#c9c9cf" strokeWidth="2" /></g>
                    <circle r="5" fill="#e11d2a" />
                    <path d="M-48 0A48 48 0 0 1 48 0" fill="none" stroke="#3a3a42" strokeWidth="3" />
                  </g>

                  {/* Red tool chest with sliding drawer */}
                  <rect x="916" y="158" width="118" height="9" rx="2" fill="#2a2a31" />
                  <path d="M940 158L1010 148" stroke="#a9a9b2" strokeWidth="5" strokeLinecap="round" /><circle cx="1012" cy="147" r="6" fill="none" stroke="#a9a9b2" strokeWidth="3" />
                  <rect x="920" y="167" width="110" height="98" rx="4" fill="#b3121c" />
                  <rect x="926" y="196" width="98" height="26" fill="#0b0b0d" /><path d="M934 214h36" stroke="#8d8d96" strokeWidth="4" strokeLinecap="round" /><path d="M980 208l30 4" stroke="#e11d2a" strokeWidth="4" strokeLinecap="round" />
                  <g className="ws-drawer"><rect x="926" y="196" width="98" height="26" rx="2" fill="#8c0f18" stroke="#e11d2a" strokeOpacity=".6" /><rect x="960" y="206" width="30" height="5" rx="2.5" fill="#d9d9de" /></g>
                  <rect x="926" y="172" width="98" height="20" rx="2" fill="#8c0f18" /><rect x="960" y="180" width="30" height="5" rx="2.5" fill="#d9d9de" />
                  <rect x="926" y="228" width="98" height="30" rx="2" fill="#8c0f18" /><rect x="960" y="240" width="30" height="5" rx="2.5" fill="#d9d9de" />
                  <circle cx="932" cy="268" r="5" fill="#26262c" /><circle cx="1018" cy="268" r="5" fill="#26262c" />

                  {/* Small tyre stack */}
                  <g transform="translate(1060 270)">
                    <rect x="0" y="-15" width="56" height="15" rx="7" fill="#161619" stroke="#e11d2a" strokeOpacity=".6" />
                    <rect x="3" y="-30" width="50" height="15" rx="7" fill="#1d1d21" stroke="#e11d2a" strokeOpacity=".6" />
                    <rect x="0" y="-45" width="56" height="15" rx="7" fill="#161619" stroke="#e11d2a" strokeOpacity=".6" />
                    <rect x="3" y="-60" width="50" height="15" rx="7" fill="#1d1d21" stroke="#e11d2a" strokeOpacity=".6" />
                  </g>

                  {/* Compressor + wheel with air gun & sparks */}
                  <rect x="1200" y="256" width="8" height="14" fill="#26262c" /><rect x="1302" y="256" width="8" height="14" fill="#26262c" />
                  <rect x="1190" y="212" width="132" height="46" rx="23" fill="#b3121c" />
                  <rect x="1262" y="190" width="42" height="22" rx="3" fill="#3a3a42" /><rect x="1268" y="196" width="30" height="4" fill="#8d8d96" />
                  <circle cx="1230" cy="206" r="13" fill="#0b0b0d" stroke="#c9c9cf" strokeWidth="2" />
                  <path className="ws-needle" d="M1230 206V196" stroke="#e11d2a" strokeWidth="2.5" strokeLinecap="round" />
                  <circle cx="1230" cy="206" r="2.5" fill="#c9c9cf" />
                  <path className="ws-air" d="M1322 238C1350 250 1350 262 1366 252" fill="none" stroke="#e11d2a" strokeWidth="3" strokeLinecap="round" />
                  <g transform="translate(1392 246)">
                    <circle r="24" fill="#0e0e10" stroke="#2c2c33" strokeWidth="2" /><circle r="19" fill="none" stroke="#e11d2a" strokeOpacity=".6" />
                    <g className="ws-slow ws-fb"><circle r="12" fill="#1a1a1f" stroke="#c9c9cf" strokeWidth="1.5" /><path d="M0-12V12M-12 0H12" stroke="#c9c9cf" /></g>
                    <g fill="#ffd27a"><rect className="ws-spark" x="-28" y="-6" width="5" height="2" /><rect className="ws-spark" x="-30" y="2" width="5" height="2" /><rect className="ws-spark" x="-26" y="-12" width="4" height="2" /></g>
                  </g>

                  {/* Dust & floor */}
                  <g fill="#fff" opacity=".35"><circle className="ws-dust" cx="320" cy="250" r="1.5" /><circle className="ws-dust" style={{ animationDelay: '-2s' }} cx="840" cy="240" r="1.5" /><circle className="ws-dust" style={{ animationDelay: '-3s' }} cx="1150" cy="245" r="1.5" /></g>
                  <rect y="270" width="1440" height="30" fill="#121214" />
                  <rect y="270" width="1440" height="2" fill="#e11d2a" opacity=".7" />
                  <path d="M0 286H1440" stroke="#26262c" strokeWidth="2" strokeDasharray="30 22" />
                </svg>
              </div>

            {/* Soft Studio Glow Behind Wheel */}
            <div
              className="absolute w-[680px] h-[680px] rounded-full bg-[radial-gradient(circle_at_center,rgba(227,27,35,0.08),transparent_65%)] pointer-events-none"
              style={{ opacity: innerProgress }}
            />

            {/* Concentric Ring Guides (Fade in as wheel forms) */}
            <div
              className="absolute w-[640px] h-[640px] rounded-full border border-dashed border-slate-500/40 pointer-events-none transition-transform duration-150"
              style={{
                opacity: innerProgress,
                transform: `scale(${0.75 + 0.25 * innerProgress})`,
              }}
            />
            <div
              className="absolute w-[376px] h-[376px] rounded-full border border-dashed border-slate-500/40 pointer-events-none transition-transform duration-150"
              style={{
                opacity: innerProgress,
                transform: `scale(${0.75 + 0.25 * innerProgress})`,
              }}
            />

            {/* THE 7 CATEGORY CARDS: Morph smoothly from horizontal marquee row to outer circle */}
            {categoriesData.map((cat, idx) => {
              // Start: Horizontal row right below Hero & Find Your Tyre (visible immediately!)
              const startX = (idx - 3) * 188 + marqueeDrift * (1 - ease);
              const startY = -270;

              // End: Outer ring of the circle (320px radius — top card clears sticky header cleanly)
              const angle = (idx / categoriesData.length) * 2 * Math.PI - Math.PI / 2;
              const radius = 320;
              const endX = Math.cos(angle) * radius;
              const endY = Math.sin(angle) * radius;

              const x = startX + (endX - startX) * ease;
              const y = startY + (endY - startY) * ease;
              const rot = Math.sin(ease * Math.PI) * (idx % 2 === 0 ? 7 : -7);
              const isSelected = selectedCategories.includes(cat.id);

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleCategory(cat.id)}
                  style={{
                    transform: `translate(${x}px, ${y}px) rotate(${rot}deg) scale(${isSelected ? 1.05 : 1})`,
                  }}
                  className={`absolute z-20 w-[180px] p-3.5 rounded-2xl border-2 transition-[border-color,box-shadow,background-color] duration-150 flex flex-col items-center text-center cursor-pointer shadow-[0_10px_28px_rgba(15,23,42,0.08)] hover:shadow-xl will-change-transform ${
                    isSelected
                      ? 'bg-red-50 border-[#e31b23] ring-4 ring-[#e31b23]/20'
                      : 'bg-white border-slate-200/90 hover:border-slate-400'
                  }`}
                >
                  {isSelected && (
                    <span className="absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full bg-[#e31b23] text-white flex items-center justify-center shadow-md animate-in zoom-in-50 duration-200">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                  )}
                  <img
                    src={CATEGORY_PHOTOS[cat.id] || '/images/legacy/u-h-wheel.webp'}
                    alt={cat.name}
                    className="w-26 h-16 object-contain mb-1.5"
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

            {/* INNER RING: 9 Brands (188px radius) */}
            {BRANDS_9.map((brand, idx) => {
              const angle = (idx / BRANDS_9.length) * 2 * Math.PI - Math.PI / 2;
              const radius = 188;
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
                  className={`absolute z-20 w-[114px] h-[58px] p-2 rounded-2xl border-2 transition-[border-color,box-shadow,background-color] duration-150 flex items-center justify-center cursor-pointer shadow-sm hover:shadow-lg will-change-transform ${
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

            {/* CENTER HUB: Clear & Go Buttons (170px diameter — generous clearance) */}
            <div
              style={{
                opacity: innerProgress,
                transform: `scale(${0.65 + 0.35 * innerProgress})`,
                pointerEvents: innerProgress > 0.4 ? 'auto' : 'none',
              }}
              className="relative z-30 w-[170px] h-[170px] rounded-full bg-white border-2 border-slate-200 shadow-[0_18px_45px_rgba(15,23,42,0.12)] flex flex-col items-center justify-center p-4 text-center"
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

          {/* Dynamic Instruction Banner (Below the wheel) */}
          <div
            className="relative z-40 text-center max-w-2xl mx-auto mt-4 transition-opacity duration-300"
            style={{ opacity: 0.75 + 0.25 * innerProgress }}
          >
            <p className={`text-xs sm:text-sm font-semibold ${bgDarkness > 0.5 ? 'text-slate-300' : 'text-slate-600'}`}>
              {progress < 0.45 ? (
                <span>
                  Scroll down to form the <span className="text-[#e31b23] font-bold">Category &amp; Brand Wheel</span>, or click any category directly.
                </span>
              ) : (
                <span>
                  Select one or more <span className="text-white font-bold">Categories</span> (outer ring) and <span className="text-white font-bold">Brands</span> (inner ring), then click <span className="text-[#e31b23] font-black">Go →</span>
                </span>
              )}
            </p>
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
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all duration-200 active:scale-95 cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#e31b23] text-white border-[#e31b23] shadow-sm scale-[1.02]'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  <span>{cat.name}</span>
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
    </div>
  );
}
