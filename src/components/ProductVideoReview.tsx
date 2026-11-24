import React, { useState, useEffect } from 'react';
import { request } from '../services/apiClient';
import { Play } from 'lucide-react';
import { getLiveProducts, ADMIN_EVENT_PRODUCTS } from '../utils/adminStore';

interface ProductVideoReviewProps {
  productId?: string;
  productTitle: string;
  youtubeId?: string | null;
  sampleYoutubeId?: string;
}

export default function ProductVideoReview({
  productId,
  productTitle,
  youtubeId: initialYoutubeId,
  sampleYoutubeId,
}: ProductVideoReviewProps) {
  const [activeYoutubeId, setActiveYoutubeId] = useState<string | null>(initialYoutubeId || null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Sync with live products store (localStorage & live updates from ProductEditorModal)
  useEffect(() => {
    const syncLiveId = () => {
      if (productId && typeof window !== 'undefined') {
        const liveList = getLiveProducts();
        const current = liveList.find((p) => p.id === productId || p.slug === productId);
        if (current && current.youtubeReviewId !== undefined) {
          setActiveYoutubeId(current.youtubeReviewId || null);
        }
      }
    };

    syncLiveId();

    const handleUpdate = (e: any) => {
      if (productId && Array.isArray(e.detail)) {
        const current = e.detail.find((p: any) => p.id === productId || p.slug === productId);
        if (current) {
          setActiveYoutubeId(current.youtubeReviewId || null);
        }
      }
    };

    window.addEventListener(ADMIN_EVENT_PRODUCTS, handleUpdate);
    return () => window.removeEventListener(ADMIN_EVENT_PRODUCTS, handleUpdate);
  }, [productId]);

  useEffect(()=>{setIsPlaying(false);setImgError(false)},[activeYoutubeId]);
  useEffect(()=>{let active=true;if(productId)request<{youtubeReviewId?:string}>(`/v1/products/${encodeURIComponent(productId)}`).then(p=>{if(active && p.youtubeReviewId !== undefined)setActiveYoutubeId(p.youtubeReviewId || null)}).catch(()=>{});return()=>{active=false}},[productId]);
  const raw = activeYoutubeId?.trim() || sampleYoutubeId || '';
  const isSample = !activeYoutubeId || activeYoutubeId === 'kLktn4tgFp4';
  const cleanId = /^[A-Za-z0-9_-]{11}$/.test(raw) ? raw : raw.match(/(?:v=|youtu.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{11})/)?.[1] || '';
  if (!/^[A-Za-z0-9_-]{11}$/.test(cleanId)) return null;


  // High-Res WebP thumbnail with fallback for low networks
  const primaryThumb = `https://i.ytimg.com/vi_webp/${cleanId}/maxresdefault.webp`;
  const fallbackThumb = `https://i.ytimg.com/vi/${cleanId}/hqdefault.jpg`;

  const embedUrl = `https://www.youtube-nocookie.com/embed/${cleanId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;

  return (
    <div className="pt-3 sm:pt-5 w-full space-y-2.5">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 font-display uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-[#ed1c24] animate-pulse"></span>
          {isSample ? (cleanId === 'kLktn4tgFp4' ? 'Meet TyreLink · Sample video' : 'Tyre buying guide · Sample video') : 'A closer look'}
        </span>
        <span className="text-[11px] font-medium text-slate-400">{isSample ? "General guide" : "Product video"}</span>
      </div>

      {/* Main Responsive 16:9 Video Stage */}
      <div 
        className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 shadow-[0_12px_36px_-6px_rgba(0,0,0,0.12),0_2px_10px_-2px_rgba(0,0,0,0.06)] border border-slate-800 group select-none"
      >
        {isPlaying ? (
          /* Active YouTube Responsive Iframe */
          <iframe
            src={embedUrl}
            title={isSample ? "Sample video" : `${productTitle} product video`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="w-full h-full border-0 animate-in fade-in duration-300"
          />
        ) : (
          /* Ultra-Optimized Clean Lite-Embed Poster Stage */
          <div 
            onClick={() => setIsPlaying(true)}
            className="relative w-full h-full cursor-pointer"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {if(e.key === 'Enter' || e.key === ' '){e.preventDefault();setIsPlaying(true)}}}
            aria-label={isSample ? "Play sample video" : `Play ${productTitle} product video`}
          >
            {/* YouTube WebP Optimized Poster Image */}
            <img
              src={imgError ? fallbackThumb : primaryThumb}
              onError={() => setImgError(true)}
              alt={`${productTitle} Video Review Thumbnail`}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-95"
            />

            {/* Subtle Ambient Dark Gradient Scrim */}
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300 pointer-events-none" />

            {/* Center YouTube Play Button (Matte Finish) */}
            <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-red-600 group-hover:bg-red-500 text-white flex items-center justify-center shadow-xl group-hover:scale-110 active:scale-95 transition-all duration-300">
                <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-current ml-1" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
