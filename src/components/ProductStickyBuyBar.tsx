import React from 'react';
import { Zap, ShoppingBag } from 'lucide-react';
import { addToCart, openCheckoutModal } from '../utils/cartStore';
import type { Product } from '../types';

interface ProductStickyBuyBarProps {
  product: Product;
}

export default function ProductStickyBuyBar({ product }: ProductStickyBuyBarProps) {
  const handleOrderNow = () => {
    openCheckoutModal({
      items: [
        {
          id: product.id,
          title: product.title,
          price: product.price,
          quantity: 1,
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
      image: product.featuredImage,
      brand: product.brand,
      maxOrderQuantity: product.maxOrderQuantity || 3,
    });
  };

  return (
    <div className="flex items-center gap-2 shrink-0">
      <button
        onClick={handleAddToCart}
        type="button"
        className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer border border-slate-200 shadow-sm"
      >
        <ShoppingBag className="w-3.5 h-3.5" />
        <span>Add to Cart</span>
      </button>

      <button
        onClick={handleOrderNow}
        type="button"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs sm:text-sm shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
      >
        <Zap className="w-3.5 h-3.5 fill-current" />
        <span>Order Now</span>
      </button>
    </div>
  );
}
