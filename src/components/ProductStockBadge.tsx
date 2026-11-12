import React, { useState, useEffect } from 'react';
import type { Product } from '../types';
import { getLiveProducts, ADMIN_EVENT_PRODUCTS } from '../utils/adminStore';

interface ProductStockBadgeProps {
  product: Product;
}

export default function ProductStockBadge({ product: initialProduct }: ProductStockBadgeProps) {
  const [inStock, setInStock] = useState<boolean>(initialProduct.inStock !== false);

  useEffect(() => {
    const syncStock = () => {
      if (typeof window !== 'undefined') {
        const liveList = getLiveProducts();
        const current = liveList.find((p) => p.id === initialProduct.id || p.slug === initialProduct.slug);
        if (current && typeof current.inStock === 'boolean') {
          setInStock(current.inStock);
        }
      }
    };

    syncStock();

    const handleUpdate = (e: any) => {
      if (Array.isArray(e.detail)) {
        const current = e.detail.find((p: any) => p.id === initialProduct.id || p.slug === initialProduct.slug);
        if (current && typeof current.inStock === 'boolean') {
          setInStock(current.inStock);
        }
      }
    };

    window.addEventListener(ADMIN_EVENT_PRODUCTS, handleUpdate);
    return () => window.removeEventListener(ADMIN_EVENT_PRODUCTS, handleUpdate);
  }, [initialProduct.id, initialProduct.slug]);

  return (
    <div className="flex items-center gap-2">
      {inStock ? (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          In Stock (තොග ඇත)
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200/80 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-rose-500"></span>
          Out of Stock (තොග අවසන්)
        </span>
      )}
    </div>
  );
}
