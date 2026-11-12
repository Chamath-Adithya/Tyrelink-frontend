import React, { useState, useEffect } from 'react';
import type { Product } from '../types';
import { getLiveProducts, ADMIN_EVENT_PRODUCTS } from '../utils/adminStore';

interface ProductKokoBannerProps {
  product: Product;
}

export default function ProductKokoBanner({ product: initialProduct }: ProductKokoBannerProps) {
  const [product, setProduct] = useState<Product>(initialProduct);

  useEffect(() => {
    const syncProduct = () => {
      if (typeof window !== 'undefined') {
        const liveList = getLiveProducts();
        const current = liveList.find((p) => p.id === initialProduct.id || p.slug === initialProduct.slug);
        if (current) {
          setProduct(current);
        }
      }
    };

    syncProduct();

    const handleUpdate = (e: any) => {
      if (Array.isArray(e.detail)) {
        const current = e.detail.find((p: any) => p.id === initialProduct.id || p.slug === initialProduct.slug);
        if (current) {
          setProduct(current);
        }
      }
    };

    window.addEventListener(ADMIN_EVENT_PRODUCTS, handleUpdate);
    return () => window.removeEventListener(ADMIN_EVENT_PRODUCTS, handleUpdate);
  }, [initialProduct.id, initialProduct.slug]);

  // Koko Calculations
  const kokoCount = product.kokoInstallmentCount || product.installmentCount || 3;
  const kokoAmount = product.kokoInstallmentAmount || product.installmentAmount || Math.round(product.price / kokoCount);

  // PayZy Calculations
  const payzyCount = product.payzyInstallmentCount || 4;
  const payzyAmount = product.payzyInstallmentAmount || Math.round(product.price / payzyCount);

  return (
      <div className="w-full p-4 sm:p-4.5 rounded-2xl bg-gradient-to-r from-red-50/60 via-white to-sky-50/60 backdrop-blur-md border border-slate-200/90 shadow-2xs space-y-3">
        {/* Row 1: Koko Pay */}
        <div className="flex items-center justify-between text-xs sm:text-[13px] text-slate-700 font-medium flex-wrap gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span>or {kokoCount} X</span>
            <span className="font-mono font-black text-slate-900 text-sm">Rs.{kokoAmount.toLocaleString('en-US')}</span>
            <span className="text-slate-500">with</span>
            <a
              href="https://paykoko.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 group/koko cursor-pointer hover:opacity-85 transition-opacity"
              title="Visit Koko Pay website (paykoko.com - opens in new tab)"
            >
              <img
                src="/images/payments/koko-logo.png"
                alt="Koko Pay"
                className="h-4 sm:h-5 max-h-[20px] w-auto object-contain inline-block"
                style={{ height: '18px', maxWidth: '70px', objectFit: 'contain' }}
              />
              <span className="w-3.5 h-3.5 rounded-full bg-slate-800 text-white flex items-center justify-center text-[9px] font-bold font-serif group-hover/koko:bg-brand-500 transition-colors shadow-2xs">
                i
              </span>
            </a>
          </div>
            <span className="text-[10px] text-brand-600 font-bold uppercase tracking-wider bg-red-100/70 px-2 py-0.5 rounded-full border border-red-200/50">
              0% Interest
            </span>
        </div>

        {/* Divider */}
        <div className="h-px bg-slate-200/80 w-full" />

        {/* Row 2: PayZy */}
        <div className="flex items-center justify-between text-xs sm:text-[13px] text-slate-700 font-medium flex-wrap gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span>or up to {payzyCount} X</span>
            <span className="font-mono font-black text-slate-900 text-sm">Rs.{payzyAmount.toLocaleString('en-US')}</span>
            <span className="text-slate-500">with</span>
            <a
              href="https://payzy.lk/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 group/payzy cursor-pointer hover:opacity-85 transition-opacity"
              title="Visit PayZy website (payzy.lk - opens in new tab)"
            >
              <img
                src="/images/payments/payzy-logo.png"
                alt="PayZy"
                className="h-4 sm:h-5 max-h-[20px] w-auto object-contain inline-block"
                style={{ height: '18px', maxWidth: '70px', objectFit: 'contain' }}
              />
              <span className="w-3.5 h-3.5 rounded-full bg-slate-800 text-white flex items-center justify-center text-[9px] font-bold font-serif group-hover/payzy:bg-sky-500 transition-colors shadow-2xs">
                i
              </span>
            </a>
          </div>
          <span className="text-[10px] text-sky-700 font-bold uppercase tracking-wider bg-sky-100/70 px-2 py-0.5 rounded-full border border-sky-200/50">
            Flexible BNPL
          </span>
        </div>
      </div>
      );
}
