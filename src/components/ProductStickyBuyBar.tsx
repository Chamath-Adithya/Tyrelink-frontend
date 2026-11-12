import React, { useState, useEffect } from 'react';
import { Zap, ShoppingBag, MessageCircle } from 'lucide-react';
import { addToCart, openCheckoutModal } from '../utils/cartStore';
import { getLiveProducts, ADMIN_EVENT_PRODUCTS } from '../utils/adminStore';
import type { Product } from '../types';

interface ProductStickyBuyBarProps {
  product: Product;
}

export default function ProductStickyBuyBar({ product }: ProductStickyBuyBarProps) {
  const [inStock, setInStock] = useState<boolean>(product.inStock !== false);

  useEffect(() => {
    const sync = () => {
      if (typeof window !== 'undefined') {
        const liveList = getLiveProducts();
        const found = liveList.find((p) => p.id === product.id || p.slug === product.slug);
        if (found && typeof found.inStock === 'boolean') {
          setInStock(found.inStock);
        }
      }
    };
    sync();

    const handleUpdate = (e: any) => {
      if (Array.isArray(e.detail)) {
        const found = e.detail.find((p: any) => p.id === product.id || p.slug === product.slug);
        if (found && typeof found.inStock === 'boolean') {
          setInStock(found.inStock);
        }
      }
    };

    window.addEventListener(ADMIN_EVENT_PRODUCTS, handleUpdate);
    return () => window.removeEventListener(ADMIN_EVENT_PRODUCTS, handleUpdate);
  }, [product.id, product.slug]);

  const isAvailable = inStock;

  const handleOrderNow = () => {
    if (!isAvailable) return;
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
    if (!isAvailable) return;
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

  if (!isAvailable) {
    return (
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs font-bold text-rose-500 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200">
          Out of Stock
        </span>
        <a
          href={`https://wa.me/94783724920?text=${encodeURIComponent(
            `Hi Tyrelink, I noticed "${product.title}" is Out of Stock. When will new stock arrive?`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#25D366] text-white font-bold text-xs shadow-sm hover:scale-105 active:scale-95 transition-all"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>Notify Me</span>
        </a>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 shrink-0">
      <button
        onClick={handleAddToCart}
        type="button"
        className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/80 hover:bg-white text-slate-700 font-bold text-xs transition-colors cursor-pointer border border-slate-200/80 shadow-2xs backdrop-blur-md"
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
