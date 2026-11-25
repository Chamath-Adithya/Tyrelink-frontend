import Fuse from 'fuse.js';
import type { Product } from '../types';

/**
 * Strips separators and radial markers so queries like "1956515" or "195 65 r15"
 * match "195/65 R15" deterministically in O(1) per item.
 */
export function normalizeTyreCode(raw: string): string {
  return raw.toLowerCase().replace(/[^a-z0-9]/g, '').replace(/r(?=\d{2}$)/, '');
}

export interface SearchIndex {
  search: (query: string, limit?: number) => Product[];
}

export function buildProductSearchIndex(products: Product[]): SearchIndex {
  const prepared = products.map((p) => {
    const sizeRaw = String((p as any).size || p.specs?.['Size'] || '');
    const textHaystack = `${p.title} ${p.sinhalaTitle || ''} ${p.brand} ${sizeRaw} ${p.category} ${p.shortDescription || ''}`.toLowerCase();
    const compactCode = normalizeTyreCode(`${p.title} ${sizeRaw} ${(p as any).sku || ''}`);
    return { product: p, textHaystack, compactCode };
  });

  const fuse = new Fuse(products, {
    keys: [
      { name: 'title', weight: 0.4 },
      { name: 'sinhalaTitle', weight: 0.25 },
      { name: 'brand', weight: 0.2 },
      { name: 'category', weight: 0.1 },
      { name: 'shortDescription', weight: 0.05 },
    ],
    threshold: 0.38,
    distance: 80,
    ignoreLocation: true,
    minMatchCharLength: 2,
  });

  return {
    search(rawQuery: string, limit = 6): Product[] {
      const trimmed = rawQuery.trim();
      if (trimmed.length < 2) return [];

      const qLower = trimmed.toLowerCase();
      const qCode = normalizeTyreCode(trimmed);
      const scored = new Map<string, { product: Product; score: number }>();

      for (const item of prepared) {
        let bonus = 0;
        if (qCode.length >= 4 && item.compactCode.includes(qCode)) {
          bonus += 100;
        }
        if (item.textHaystack.includes(qLower)) {
          bonus += 60;
        }
        if (bonus > 0) {
          scored.set(item.product.id, { product: item.product, score: bonus });
        }
      }

      const fuseHits = fuse.search(trimmed);
      for (const hit of fuseHits) {
        const prev = scored.get(hit.item.id);
        const fScore = 40;
        if (prev) {
          prev.score += fScore;
        } else {
          scored.set(hit.item.id, { product: hit.item, score: fScore });
        }
      }

      return Array.from(scored.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map((x) => x.product);
    },
  };
}

