import React, { useState } from 'react';
import { X, CheckCircle2, ShieldCheck, Truck, Sparkles, Send, AlertCircle, Phone, MapPin, User, CreditCard } from 'lucide-react';
import confetti from 'canvas-confetti';
import { apiRequest } from '../lib/api';

interface QuickOrderModalProps {
  productId: string;
  productTitle: string;
  price: number;
  featuredImage?: string;
  selectedUpgrades?: string[];
  isOpen: boolean;
  onClose: () => void;
  whatsappNumber?: string;
}

export default function QuickOrderModal({
  productId,
  productTitle,
  price,
  featuredImage,
  selectedUpgrades = [],
  isOpen,
  onClose,
  whatsappNumber = '94783724920'
}: QuickOrderModalProps) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone1, setPhone1] = useState('');
  const [phone2, setPhone2] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash on Delivery' | 'Bank Transfer'>('Cash on Delivery');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const validatePhone = (num: string) => {
    const cleaned = num.replace(/\D/g, '');
    return cleaned.length >= 9 && cleaned.length <= 11;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (!name.trim()) {
      setErrorMessage('Please enter your full name (කරුණාකර ඔබගේ සම්පූර්ණ නම ඇතුළත් කරන්න).');
      return;
    }
    if (!address.trim()) {
      setErrorMessage('Please enter your delivery address & city (භාණ්ඩය ලැබිය යුතු ලිපිනය ඇතුළත් කරන්න).');
      return;
    }
    if (!validatePhone(phone1)) {
      setErrorMessage('Please enter a valid 10-digit phone number (වලංගු දුරකථන අංකයක් ඇතුළත් කරන්න, උදා: 0771234567).');
      return;
    }

    setIsSubmitting(true);
    const orderRef = `TL-${Date.now().toString().slice(-8)}`;

    const orderPayload = {
      productId,
      productTitle,
      price,
      selectedUpgrades,
      customerName: name.trim(),
      address: address.trim(),
      phone1: phone1.trim(),
      phone2: phone2.trim() || undefined,
      paymentMethod,
      timestamp: new Date().toISOString(),
      orderRef,
      status: 'pending_whatsapp'
    };

    // 1. Asynchronously save lead to /api/order backend
    try {
      await apiRequest('/v1/order-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });
    } catch (err) {
      console.warn('Backend lead capture offline, proceeding directly to WhatsApp:', err);
    }

    // 2. Trigger festive celebratory confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (_) { }

    // 3. Format clean WhatsApp Message
    const upgradesText = selectedUpgrades.length > 0
      ? `\n*Selected Upgrades:* ${selectedUpgrades.join(', ')}`
      : '';

    const message = `*NEW ORDER - Tyrelink*
----------------------------------------
*Product:* ${productTitle}${upgradesText}
*Total Amount:* Rs. ${price.toLocaleString('en-US')}
*Order Ref:* #${orderRef}

*Customer Name:* ${name}
*Delivery Address:* ${address}
*Primary Mobile:* ${phone1}
${phone2 ? `*Alternative Mobile:* ${phone2}\n` : ''}*Payment Method:* ${paymentMethod}
----------------------------------------
කරුණාකර මගේ මෙම ඇණවුම ඉක්මනින් dispatch කර එවන්න. ස්තූතියි!`;

    const waUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

    setIsSuccess(true);
    setTimeout(() => {
      window.open(waUrl, '_blank');
      setIsSubmitting(false);
      onClose();
      setIsSuccess(false);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg rounded-3xl bg-white/95 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl border border-white/80 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            {featuredImage && (
              <img
                src={featuredImage}
                alt={productTitle}
                className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
              />
            )}
            <div>
              <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-100 text-brand-700">
                    1-Click Fast Checkout
                  </span>
                  <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                    <ShieldCheck className="w-3 h-3" /> Zero Leakage
                  </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-1 line-clamp-1">
                {productTitle}
              </h3>
              <p className="text-xs font-black text-brand-600">
                Rs. {price.toLocaleString('en-US')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {isSuccess ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h4 className="text-lg font-bold text-slate-900">Lead Saved Successfully!</h4>
            <p className="text-xs text-slate-500">Opening WhatsApp to confirm your dispatch...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Full Name (සම්පූර්ණ නම)</span>
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Kasun Chamara / කසුන් චාමර"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs sm:text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>Delivery Address & City (භාණ්ඩය ලැබිය යුතු ලිපිනය සහ නගරය)</span>
                <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={2}
                placeholder="e.g. No 45, Station Road, Horana"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs sm:text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>Mobile 1 (Main / WhatsApp)</span>
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phone1}
                  onChange={(e) => setPhone1(e.target.value)}
                  placeholder="077 123 4567"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs sm:text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none transition-all"
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>Mobile 2 (Alternative)</span>
                </label>
                <input
                  type="tel"
                  value={phone2}
                  onChange={(e) => setPhone2(e.target.value)}
                  placeholder="071 987 6543"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs sm:text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1">
                <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                <span>Payment Option (ගෙවීම් ක්‍රමය)</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                  <label className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer text-xs font-semibold transition-all ${paymentMethod === 'Cash on Delivery' ? 'border-brand-500 bg-red-50/60 text-brand-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="Cash on Delivery"
                      checked={paymentMethod === 'Cash on Delivery'}
                      onChange={() => setPaymentMethod('Cash on Delivery')}
                      className="text-brand-500 focus:ring-brand-500"
                    />
                    <span>Cash on Delivery</span>
                  </label>
                    <label className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer text-xs font-semibold transition-all ${paymentMethod === 'Bank Transfer' ? 'border-brand-500 bg-red-50/60 text-brand-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="Bank Transfer"
                        checked={paymentMethod === 'Bank Transfer'}
                        onChange={() => setPaymentMethod('Bank Transfer')}
                        className="text-brand-500 focus:ring-brand-500"
                      />
                      <span>Bank Transfer</span>
                    </label>
                  </div>
              </div>

              <div className="flex items-center gap-3 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <Truck className="w-4 h-4 text-brand-500 shrink-0" />
                <span>Islandwide delivery in 1-3 working days. Pay cash when package arrives at your doorstep!</span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 py-3.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-75"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving Lead & Opening WhatsApp...
                  </span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Confirm Order via WhatsApp (ඇණවුම තහවුරු කරන්න)</span>
                  </>
                )}
              </button>
          </form>
        )}
      </div>
    </div>
  );
}
