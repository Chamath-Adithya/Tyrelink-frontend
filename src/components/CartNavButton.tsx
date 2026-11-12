import React, { useState, useEffect } from 'react';
import { ShoppingBag } from 'lucide-react';
import { getCart, getCartCount, openCartDrawer, type CartItem } from '../utils/cartStore';

export default function CartNavButton() {
  const [count, setCount] = useState(0);
  const [bump, setBump] = useState(false);

  useEffect(() => {
    // Initial read from localStorage
    setCount(getCartCount());

    const handleCartUpdated = (e: CustomEvent<CartItem[]>) => {
      const newCount = getCartCount(e.detail);
      setCount(newCount);
      setBump(true);
      setTimeout(() => setBump(false), 300);
    };

    window.addEventListener('tyrelink:cart-updated', handleCartUpdated as EventListener);
    return () => {
      window.removeEventListener('tyrelink:cart-updated', handleCartUpdated as EventListener);
    };
  }, []);

  return (
    <button
      onClick={openCartDrawer}
      type="button"
      className="relative flex items-center gap-2 p-2.5 sm:px-3.5 sm:py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 transition-all border border-slate-200/80 hover:border-brand-500/40 shadow-2xs group cursor-pointer"
      aria-label="View Shopping Cart"
    >
      <div className={`relative ${bump ? 'scale-125 transition-transform duration-200' : ''}`}>
        <ShoppingBag className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-slate-700 group-hover:text-brand-600 transition-colors" />
        
        {count > 0 && (
          <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 rounded-full bg-brand-500 text-white font-black text-[9px] font-mono flex items-center justify-center shadow-sm animate-in zoom-in-50 duration-200">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </div>

      <span className="hidden sm:inline text-xs font-bold font-sans">
        Cart {count > 0 && <span className="font-mono text-brand-600">({count})</span>}
      </span>
    </button>
  );
}
