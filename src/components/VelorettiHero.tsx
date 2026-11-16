import React, { useState } from 'react';
import { Search, ShieldCheck, Truck, Calendar, ArrowRight, CheckCircle2 } from 'lucide-react';

const WIDTHS = ['155', '165', '175', '185', '195', '205', '215', '225', '265'];
const PROFILES = ['55', '60', '65', '70', '75', '80', '90'];
const RIMS = ['R12', 'R13', 'R14', 'R15', 'R16', 'R17', 'R18'];

export default function VelorettiHero() {
  const [selectedWidth, setSelectedWidth] = useState('185');
  const [selectedProfile, setSelectedProfile] = useState('65');
  const [selectedRim, setSelectedRim] = useState('R15');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = `${selectedWidth}/${selectedProfile} ${selectedRim}`;
    window.location.href = `/shop?q=${encodeURIComponent(query)}`;
  };

  return (
    <div className="relative w-full rounded-3xl bg-white border border-slate-200/90 shadow-2xs overflow-hidden">
      
      {/* Background Architectural Grid Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 p-6 sm:p-10 lg:p-14 items-center">
        
        {/* Left Column: Brand Headline & Dimension Finder */}
        <div className="lg:col-span-7 flex flex-col justify-center">
          
          {/* Subtle Engineered Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100/80 border border-slate-200 text-slate-800 text-[11px] font-bold uppercase tracking-wider w-fit mb-5">
            <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
            <span>Sri Lanka's Direct Tyre & Garage Hub</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-950 font-display tracking-tight leading-[1.08] mb-3">
            Precision Engineered <br className="hidden sm:inline" />
            <span className="text-brand-600">For Every Road.</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 font-normal max-w-xl leading-relaxed mb-8">
            Genuine CEAT, Michelin, Dunlop & DSI tyres backed by verified manufacture dates, islandwide Cash on Delivery, and manufacturer warranties.
            <span className="block mt-1 text-xs text-slate-500 font-sinhala">
              ඔබේ වාහනයට නිවැරදිම ටයරය සහතික කළ සමාගම් වගකීමක් සමඟ පහසුවෙන් ලබාගන්න.
            </span>
          </p>

          {/* Interactive Tyre Dimension Finder Widget */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 shadow-2xs max-w-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Select Tyre Dimensions
              </span>
              <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Direct Stock Available
              </span>
            </div>

            <form onSubmit={handleSearch} className="grid grid-cols-3 gap-2.5 sm:gap-3 mb-3">
              {/* Width */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
                  1. Width
                </label>
                <select
                  value={selectedWidth}
                  onChange={(e) => setSelectedWidth(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all cursor-pointer"
                >
                  {WIDTHS.map((w) => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
              </div>

              {/* Profile */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
                  2. Profile
                </label>
                <select
                  value={selectedProfile}
                  onChange={(e) => setSelectedProfile(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all cursor-pointer"
                >
                  {PROFILES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              {/* Rim */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
                  3. Rim
                </label>
                <select
                  value={selectedRim}
                  onChange={(e) => setSelectedRim(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all cursor-pointer"
                >
                  {RIMS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </form>

            {/* Find Matching Tyres CTA */}
            <button
              type="submit"
              className="w-full py-3 px-5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-all hover:shadow-md active:scale-[0.99] cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>Find Matching Tyres ({selectedWidth}/{selectedProfile} {selectedRim})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Trust Value Badges (Veloretti Minimalist Row) */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-6 pt-6 border-t border-slate-100 text-xs text-slate-600 font-medium">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>100% Genuine Warranty</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-brand-600" />
              <span>Verified DOT Dates</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-slate-800" />
              <span>Islandwide COD</span>
            </div>
          </div>

        </div>

        {/* Right Column: Studio Product Showcase with Motion Badges */}
        <div className="lg:col-span-5 flex items-center justify-center relative">
          
          {/* Subtle Ambient Radial Highlight */}
          <div className="absolute inset-0 bg-radial from-slate-200/50 to-transparent rounded-full filter blur-2xl pointer-events-none" />

          <div className="relative z-10 w-full max-w-md aspect-square flex items-center justify-center p-6">
            
            {/* Tyre Image on Clean Stage */}
            <img
              src="/images/products/premium-radial-hero.png"
              alt="Tyrelink Premium Radial Tyre"
              className="w-full h-auto object-contain max-h-[380px] drop-shadow-2xl hover:scale-105 transition-transform duration-700 ease-out select-none"
              loading="eager"
            />

            {/* Floating Trust Badge 1: Top Right */}
            <div className="absolute top-4 right-2 sm:right-6 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-200/90 shadow-card flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Quality Inspection</div>
                <div className="text-xs font-bold text-slate-900">100% DOT Verified</div>
              </div>
            </div>

            {/* Floating Trust Badge 2: Bottom Left */}
            <div className="absolute bottom-4 left-2 sm:left-6 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-200/90 shadow-card flex items-center gap-2">
              <Truck className="w-4 h-4 text-brand-600" />
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Delivery Guarantee</div>
                <div className="text-xs font-bold text-slate-900">Cash on Delivery (COD)</div>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
