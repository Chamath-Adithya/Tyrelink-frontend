import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

interface ProductImageGalleryProps {
  title: string;
  images: string[];
  featuredImage: string;
  isFlashDeal?: boolean;
  flashDealDiscount?: number;
}

export default function ProductImageGallery({
  title,
  images,
  featuredImage,
  isFlashDeal,
  flashDealDiscount,
}: ProductImageGalleryProps) {
  // Ensure image list always has valid strings
  const galleryImages = (images && images.length > 0 ? images : [featuredImage]).filter(Boolean);
  const [activeIndex, setActiveIndex] = useState(0);

  // Client mounted state for SSR-safe portal
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Hover magnifier state on main stage
  const [isHovering, setIsHovering] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const stageRef = useRef<HTMLDivElement>(null);

  // Fullscreen Lightbox states
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxZoom, setLightboxZoom] = useState(1);

  // Optical magnifier on mousemove
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setZoomPos({ x, y });
  };

  // Next / Prev navigation
  const nextImage = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % galleryImages.length);
  }, [galleryImages.length]);

  const prevImage = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  }, [galleryImages.length]);

  // Touch Swipe for mobile devices
  const touchStartX = useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) nextImage();
      else prevImage();
    }
    touchStartX.current = null;
  };

  // Lightbox Zoom Controls
  const zoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLightboxZoom((prev) => Math.min(prev + 0.5, 3));
  };
  const zoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLightboxZoom((prev) => Math.max(prev - 0.5, 1));
  };
  const resetZoom = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setLightboxZoom(1);
  };

  // Keyboard navigation & lock body scroll when Lightbox is active
  useEffect(() => {
    if (!isLightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsLightboxOpen(false);
        setLightboxZoom(1);
      } else if (e.key === 'ArrowRight') {
        nextImage();
      } else if (e.key === 'ArrowLeft') {
        prevImage();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isLightboxOpen, nextImage, prevImage]);

  const currentImage = galleryImages[activeIndex] || featuredImage;

  return (
    <div className="space-y-4">
      {/* =====================================================
          CRISP WHITE LUXURY STAGE (USER PREFERRED CLEAN WHITE)
          ===================================================== */}
      <div
        ref={stageRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => {
          setIsHovering(false);
          setZoomPos({ x: 50, y: 50 });
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative h-[400px] sm:h-[480px] w-full rounded-3xl overflow-hidden bg-white shadow-[0_4px_24px_rgba(0,0,0,0.06),0_16px_48px_rgba(0,0,0,0.08)] flex items-center justify-center border border-slate-100 group select-none"
      >
        {/* Subtle radial light gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50/50 via-white to-slate-50/30 pointer-events-none" />

        {/* The Main High-Res Image with Optical Zoom Lens on Hover */}
        <div 
          className="w-full h-full p-6 sm:p-10 flex items-center justify-center overflow-hidden cursor-zoom-in"
          onClick={() => setIsLightboxOpen(true)}
          title="Click to view full screen high-resolution image"
        >
          <img
            key={currentImage}
            src={currentImage}
            alt={`${title} - Angle ${activeIndex + 1}`}
            className="w-full h-full object-contain drop-shadow-md transition-transform duration-200 ease-out"
            style={{
              transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
              transform: isHovering ? 'scale(2.2)' : 'scale(1)',
            }}
          />
        </div>

        {/* Top Left: Flash Discount Ribbon */}
        {isFlashDeal && flashDealDiscount && (
          <span className="absolute top-5 left-5 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-gradient-to-r from-red-600 to-rose-500 text-white shadow-md z-20 pointer-events-none">
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
            -{flashDealDiscount}% OFF
          </span>
        )}

        {/* Top Right: Angle Pill & Fullscreen Button */}
        <div className="absolute top-5 right-5 flex items-center gap-2 z-20">
          {galleryImages.length > 1 && (
            <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-white/95 backdrop-blur-md text-slate-700 shadow-sm border border-slate-200/80 pointer-events-none">
              {activeIndex + 1} / {galleryImages.length}
            </span>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsLightboxOpen(true);
            }}
            aria-label="Open Fullscreen Lightbox"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Fullscreen</span>
          </button>
        </div>

        {/* Floating Prev / Next Arrow Buttons on Stage */}
        {galleryImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                prevImage();
              }}
              aria-label="Previous image angle"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/95 hover:bg-brand-500 hover:text-white backdrop-blur-md border border-slate-200/80 shadow-md text-slate-700 flex items-center justify-center transition-all hover:scale-110 active:scale-90 z-20 cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5 -translate-x-0.5" />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                nextImage();
              }}
              aria-label="Next image angle"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/95 hover:bg-brand-500 hover:text-white backdrop-blur-md border border-slate-200/80 shadow-md text-slate-700 flex items-center justify-center transition-all hover:scale-110 active:scale-90 z-20 cursor-pointer"
            >
              <ChevronRight className="w-5 h-5 translate-x-0.5" />
            </button>
          </>
        )}

        {/* Optical Magnifier Hint Pill */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-slate-900/85 backdrop-blur-md text-white text-[11px] font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none flex items-center gap-1.5 shadow-lg">
          <ZoomIn className="w-3.5 h-3.5 text-brand-400" />
          <span>Move cursor to zoom in • Click for fullscreen</span>
        </div>
      </div>

      {/* =====================================================
          THUMBNAIL STRIP (DIRECT CLICKABLE IMAGE SWITCHER)
          ===================================================== */}
      {galleryImages.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-2 pt-1 scrollbar-none">
          {galleryImages.map((img, idx) => {
            const isActive = idx === activeIndex;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveIndex(idx)}
                className={`relative w-20 h-20 sm:w-22 sm:h-22 rounded-2xl p-1.5 bg-white transition-all duration-200 cursor-pointer flex items-center justify-center shrink-0 border ${
                  isActive
                    ? 'ring-2 ring-brand-500 ring-offset-2 ring-offset-white border-transparent shadow-md scale-105 opacity-100'
                    : 'border-slate-200/80 opacity-60 hover:opacity-100 hover:border-slate-300 hover:scale-102'
                }`}
                aria-label={`Switch to angle ${idx + 1}`}
              >
                <img
                  src={img}
                  alt={`${title} thumbnail ${idx + 1}`}
                  className="w-full h-full object-contain rounded-xl"
                  loading="lazy"
                />
                <span className={`absolute bottom-1 right-1 text-[9px] font-mono font-bold px-1 rounded ${
                  isActive ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  #{idx + 1}
                </span>
              </button>
            );
          })}
        </div>
      )}


      {/* =====================================================
          TRUE FULLSCREEN STUDIO LIGHTBOX (RENDERED AT BODY LEVEL)
          ===================================================== */}
      {mounted && isLightboxOpen && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[999999] w-screen h-screen bg-black/95 backdrop-blur-2xl flex flex-col justify-between p-4 sm:p-6 select-none animate-[fadeIn_0.2s_ease_both]"
          onClick={() => {
            setIsLightboxOpen(false);
            setLightboxZoom(1);
          }}
        >
          {/* Top Bar: Title, Zoom Controls, Close Button */}
          <header 
            className="flex items-center justify-between gap-4 w-full max-w-7xl mx-auto z-20 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-left text-white min-w-0">
              <h2 className="text-sm sm:text-base font-bold truncate max-w-md">{title}</h2>
              <p className="text-xs text-slate-400">
                Angle {activeIndex + 1} of {galleryImages.length} • High Resolution Studio Inspection
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3 shrink-0">
              {/* Zoom Buttons Bar */}
              <div className="flex items-center bg-white/10 rounded-2xl p-1 border border-white/15 backdrop-blur-md">
                <button
                  type="button"
                  onClick={zoomOut}
                  disabled={lightboxZoom <= 1}
                  aria-label="Zoom out"
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono font-bold text-white px-2.5">
                  {Math.round(lightboxZoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={zoomIn}
                  disabled={lightboxZoom >= 3}
                  aria-label="Zoom in"
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                {lightboxZoom > 1 && (
                  <button
                    type="button"
                    onClick={() => resetZoom()}
                    aria-label="Reset zoom"
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-white hover:bg-white/20 transition-colors ml-1 cursor-pointer"
                    title="Reset zoom to 100%"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => {
                  setIsLightboxOpen(false);
                  setLightboxZoom(1);
                }}
                aria-label="Close fullscreen view (Esc)"
                className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-white/10 hover:bg-red-600/90 text-white font-bold text-xs transition-all cursor-pointer border border-white/15"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Close (Esc)</span>
              </button>
            </div>
          </header>

          {/* Main Inspection Stage in Fullscreen Lightbox */}
          <main 
            className="flex-1 w-full h-full flex items-center justify-center relative overflow-hidden my-4 select-none"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Prev Arrow */}
            {galleryImages.length > 1 && (
              <button
                type="button"
                onClick={prevImage}
                aria-label="Previous angle"
                className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-brand-500 text-white flex items-center justify-center transition-all border border-white/15 z-30 cursor-pointer"
              >
                <ChevronLeft className="w-6 h-6 -translate-x-0.5" />
              </button>
            )}

            {/* High-Resolution Fullscreen Image */}
            <div className="relative max-w-5xl max-h-[75vh] w-full h-full flex items-center justify-center">
              <img
                src={currentImage}
                alt={`${title} High-Res Fullscreen`}
                className="max-w-full max-h-[75vh] object-contain transition-transform duration-150 ease-out drop-shadow-2xl"
                style={{
                  transform: `scale(${lightboxZoom})`,
                }}
                draggable={false}
              />
            </div>

            {/* Next Arrow */}
            {galleryImages.length > 1 && (
              <button
                type="button"
                onClick={nextImage}
                aria-label="Next angle"
                className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-brand-500 text-white flex items-center justify-center transition-all border border-white/15 z-30 cursor-pointer"
              >
                <ChevronRight className="w-6 h-6 translate-x-0.5" />
              </button>
            )}
          </main>

          {/* Bottom Thumbnails Strip in Lightbox */}
          {galleryImages.length > 1 && (
            <footer 
              className="flex items-center justify-center gap-3 w-full max-w-xl mx-auto overflow-x-auto pb-2 shrink-0 z-20"
              onClick={(e) => e.stopPropagation()}
            >
              {galleryImages.map((img, idx) => {
                const isActive = idx === activeIndex;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setActiveIndex(idx);
                      setLightboxZoom(1);
                    }}
                    className={`relative w-16 h-16 rounded-xl overflow-hidden transition-all cursor-pointer flex items-center justify-center shrink-0 border ${
                      isActive
                        ? 'ring-2 ring-brand-500 border-transparent bg-white/20 scale-105 opacity-100'
                        : 'border-white/15 opacity-50 hover:opacity-100 hover:border-white/30 bg-white/5'
                    }`}
                    aria-label={`Switch to angle ${idx + 1}`}
                  >
                    <img
                      src={img}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-contain rounded-lg p-1"
                    />
                  </button>
                );
              })}
            </footer>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
