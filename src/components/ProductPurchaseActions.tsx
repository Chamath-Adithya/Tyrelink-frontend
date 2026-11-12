import React, { useState } from 'react';
import { Zap, ShoppingBag, Check, ShieldCheck, Truck, MessageCircle, Minus, Plus } from 'lucide-react';
import { addToCart, openCheckoutModal } from '../utils/cartStore';
import type { Product } from '../types';

interface ProductPurchaseActionsProps {
  product: Product;
}

export default function ProductPurchaseActions({ product }: ProductPurchaseActionsProps) {
  const [added, setAdded] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const maxLimit = product.maxOrderQuantity && product.maxOrderQuantity > 0 ? product.maxOrderQuantity : 3;

  const handleOrderNow = () => {
    openCheckoutModal({
      items: [
        {
          id: product.id,
          title: product.title,
          price: product.price,
          quantity: Math.min(quantity, maxLimit),
          image: product.featuredImage,
        },
      ],
    });
  };

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      slug: product.slug,
      title: product.title,
      price: product.price,
      quantity: Math.min(quantity, maxLimit),
      image: product.featuredImage,
      brand: product.brand,
      maxOrderQuantity: maxLimit,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const whatsappInquiryUrl = `https://wa.me/94783724920?text=${encodeURIComponent(
    `Hi Tyrelink, I would like to inquire about: ${product.title} (Rs. ${product.price.toLocaleString('en-US')})`
  )}`;

  return (
    <div className="space-y-3.5">
      {/* WhatsApp Product Fitment & Assistance Banner */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-3 border border-slate-800 shadow-md">
        <div className="flex items-center gap-3 text-left w-full sm:w-auto">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 text-emerald-400">
            <MessageCircle className="w-5 h-5 fill-current/20" />
          </div>
          <p className="text-xs text-slate-300 font-medium leading-snug">
            Direct assistance & fitment confirmation available 7 days a week via WhatsApp.
          </p>
        </div>
        <a
          href={whatsappInquiryUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-bold transition-all shadow-md hover:scale-105 active:scale-95 shrink-0"
        >
          <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
          </svg>
          <span>Chat via WhatsApp</span>
        </a>
      </div>

      {/* Quantity Selector Bar with Max Limit Enforcement */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 px-5 sm:px-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm font-bold text-slate-800">Quantity (ප්‍රමාණය):</span>
          <span className="text-[11px] text-slate-500 font-mono">
            Rs. {(product.price * quantity).toLocaleString('en-US')}
          </span>
          {quantity >= maxLimit && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              Max limit: {maxLimit}
            </span>
          )}
        </div>

        <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50/80 overflow-hidden shadow-2xs self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            aria-label="Decrease quantity"
            className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="w-9 text-center text-xs sm:text-sm font-bold text-slate-900 font-mono select-none">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(maxLimit, q + 1))}
            disabled={quantity >= maxLimit}
            aria-label="Increase quantity"
            className="w-8 h-8 flex items-center justify-center text-brand-600 hover:bg-brand-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Primary & Secondary Dual Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* 1. Order Now (Direct Checkout) */}
        <button
          onClick={handleOrderNow}
          type="button"
          className="w-full flex items-center justify-center gap-2.5 py-4 px-6 rounded-2xl bg-gradient-to-r from-brand-600 via-brand-500 to-red-600 hover:from-brand-500 hover:to-red-500 text-white font-extrabold text-sm sm:text-base shadow-lg shadow-brand-500/20 transition-all hover:scale-[1.02] active:scale-98 cursor-pointer"
        >
          <Zap className="w-5 h-5 fill-current" />
          <span>Order Now (ඇණවුම් කරන්න)</span>
        </button>

        {/* 2. Add to Cart */}
        <button
          onClick={handleAddToCart}
          type="button"
          className="w-full flex items-center justify-center gap-2.5 py-4 px-6 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm sm:text-base border border-slate-200 hover:border-brand-500 shadow-sm transition-all hover:scale-[1.02] active:scale-98 cursor-pointer"
        >
          {added ? (
            <>
              <Check className="w-5 h-5 text-emerald-600 stroke-[3]" />
              <span className="text-emerald-700 font-extrabold">Added to Cart!</span>
            </>
          ) : (
            <>
              <ShoppingBag className="w-5 h-5 text-slate-600" />
              <span>Add to Cart (බාස්කට් එකට)</span>
            </>
          )}
        </button>
      </div>

      {/* Trust & Guarantee Strip */}
      <div className="flex items-center justify-center gap-6 text-xs text-slate-500 pt-1 font-semibold">
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          Official Warranty
        </span>
        <span className="text-slate-300">•</span>
        <span className="inline-flex items-center gap-1.5">
          <Truck className="w-4 h-4 text-brand-500" />
          Pay on Delivery
        </span>
        <span className="text-slate-300">•</span>
        <span className="inline-flex items-center gap-1.5 text-slate-500">
          Islandwide Fast Dispatch
        </span>
      </div>
    </div>
  );
}
