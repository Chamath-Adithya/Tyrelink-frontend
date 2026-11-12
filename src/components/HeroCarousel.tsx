import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const bannerSlides = [
  {
    id: 'banner-1',
    image: 'https://images.unsplash.com/photo-1578844251758-2f71da64c96f?w=1800&auto=format&fit=crop&q=90',
    link: '/shop',
    alt: 'Tyrelink — Sri Lanka\'s Islandwide Tyre Partner with Verified Fitment',
  },
  {
    id: 'banner-2',
    image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=1800&auto=format&fit=crop&q=90',
    link: '/category/car-tyres',
    alt: 'Passenger Car Tyres — CEAT, DSI, Michelin, Bridgestone with 1-Click WhatsApp Order',
  },
  {
    id: 'banner-3',
    image: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=1800&auto=format&fit=crop&q=90',
    link: '/category/suv-4x4',
    alt: 'SUV & 4x4 All-Terrain Tyres — Dunlop Grandtrek and Highway Terrain Options',
  },
  {
    id: 'banner-4',
    image: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=1800&auto=format&fit=crop&q=90',
    link: '/category/garage-equipment',
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

  // Concept 4: Curved Dynamic Island Morph on Scroll
  // Corners expand from rounded-3xl to rounded-[4rem] capsule, margins compress inward
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const container = containerRef.current;
          if (container) {
            const scrollY = Math.max(0, window.scrollY);
            const maxScroll = 260; // Max scroll distance for complete morph
            const progress = Math.min(1, Math.max(0, scrollY / maxScroll));

            const isMobile = window.innerWidth < 640;
            const startRadius = isMobile ? 24 : 32;
            const endRadius = isMobile ? 48 : 64; // rounded-[4rem] capsule
            const currentRadius = startRadius + (endRadius - startRadius) * progress;

            // Inward side compression & subtle vertical glide
            const scaleX = 1 - progress * 0.045; // 4.5% horizontal inward compress
            const scaleY = 1 - progress * 0.025; // 2.5% vertical compress
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
      className="relative w-full h-[240px] sm:h-[360px] md:h-[440px] lg:h-[520px] xl:h-[580px] rounded-2xl sm:rounded-[2.5rem] overflow-hidden bg-slate-900 shadow-[0_16px_50px_rgba(0,0,0,0.10)] border border-slate-100 group select-none cursor-pointer will-change-[border-radius,transform,box-shadow] transition-[border-radius,transform,box-shadow] duration-150 ease-out"
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
        className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-lg backdrop-blur-md flex items-center justify-center transition-all hover:scale-110 active:scale-90 z-20 opacity-0 group-hover:opacity-100 duration-300 cursor-pointer"
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
        className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-lg backdrop-blur-md flex items-center justify-center transition-all hover:scale-110 active:scale-90 z-20 opacity-0 group-hover:opacity-100 duration-300 cursor-pointer"
      >
        <ChevronRight className="w-5 h-5 translate-x-0.5" />
      </button>

      {/* Modern Minimalist Pagination Dots */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20">
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
            className={`rounded-full transition-all duration-300 cursor-pointer ${current === idx
                  ? 'w-7 h-2 bg-brand-500 shadow-[0_0_8px_rgba(237,28,36,0.6)]'
                  : 'w-2 h-2 bg-white/50 hover:bg-white/80'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
