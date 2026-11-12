import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';

const bannerSlides = [
  {
    id: 'banner-1',
    image: 'https://images.unsplash.com/photo-1578844251758-2f71da64c96f?w=1800&auto=format&fit=crop&q=90',
    link: '/shop',
    badge: "SRI LANKA'S TRUSTED TYRE PARTNER",
    title: 'The Right Tyre. Made Simple.',
    sinhala: 'ඔබේ වාහනයට ගැළපෙන ටයරය පහසුවෙන් සොයාගන්න',
    cta: 'Shop All Tyres',
    alt: "Tyrelink — Sri Lanka's Islandwide Tyre Partner with Verified Fitment",
  },
  {
    id: 'banner-2',
    image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=1800&auto=format&fit=crop&q=90',
    link: '/category/car-tyres',
    badge: 'PASSENGER CAR TYRES',
    title: 'CEAT · DSI · Michelin · Bridgestone',
    sinhala: '100% Genuine සමාගම් වගකීමක් සහිත සත්‍ය DOT දින',
    cta: 'Explore Car Tyres',
    alt: 'Passenger Car Tyres with 1-Click WhatsApp Order',
  },
  {
    id: 'banner-3',
    image: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=1800&auto=format&fit=crop&q=90',
    link: '/category/suv-4x4',
    badge: 'SUV & 4X4 ALL-TERRAIN',
    title: 'Tackle Any Sri Lankan Terrain',
    sinhala: 'Dunlop Grandtrek සහ High-Grip All-Terrain Options',
    cta: 'Explore SUV & 4x4',
    alt: 'SUV & 4x4 All-Terrain Tyres',
  },
  {
    id: 'banner-4',
    image: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=1800&auto=format&fit=crop&q=90',
    link: '/category/garage-equipment',
    badge: 'TYRELINK WORKSHOP SYSTEMS',
    title: 'Commercial Garage Equipment & Tools',
    sinhala: 'Tyre Changers · Wheel Balancers · Scissor Lifts',
    cta: 'Explore Garage Solutions',
    alt: 'Tyrelink Pro Garage Equipment & Tyre Service Workshop Systems',
  },
];

