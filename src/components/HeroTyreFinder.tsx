import React, { useState } from 'react';
import { Search } from 'lucide-react';

const WIDTHS = ['155', '185', '195', '265', '90', '100'];
const PROFILES = ['65', '70', '80', '90'];
const RIMS = ['R13', 'R15', 'R15C', 'R17', '17'];

export default function HeroTyreFinder() {
  const [width, setWidth] = useState('');
  const [profile, setProfile] = useState('');
  const [rim, setRim] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const parts = [width && profile ? `${width}/${profile}` : width || profile, rim].filter(Boolean);
    const query = parts.join(' ').trim();
    if (query) {
      window.location.href = `/shop?q=${encodeURIComponent(query)}#catalog-products`;
    } else {
      window.location.href = '/shop#catalog-products';
    }
  };

  return (
    <div className="relative z-20 max-w-4xl mx-auto px-4 sm:px-6 -mt-8 sm:-mt-10 mb-2">
      <form
        onSubmit={handleSearch}
        className="bg-white rounded-2xl shadow-[0_16px_40px_-10px_rgba(15,23,42,0.18)] border border-slate-200/90 p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3"
      >
        {/* Label */}
        <div className="flex items-center gap-2 px-2 shrink-0">
          <span className="w-2 h-2 rounded-full bg-[#e31b23] animate-pulse"></span>
          <span className="text-xs sm:text-sm font-black text-slate-900 tracking-tight whitespace-nowrap">
            Find Your Tyre
          </span>
        </div>

        {/* Selectors */}
        <div className="grid grid-cols-3 gap-2 flex-1 min-w-0">
          <select
            aria-label="Tyre Width"
            value={width}
            onChange={(e) => setWidth(e.target.value)}
            className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#e31b23] cursor-pointer"
          >
            <option value="">Width</option>
            {WIDTHS.map((w) => (
              <option key={w} value={w}>{w}</option>
            ))}
          </select>

          <select
            aria-label="Aspect Ratio"
            value={profile}
            onChange={(e) => setProfile(e.target.value)}
            className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#e31b23] cursor-pointer"
          >
            <option value="">Aspect Ratio</option>
            {PROFILES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          <select
            aria-label="Rim Size"
            value={rim}
            onChange={(e) => setRim(e.target.value)}
            className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#e31b23] cursor-pointer"
          >
            <option value="">Rim Size</option>
            {RIMS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        {/* Red Search CTA Button */}
        <button
          type="submit"
          aria-label="Find matching tyres"
          className="h-10 px-5 rounded-xl bg-[#e31b23] hover:bg-red-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm hover:scale-[1.02] active:scale-95 transition-all cursor-pointer shrink-0"
        >
          <Search className="w-4 h-4" />
          <span className="sm:hidden">Find Tyres</span>
        </button>
      </form>
    </div>
  );
}

