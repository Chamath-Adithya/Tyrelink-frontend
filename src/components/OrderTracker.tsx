import React, { useState } from 'react';
import { Search, Truck, CheckCircle2, Clock, MapPin, Package, AlertCircle, ShieldCheck } from 'lucide-react';
import trackingData from '../data/tracking.json';
import type { TrackingRecord } from '../types';

export default function OrderTracker() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<TrackingRecord | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    // Strict Tracking Reference lookup (Sanitized Alphanumeric)
    const cleanQuery = query.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

    const found = (trackingData as TrackingRecord[]).find((t) => {
      const cleanTrk = t.trackingId.toUpperCase().replace(/[^A-Z0-9]/g, '');
      return cleanTrk === cleanQuery;
    });

    setResult(found || null);
    setHasSearched(true);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 text-left">
      {/* Search Box Card with 3D Soft Elevation */}
      <div className="bg-white/80 backdrop-blur-2xl rounded-[2rem] p-7 sm:p-9 shadow-[0_12px_40px_rgba(0,0,0,0.04)] border border-white/90 glass-card">
        <form onSubmit={handleSearch} className="space-y-5">
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-3 font-display">
              Official Courier Tracking Number (කුරියර් Tracking අංකය)
            </label>
            <div className="relative flex items-center">
              <Truck className="absolute left-4.5 h-5 w-5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. TL-TRK-7712 or TL-ORD-9021"
                required
                className="w-full h-14 pl-12 pr-32 text-sm sm:text-base font-mono bg-slate-50/80 border border-slate-200/60 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:bg-white transition-all shadow-2xs font-bold"
              />
              <button
                type="submit"
                className="absolute right-2 px-6 sm:px-8 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs sm:text-sm shadow-glow transition-all active:scale-95 cursor-pointer border-0"
              >
                Track
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 gap-2 pt-1">
            <span className="flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Secure 1-to-1 Tracking Verification</span>
            </span>
            <span className="font-medium">
              Sample ID: <code className="text-brand-600 font-bold font-mono px-2 py-0.5 rounded bg-red-50/80 border border-red-200/50">TL-TRK-7712</code>
            </span>
          </div>
        </form>
      </div>

      {/* Tracking Timeline Result */}
      {hasSearched && (
        result ? (
          <div className="bg-white/80 backdrop-blur-2xl rounded-[2rem] p-7 sm:p-9 shadow-[0_15px_45px_-10px_rgba(0,0,0,0.06)] border border-white/90 space-y-6 animate-in fade-in slide-in-from-top-3 duration-200 text-left glass-card">

            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-2">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono">
                  TRACKING REF: {result.trackingId}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5 font-sans">
                  {result.productTitle}
                </h3>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-[10px] text-slate-400 block font-semibold">Estimated Doorstep Arrival</span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
                  {result.estimatedDelivery}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border-0">
              <div>
                <span className="text-slate-400 block font-medium">Logistics Partner:</span>
                <span className="font-bold text-slate-800">{result.courierPartner}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Delivery Destination:</span>
                <span className="font-bold text-slate-800">{result.deliveryCity}</span>
              </div>
            </div>

            {/* 5-Step Vertical Timeline */}
            <div className="space-y-6 pl-2 pt-2">
              {result.steps.map((step, idx) => (
                <div key={idx} className="relative flex items-start gap-4 group">
                  {/* Vertical Line */}
                  {idx < result.steps.length - 1 && (
                    <div className={`absolute left-[15px] top-[26px] bottom-[-24px] w-0.5 ${step.completed ? 'bg-emerald-500' : 'bg-slate-200'
                      }`} />
                  )}

                  {/* Icon Indicator */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 transition-all ${step.completed
                      ? 'bg-emerald-500 text-white shadow-[0_2px_8px_rgba(16,185,129,0.35)]'
                      : 'bg-slate-100 text-slate-400 border border-slate-200'
                    }`}>
                    {step.completed ? (
                      <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                    ) : (
                      <Clock className="w-4 h-4" />
                    )}
                  </div>

                  {/* Text Details */}
                  <div className="flex-1 space-y-0.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <p className={`text-xs sm:text-sm font-bold ${step.completed ? 'text-slate-900' : 'text-slate-400'
                        }`}>
                        {step.title} <span className="text-[11px] font-normal text-slate-500 font-sinhala">({step.sinhalaTitle})</span>
                      </p>
                      {step.timestamp && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          {step.timestamp}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Need delivery assistance?</span>
              <a
                href={`https://wa.me/94783724920?text=${encodeURIComponent(`Hi Tyrelink, I need assistance with Tracking ID: ${result.trackingId}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-600 font-bold hover:underline"
              >
                Chat on WhatsApp →
              </a>
            </div>

          </div>
        ) : (
          <div className="bg-white rounded-[2rem] p-8 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.06)] border-0 text-center space-y-3 animate-in fade-in duration-150">
            <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
            <h3 className="text-sm font-bold text-slate-900">No Tracking Record Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Please double check the Tracking ID provided in your WhatsApp/SMS dispatch receipt (e.g. <code>LPX-TRK-7712</code>).
            </p>
          </div>
        )
      )}
    </div>
  );
}