export default function HeroCarousel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const SLIDE_DURATION = 5000;

  // Auto-play slide rotation (pauses on hover)
  useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % bannerSlides.length);
    }, SLIDE_DURATION);
    return () => clearInterval(timer);
  }, [isHovered]);

  // Curved Dynamic Island Morph on Scroll
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const container = containerRef.current;
          if (container) {
            const scrollY = Math.max(0, window.scrollY);
            const maxScroll = 260;
            const progress = Math.min(1, Math.max(0, scrollY / maxScroll));

            const isMobile = window.innerWidth < 640;
            const startRadius = isMobile ? 20 : 28;
            const endRadius = isMobile ? 32 : 44;
            const currentRadius = startRadius + (endRadius - startRadius) * progress;

            const scaleX = 1 - progress * 0.035;
            const scaleY = 1 - progress * 0.02;
            const translateY = progress * 6;

            const shadowSpread = Math.round(16 + progress * 24);
            const shadowBlur = Math.round(50 + progress * 40);
            const shadowAlpha = (0.10 + progress * 0.16).toFixed(2);

            container.style.borderRadius = `${currentRadius.toFixed(1)}px`;
            container.style.transform = `scale(${scaleX.toFixed(3)}, ${scaleY.toFixed(3)}) translateY(${translateY.toFixed(1)}px)`;
            container.style.boxShadow = `0 ${shadowSpread}px ${shadowBlur}px rgba(0, 0, 0, ${shadowAlpha})`;
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const nextSlide = () => setCurrent((prev) => (prev + 1) % bannerSlides.length);
  const prevSlide = () => setCurrent((prev) => (prev - 1 + bannerSlides.length) % bannerSlides.length);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) nextSlide();
      else prevSlide();
    }
    setTouchStartX(null);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[280px] sm:h-[400px] md:h-[480px] lg:h-[540px] xl:h-[600px] rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-950 shadow-[0_16px_50px_rgba(0,0,0,0.25)] border border-slate-800 group select-none cursor-pointer will-change-[border-radius,transform,box-shadow] transition-[border-radius,transform,box-shadow] duration-150 ease-out"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Edge-to-Edge Banner Images with Silky Crossfade Transition */}
      {bannerSlides.map((slide, idx) => (
        <a
          key={slide.id}
          href={slide.link}
          aria-label={slide.alt}
          className="absolute inset-0 w-full h-full block"
          style={{
            opacity: current === idx ? 1 : 0,
            pointerEvents: current === idx ? 'auto' : 'none',
            transition: 'opacity 0.7s cubic-bezier(0.22, 1, 0.36, 1), transform 0.8s cubic-bezier(0.22, 1, 0.36, 1)',
            transform: current === idx ? 'scale(1)' : 'scale(1.04)',
          }}
        >
          <img
            src={slide.image}
            alt={slide.alt}
            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-700 ease-out"
            loading={idx === 0 ? 'eager' : 'lazy'}
          />

          {/* Deep Cinematic Black Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/55 to-black/20" />

          {/* Editorial Content Stage Over Slide */}
          <div className="absolute inset-0 flex items-center p-6 sm:p-12 lg:p-16 text-left">
            <div className="max-w-xl space-y-3 sm:space-y-4">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/90 border border-brand-500/50 text-brand-400 text-[10px] sm:text-xs font-black uppercase tracking-widest backdrop-blur-md shadow-sm">
                <span className="w-2 h-2 rounded-full bg-[#ed1c24] animate-pulse" />
                <span>{slide.badge}</span>
              </div>

              {/* Headline */}
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white font-display tracking-tight leading-[1.02] drop-shadow-[0_2px_15px_rgba(0,0,0,0.5)]">
                {slide.title}
              </h2>

              {/* Sinhala Subtext */}
              <p className="text-xs sm:text-sm text-slate-300 font-sinhala font-medium leading-relaxed drop-shadow-[0_1px_5px_rgba(0,0,0,0.4)]">
                {slide.sinhala}
              </p>

              {/* CTA Button */}
              <div className="pt-2">
                <span className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#ed1c24] hover:bg-[#c9141b] text-white text-xs sm:text-sm font-black uppercase tracking-wider shadow-[0_10px_25px_rgba(237,28,36,0.35)] transition-all group-hover:scale-105 active:scale-95">
                  <span>{slide.cta}</span>
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          </div>
        </a>
      ))}

      {/* Floating Prev Button */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          prevSlide();
        }}
        aria-label="Previous Slide"
        className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/60 hover:bg-[#ed1c24] text-white shadow-lg backdrop-blur-md border border-white/20 flex items-center justify-center transition-all hover:scale-110 active:scale-90 z-20 opacity-0 group-hover:opacity-100 duration-300 cursor-pointer"
      >
        <ChevronLeft className="w-5 h-5 -translate-x-0.5" />
      </button>

      {/* Floating Next Button */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          nextSlide();
        }}
        aria-label="Next Slide"
        className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/60 hover:bg-[#ed1c24] text-white shadow-lg backdrop-blur-md border border-white/20 flex items-center justify-center transition-all hover:scale-110 active:scale-90 z-20 opacity-0 group-hover:opacity-100 duration-300 cursor-pointer"
      >
        <ChevronRight className="w-5 h-5 translate-x-0.5" />
      </button>

      {/* Modern Minimalist Pagination Dots */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/20">
        {bannerSlides.map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setCurrent(idx);
            }}
            aria-label={`Go to slide ${idx + 1}`}
            className={`transition-all duration-300 rounded-full cursor-pointer ${
              current === idx
                ? 'w-7 h-2 bg-[#ed1c24]'
                : 'w-2 h-2 bg-white/50 hover:bg-white'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
