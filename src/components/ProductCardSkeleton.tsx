import React from 'react';

export default function ProductCardSkeleton() {
  return (
    <div className="flex flex-col justify-between bg-white rounded-[2rem] p-4 sm:p-4.5 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.06),0_2px_8px_-2px_rgba(0,0,0,0.04)] border-0 relative overflow-hidden animate-pulse">
      <div>
        {/* Shimmer Thumbnail Frame */}
        <div className="relative aspect-[4/3] sm:aspect-square max-h-[250px] sm:max-h-none w-full rounded-2xl overflow-hidden bg-slate-100 mb-3.5 p-4 flex items-center justify-center">
          <div className="w-3/4 h-3/4 rounded-xl shimmer" />
          
          {/* Badge Placeholder */}
          <div className="absolute top-3 left-3 w-16 h-5 rounded-full shimmer" />
        </div>

        {/* Brand & Rating Skeleton */}
        <div className="space-y-2 text-left">
          <div className="flex items-center justify-between">
            <div className="w-16 h-4 rounded-md shimmer" />
            <div className="w-12 h-4 rounded-md shimmer" />
          </div>

          {/* Title Skeleton (2 lines) */}
          <div className="space-y-1.5 pt-1">
            <div className="w-full h-4 rounded-md shimmer" />
            <div className="w-3/4 h-4 rounded-md shimmer" />
          </div>

          {/* Warranty Pill */}
          <div className="w-24 h-3.5 rounded-full shimmer mt-2" />
        </div>
      </div>

      {/* Price & Action Skeleton */}
      <div className="mt-5 pt-4 border-t border-slate-100 flex items-end justify-between gap-2">
        <div className="space-y-1.5">
          <div className="w-28 h-6 rounded-lg shimmer" />
          <div className="w-36 h-3.5 rounded-md shimmer" />
        </div>

        <div className="w-9 h-9 rounded-2xl bg-slate-100 shimmer shrink-0" />
      </div>
    </div>
  );
}
