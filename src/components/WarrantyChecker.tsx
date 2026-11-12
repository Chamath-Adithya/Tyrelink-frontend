import React, { useState } from 'react';
import { ShieldCheck, Search, Calendar, User, CheckCircle2, XCircle, ArrowRight, ShieldAlert, Sparkles, Send, FileText, Clock } from 'lucide-react';
import warrantiesData from '../data/warranties.json';
import type { WarrantyRecord } from '../types';
import { apiRequest } from '../lib/api';

export default function WarrantyChecker() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<WarrantyRecord | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = query.trim().toUpperCase();
    if (!cleaned) return;

    setLoading(true);
    setHasSearched(true);

    try {
      const data = await apiRequest<any>(`/v1/warranty/${encodeURIComponent(cleaned)}`);
      setResult(data.record || data);
    } catch {
      const local = (warrantiesData as WarrantyRecord[]).find(
        w => w.serialNumber.toUpperCase() === cleaned || w.invoiceNumber.toUpperCase() === cleaned
      );
      setResult(local || null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8 text-left">

      {/* Search Input Box Card */}
      <div className="bg-white/80 backdrop-blur-2xl rounded-[2rem] p-7 sm:p-9 shadow-[0_12px_40px_rgba(0,0,0,0.04)] border border-white/90 relative overflow-hidden glass-card">

        <form onSubmit={handleSearch} className="space-y-5">
          <label className="block text-xs font-black uppercase tracking-wider text-slate-800 font-display">
            Invoice Number or Tyre DOT / Serial (ඉන්වොයිස් හෝ Tyre DOT අංකය)
          </label>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-4.5 h-5 w-5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. TL-DOT-9921 or INV-10492"
                className="w-full h-14 pl-12 pr-4 rounded-2xl bg-slate-50/80 border border-slate-200/60 text-sm font-bold font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:bg-white transition-all uppercase shadow-2xs"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="h-14 px-8 sm:px-10 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs sm:text-sm shadow-glow transition-all hover:scale-105 active:scale-95 disabled:opacity-75 shrink-0 flex items-center justify-center gap-2 cursor-pointer border-0"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify Status</span>
                </>
              )}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs text-slate-400 font-medium">
            <span>Try sample records:</span>
            <button
              type="button"
              onClick={() => { setQuery('TL-DOT-9921'); }}
              className="font-mono text-brand-600 hover:underline font-bold px-3 py-1 rounded-lg bg-red-50/80 border border-red-200/50 cursor-pointer"
            >
              TL-DOT-9921
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => { setQuery('INV-10492'); }}
              className="font-mono text-brand-600 hover:underline font-bold px-3 py-1 rounded-lg bg-red-50/80 border border-red-200/50 cursor-pointer"
            >
              INV-10492
            </button>
          </div>
        </form>
      </div>

      {/* Warranty Verification Result */}
      {hasSearched && (
        result ? (
          <div className="bg-white/80 backdrop-blur-2xl rounded-[2.5rem] p-6 sm:p-10 shadow-[0_15px_45px_-10px_rgba(0,0,0,0.06)] border border-white/90 space-y-6 animate-in fade-in slide-in-from-top-3 duration-200 glass-card">

            {/* Status Header Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs">
                  <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-md">
                    Active Registered Warranty
                  </span>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 mt-1 font-sans">
                    {result.productName || result.productTitle}
                  </h3>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-[10px] text-slate-400 block font-semibold">Remaining Coverage</span>
                <span className="text-sm font-black text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full font-display">
                  {result.remainingDays ?? Math.max(0, Math.ceil((new Date(result.validUntil || result.warrantyExpiry || '').getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} Days Active
                </span>
              </div>
            </div>

            {/* Hardware & Invoice Data Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 space-y-1">
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Serial Number</span>
                <span className="font-mono font-bold text-slate-900">{result.serialNumber}</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 space-y-1">
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Invoice Number</span>
                <span className="font-mono font-bold text-slate-900">{result.invoiceNumber}</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 space-y-1">
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Purchase Date</span>
                <span className="font-mono font-bold text-slate-900">{result.purchaseDate}</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 space-y-1">
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Expiry Date</span>
                <span className="font-mono font-bold text-slate-900">{result.validUntil || result.warrantyExpiry}</span>
              </div>
            </div>

            {/* Direct Claim Trigger Strip */}
            <div className="p-5 rounded-2xl bg-emerald-50/70 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-0.5 text-center sm:text-left">
                <p className="text-xs font-bold text-emerald-950">Need a warranty replacement or hardware check?</p>
                <p className="text-[11px] text-emerald-700 font-medium">Direct 1-to-1 Horana technical desk support with zero paperwork.</p>
              </div>

              <a
                href={`https://wa.me/94783724920?text=${encodeURIComponent(`Hi Tyrelink, I would like to initiate a warranty claim for Serial: ${result.serialNumber} (${result.productName || result.productTitle})`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-glow-green hover:scale-105 active:scale-95 transition-all shrink-0 cursor-pointer"
              >
                <span>Initiate Claim on WhatsApp</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>

          </div>
        ) : (
          <div className="bg-white rounded-[2rem] p-10 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.06)] border-0 text-center space-y-3 animate-in fade-in duration-150">
            <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">No Warranty Record Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Please check the serial number printed on your product box sticker or invoice number (e.g. <code>LPX-SN-9921</code>).
            </p>
          </div>
        )
      )}

    </div>
  );
}
