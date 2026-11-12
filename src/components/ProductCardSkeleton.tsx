import React from 'react';

export default function ProductCardSkeleton() {
  return (
    <div className="flex flex-col justify-between bg-white rounded-xl p-4 h-[410px] border border-slate-200/80 relative overflow-hidden animate-pulse select-none">
      <div className="flex-1 flex flex-col min-h-0">
        {/* Shimmer Thumbnail Frame */}
        <div className="relative h-[190px] w-full rounded-lg overflow-hidden bg-slate-100 mb-2.5 p-4 flex items-center justify-center shrink-0">
          <div className="w-3/4 h-3/4 rounded-xl shimmer" />
          <div className="absolute top-2.5 left-2.5 w-16 h-5 rounded-full shimmer" />
        </div>

        {/* Brand Skeleton (24px) */}
        <div className="h-6 mb-1.5 flex items-center justify-between shrink-0">
          <div className="w-16 h-4 rounded-md shimmer" />
          <div className="w-12 h-4 rounded-md shimmer" />
        </div>

        {/* Title & Subtitle Skeleton (52px) */}
        <div className="h-[52px] space-y-1.5 pt-0.5">
          <div className="w-full h-4 rounded-md shimmer" />
          <div className="w-2/3 h-3.5 rounded-md shimmer" />
        </div>
      </div>

      {/* Price & Action Skeleton (64px) */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 h-[64px] shrink-0">
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="w-24 h-5 rounded-md shimmer" />
          <div className="w-32 h-3 rounded-md shimmer" />
        </div>

        <div className="w-8 h-8 rounded-xl bg-slate-100 shimmer shrink-0" />
      </div>
    </div>
  );
}
