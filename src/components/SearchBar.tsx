import React, { useState, useEffect, useRef } from 'react';
import Fuse from 'fuse.js';
import { Search, X, Sparkles, ArrowUpRight } from 'lucide-react';
import productsData from '../data/products.json';
import type { Product } from '../types';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Configure Fuse with Singlish / Typo tolerance
  const fuse = new Fuse((productsData as unknown) as Product[], {
    keys: [
      { name: 'title', weight: 0.4 },
      { name: 'sinhalaTitle', weight: 0.35 },
      { name: 'brand', weight: 0.25 },
      { name: 'category', weight: 0.25 },
      { name: 'shortDescription', weight: 0.15 },
    ],
    threshold: 0.6,
    distance: 100,
    ignoreLocation: true,
    minMatchCharLength: 2,
  });

  // Handle outside click & keyboard shortcuts
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
        if (query.trim().length >= 2) setIsOpen(true);
      }
      if (event.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [query]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (value.trim().length >= 2) {
      const searchResults = fuse.search(value.trim()).slice(0, 5).map(res => res.item);
      setResults(searchResults);
      setIsOpen(true);
    } else {
      setResults([]);
      setIsOpen(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      window.location.href = `/shop?q=${encodeURIComponent(query.trim())}`;
    }
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <form onSubmit={handleFormSubmit} className="relative flex items-center group">
        <button
          type="submit"
          className="absolute left-3.5 text-slate-400 group-focus-within:text-brand-500 hover:text-brand-600 transition-colors"
          aria-label="Search"
        >
          <Search className="h-4 w-4" />
        </button>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleSearchChange}
          onFocus={() => {
            if (query.trim().length >= 2) setIsOpen(true);
          }}
          placeholder="Search tyres, sizes, brands, tools..."
          className="w-full h-11 pl-10 pr-10 sm:pr-20 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-all shadow-2xs"
        />

        <div className="absolute right-2.5 flex items-center gap-1">
          {query ? (
            <button
              type="button"
              onClick={clearSearch}
              className="p-1 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200 transition-colors"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-slate-400 bg-white border border-slate-200 rounded-md shadow-2xs pointer-events-none">
              <span className="text-[9px]">⌘</span>K
            </kbd>
          )}
        </div>
      </form>

      {/* Live Dropdown Results with Auto-Navigation */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-card border border-slate-200/90 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-left">
          {results.length > 0 ? (
            <div className="py-2">
              <div className="px-4 py-2 flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3 text-brand-500" /> Matches ({results.length})
                </span>
                <span className="text-[10px] text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full font-bold">Press Enter for Shop Page</span>
              </div>

              <div className="divide-y divide-slate-100 max-h-[360px] overflow-y-auto">
                {results.map((product) => (
                  <a
                    key={product.id}
                    href={`/product/${product.slug}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-red-50/50 transition-colors group"
                    onClick={() => setIsOpen(false)}
                  >
                    <img
                      src={product.featuredImage}
                      alt={product.title}
                      className="w-12 h-12 rounded-xl object-contain border border-slate-200/80 group-hover:scale-105 transition-transform shrink-0 bg-slate-50 p-1"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-slate-800 truncate group-hover:text-brand-600 transition-colors">
                        {product.title}
                      </p>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="text-xs font-black text-slate-900 font-display">
                          Rs. {product.price.toLocaleString('en-US')}
                        </span>
                        {product.originalPrice && (
                          <span className="text-[10px] text-slate-400 line-through font-mono">
                            Rs. {product.originalPrice.toLocaleString('en-US')}
                          </span>
                        )}
                      </div>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-slate-300 group-hover:text-brand-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
                  </a>
                ))}
              </div>

              <div className="p-2.5 border-t border-slate-100 bg-slate-50/70 text-center">
                <a
                  href={`/shop?q=${encodeURIComponent(query)}`}
                  className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center justify-center gap-1"
                >
                  <span>View full results for "{query}" on Shop tyres & tools Page →</span>
                </a>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center">
              <p className="text-xs sm:text-sm font-semibold text-slate-700">
                No exact matches for <span className="font-bold text-slate-900">"{query}"</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Press Enter to search full catalog or browse all categories.
              </p>
              <a
                href={`/shop?q=${encodeURIComponent(query)}`}
                className="inline-block mt-3 px-4 py-2 text-xs font-bold bg-brand-500 hover:bg-brand-600 text-white rounded-xl shadow-glow-sm transition-all"
                onClick={() => setIsOpen(false)}
              >
                Search in Shop tyres & tools
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
