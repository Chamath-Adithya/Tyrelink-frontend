import React, { useState, useEffect, useMemo, useRef } from 'react';
import Fuse from 'fuse.js';
import {
  Search,
  SlidersHorizontal,
  X,
  ArrowUpDown,
  ShieldCheck,
  Flame,
  Zap,
  ArrowRight,
  RotateCcw,
  ChevronDown,
  Check,
  PackagePlus,
  Loader2
} from 'lucide-react';
import productsData from '../data/products.json';
import categoriesData from '../data/categories.json';
import ProductCardSkeleton from './ProductCardSkeleton';
import type { Product } from '../types';
import { getLiveProducts, ADMIN_EVENT_PRODUCTS } from '../utils/adminStore';
import { fetchProducts } from '../services/productService';

interface ProductCatalogFilterProps {
  initialCategory?: string;
  initialQuery?: string;
}

const BATCH_SIZE = 10;

const sortOptions = [
  { id: 'featured', label: 'Featured Tyres & Tools', shortLabel: 'Featured', desc: 'Curated top-performing tyre models' },
  { id: 'price-asc', label: 'Price: Low to High', shortLabel: 'Price: Low-High', desc: 'Budget-friendly first (Rs. ↑)' },
  { id: 'price-desc', label: 'Price: High to Low', shortLabel: 'Price: High-Low', desc: 'Premium & commercial grade (Rs. ↓)' },
  { id: 'discount', label: 'Biggest Hot Deal Discount', shortLabel: 'Top Deals', desc: 'Highest savings percentage' },
];

export default function ProductCatalogFilter({
  initialCategory = 'all',
  initialQuery = ''
}: ProductCatalogFilterProps) {
  // Filter States
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 300000]);
  const [minInputStr, setMinInputStr] = useState<string>('0');
  const [maxInputStr, setMaxInputStr] = useState<string>('300000');
  const [sortBy, setSortBy] = useState<string>('featured');
  const [isSortOpen, setIsSortOpen] = useState<boolean>(false);
  const [isPriceOpen, setIsPriceOpen] = useState<boolean>(false);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [flashOnly, setFlashOnly] = useState<boolean>(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState<boolean>(false);

  // Live Products State (Synced with Go Backend API & local store)
  const [products, setProducts] = useState<Product[]>(() => {
    if (typeof window !== 'undefined') return getLiveProducts();
    return (productsData as unknown) as Product[];
  });

  useEffect(() => {
    // 1. Fetch from Go Backend API
    fetchProducts().then((res) => {
      if (Array.isArray(res.products) && res.products.length > 0) {
        setProducts(res.products);
      }
    });

    // 2. Listen to admin updates in real time
    const handleUpdate = (e: any) => {
      if (Array.isArray(e.detail) && e.detail.length > 0) {
        setProducts(e.detail);
      }
    };

    window.addEventListener(ADMIN_EVENT_PRODUCTS, handleUpdate);
    return () => window.removeEventListener(ADMIN_EVENT_PRODUCTS, handleUpdate);
  }, []);

  // Progressive Batch Loading States
  const [visibleCount, setVisibleCount] = useState<number>(BATCH_SIZE);
  const [isLoadingBatch, setIsLoadingBatch] = useState<boolean>(false);

  // Compact Sticky Floating Bar on Scroll
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState<boolean>(false);

  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const priceDropdownRef = useRef<HTMLDivElement>(null);
  const categoryMenuRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Track window scroll position to contract sticky bar (Desktop md: and above only)
  useEffect(() => {
    const handleScroll = () => {
      const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;
      const scrolled = isDesktop && window.scrollY > 120;
      setIsScrolled(scrolled);
      if (!scrolled) {
        setIsCategoryMenuOpen(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
      if (priceDropdownRef.current && !priceDropdownRef.current.contains(event.target as Node)) {
        setIsPriceOpen(false);
      }
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(event.target as Node)) {
        setIsCategoryMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Read URL query parameters on initial client mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const q = params.get('q');
      const cat = params.get('category');
      const brand = params.get('brand');
      const minP = params.get('minPrice');
      const maxP = params.get('maxPrice');
      const sort = params.get('sort');

      if (q) setSearchQuery(q);
      if (cat) setSelectedCategory(cat);
      if (brand) setSelectedBrands(brand.split(','));
      if (minP || maxP) {
        const parsedMin = minP ? Math.max(0, parseInt(minP, 10) || 0) : 0;
        const parsedMax = maxP ? Math.max(parsedMin, parseInt(maxP, 10) || 300000) : 300000;
        setPriceRange([parsedMin, parsedMax]);
        setMinInputStr(parsedMin.toString());
        setMaxInputStr(parsedMax.toString());
      }
      if (sort) setSortBy(sort);

      // Smooth auto-scroll if redirected with #catalog-products hash
      if (window.location.hash === '#catalog-products') {
        setTimeout(() => {
          const el = document.getElementById('catalog-products');
          if (el) {
            const headerOffset = 135;
            const elementPosition = el.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            window.scrollTo({
              top: Math.max(0, offsetPosition),
              behavior: 'smooth'
            });
          }
        }, 220);
      }
    }
  }, []);

  // Sync state to URL for bookmarkability
  const updateUrlParams = () => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set('q', searchQuery.trim());
      if (selectedCategory !== 'all') params.set('category', selectedCategory);
      if (selectedBrands.length > 0) params.set('brand', selectedBrands.join(','));
      if (priceRange[0] > 0) params.set('minPrice', priceRange[0].toString());
      if (priceRange[1] < 300000) params.set('maxPrice', priceRange[1].toString());
      if (sortBy !== 'featured') params.set('sort', sortBy);

      const hash = window.location.hash || '';
      const queryString = params.toString() ? `?${params.toString()}` : '';
      const newUrl = `${window.location.pathname}${queryString}${hash}`;
      window.history.replaceState({}, '', newUrl);
    }
  };

  useEffect(() => {
    updateUrlParams();
    // Reset visible count to first batch on any filter alteration
    setVisibleCount(BATCH_SIZE);
  }, [searchQuery, selectedCategory, selectedBrands, priceRange, sortBy, inStockOnly, flashOnly]);

  // Extract all distinct available brands with item counts (O(N) indexed once)
  const allBrandsWithCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p) => {
      counts[p.brand] = (counts[p.brand] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [products]);

  // Setup Fuse.js for typo-tolerant Singlish search
  const fuse = useMemo(() => {
    return new Fuse(products, {
      keys: [
        { name: 'title', weight: 0.4 },
        { name: 'sinhalaTitle', weight: 0.35 },
        { name: 'brand', weight: 0.25 },
        { name: 'category', weight: 0.25 },
        { name: 'shortDescription', weight: 0.15 },
      ],
      threshold: 0.6,
      ignoreLocation: true,
    });
  }, [products]);

  // Handlers for Price Range & Numerical Inputs with Strict Validation
  const handleMinInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = e.target.value.replace(/[^0-9]/g, '');
    setMinInputStr(sanitized);

    const val = sanitized === '' ? 0 : parseInt(sanitized, 10);
    if (!isNaN(val) && val >= 0) {
      setPriceRange([val, Math.max(val, priceRange[1])]);
    }
  };

  const handleMaxInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = e.target.value.replace(/[^0-9]/g, '');
    setMaxInputStr(sanitized);

    const val = sanitized === '' ? 300000 : parseInt(sanitized, 10);
    if (!isNaN(val) && val >= 0) {
      setPriceRange([Math.min(val, priceRange[0]), val]);
    }
  };

  const handleMinSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    const newMin = Math.min(val, priceRange[1]);
    setPriceRange([newMin, priceRange[1]]);
    setMinInputStr(newMin.toString());
  };

  const handleMaxSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    const newMax = Math.max(val, priceRange[0]);
    setPriceRange([priceRange[0], newMax]);
    setMaxInputStr(newMax.toString());
  };

  const setPricePreset = (min: number, max: number) => {
    setPriceRange([min, max]);
    setMinInputStr(min.toString());
    setMaxInputStr(max.toString());
  };

  // Filter & Sort Pipeline (Optimized Single-Pass Pipeline)
  const filteredProducts = useMemo(() => {
    let list: Product[] = [...products];

    // 1. Full-text / Singlish fuzzy search
    if (searchQuery.trim().length >= 2) {
      list = fuse.search(searchQuery.trim()).map(res => res.item);
    }

    // 2. Category filter
    if (selectedCategory && selectedCategory !== 'all') {
      list = list.filter(p => p.category === selectedCategory);
    }

    // 3. Brand filter
    if (selectedBrands.length > 0) {
      list = list.filter(p => selectedBrands.includes(p.brand));
    }

    // 4. Price range filter
    list = list.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);

    // 5. Stock & Flash deals toggles
    if (inStockOnly) {
      list = list.filter(p => p.inStock !== false && (p.stockCount === undefined || p.stockCount > 0));
    }
    if (flashOnly) {
      list = list.filter(p => p.isFlashDeal);
    }

    // 6. Sorting
    const sorted = [...list];
    switch (sortBy) {
      case 'price-asc':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'discount':
        sorted.sort((a, b) => (b.flashDealDiscount || 0) - (a.flashDealDiscount || 0));
        break;
      case 'featured':
      default:
        sorted.sort((a, b) => (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0));
        break;
    }

    return sorted;
  }, [products, searchQuery, selectedCategory, selectedBrands, priceRange, sortBy, inStockOnly, flashOnly, fuse]);

  // Sliced Visible Products for Progressive Step-by-Step Batch Loading
  const visibleProducts = useMemo(() => {
    return filteredProducts.slice(0, visibleCount);
  }, [filteredProducts, visibleCount]);

  // Pre-compute BNPL monthly installment prices in one pass — avoids N Math.round calls per render
  const bnplMap = useMemo(() => {
    const map: Record<string, { kokoCount: number; kokoAmount: number; payzyCount: number; payzyAmount: number }> = {};
    filteredProducts.forEach(p => {
      const kokoCount = p.kokoInstallmentCount || p.installmentCount || 3;
      const kokoAmount = p.kokoInstallmentAmount || p.installmentAmount || Math.round(p.price / kokoCount);
      const payzyCount = p.payzyInstallmentCount || 4;
      const payzyAmount = p.payzyInstallmentAmount || Math.round(p.price / payzyCount);
      map[p.id] = { kokoCount, kokoAmount, payzyCount, payzyAmount };
    });
    return map;
  }, [filteredProducts]);

  const hasMore = visibleCount < filteredProducts.length;

  // IntersectionObserver Sentinel for Progressive Smooth Infinite Loading
  useEffect(() => {
    if (!hasMore || isLoadingBatch) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsLoadingBatch(true);
          setTimeout(() => {
            setVisibleCount((prev) => Math.min(prev + BATCH_SIZE, filteredProducts.length));
            setIsLoadingBatch(false);
          }, 300); // Shimmer preview duration
        }
      },
      { rootMargin: '250px' }
    );

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoadingBatch, filteredProducts.length]);

  const handleManualLoadMore = () => {
    setIsLoadingBatch(true);
    setTimeout(() => {
      setVisibleCount((prev) => Math.min(prev + BATCH_SIZE, filteredProducts.length));
      setIsLoadingBatch(false);
    }, 250);
  };

  const activeSortOption = sortOptions.find(opt => opt.id === sortBy) || sortOptions[0];

  // Toggle brand selection
  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev =>
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    );
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedBrands([]);
    setPriceRange([0, 300000]);
    setMinInputStr('0');
    setMaxInputStr('300000');
    setSortBy('featured');
    setInStockOnly(false);
    setFlashOnly(false);
    setVisibleCount(BATCH_SIZE);
  };

  const isPriceFiltered = priceRange[0] > 0 || priceRange[1] < 300000;

  const hasActiveFilters = searchQuery.trim() !== '' ||
    selectedCategory !== 'all' ||
    selectedBrands.length > 0 ||
    isPriceFiltered ||
    inStockOnly ||
    flashOnly;

  const currentCategoryInfo = categoriesData.find(c => c.id === selectedCategory);
  const currentCategoryName = selectedCategory === 'all'
    ? 'Shop tyres & tools'
    : (currentCategoryInfo ? currentCategoryInfo.name : selectedCategory);

  return (
    <div className="w-full space-y-8">

      {/* Top Search & Filter Bar - Sticky on Desktop, Natural Flow on Mobile */}
      <div
        className={`relative md:sticky md:top-[112px] z-30 transition-all duration-300 ease-out text-left border ${isScrolled
              ? 'bg-white/95 backdrop-blur-2xl rounded-2xl md:rounded-full py-2.5 px-4 shadow-[0_16px_36px_-10px_rgba(0,0,0,0.14),0_0_0_1px_rgba(237,28,36,0.18)] border-brand-500/25 space-y-0'
              : 'bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-[2rem] p-3.5 sm:p-5 shadow-[0_12px_36px_-6px_rgba(0,0,0,0.08),0_2px_8px_-2px_rgba(0,0,0,0.04)] border-slate-200/80 space-y-3 sm:space-y-3.5'
        }`}
      >
        <div className={`flex items-center justify-between gap-2 sm:gap-3 transition-all ${isScrolled ? 'flex-row' : 'flex-col md:flex-row items-stretch md:items-center'}`}>

          {/* Real-time Search Input */}
          <div className="relative flex-1 min-w-0">
            <Search className={`absolute left-3.5 sm:left-4 text-slate-400 transition-all pointer-events-none ${isScrolled ? 'top-2.5 sm:top-3 h-3.5 w-3.5' : 'top-3 sm:top-3.5 h-4 w-4'}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isScrolled ? "Search tyres, sizes, brands, tools..." : "Search tyres, tyre sizes, brands, tools..."}
              className={`w-full pl-9 sm:pl-11 pr-8 sm:pr-10 text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:bg-white transition-all shadow-2xs ${isScrolled
                  ? 'h-9 sm:h-10 rounded-full bg-slate-100/90 border-0'
                  : 'h-11 sm:h-12 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-200/70'
                }`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className={`absolute right-2.5 sm:right-3.5 text-slate-400 hover:text-slate-700 cursor-pointer ${isScrolled ? 'top-2 sm:top-2.5 p-0.5' : 'top-3 sm:top-3.5 p-0.5'}`}
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            )}
          </div>

          {/* Luxury Filter Controls: Compact Category Switcher + Budget + Custom Sort By */}
          <div className={isScrolled ? 'flex items-center gap-1.5 sm:gap-2.5 shrink-0' : 'grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-2.5 shrink-0 w-full sm:w-auto'}>

            {/* Compact Category Switcher (Visible only when scrolled on desktop) */}
            {isScrolled && (
              <div ref={categoryMenuRef} className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setIsCategoryMenuOpen(!isCategoryMenuOpen)}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-xs font-extrabold bg-gradient-to-r from-brand-50 to-red-50 text-brand-700 border border-brand-200/80 hover:bg-brand-100/80 transition-all shadow-2xs cursor-pointer group"
                  title="Change Category"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse shrink-0" />
                  <span className="max-w-[75px] sm:max-w-[130px] truncate">{currentCategoryName}</span>
                  <ChevronDown className={`w-3 h-3 text-brand-500 transition-transform duration-200 shrink-0 ${isCategoryMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Floating category popover menu */}
                {isCategoryMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.2)] p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150 border border-slate-100 text-left">
                    <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1 flex items-center justify-between">
                      <span>Select Category</span>
                      <span>{categoriesData.length + 1} categories</span>
                    </div>
                    <div className="max-h-64 overflow-y-auto space-y-0.5 no-scrollbar">
                      <button
                        type="button"
                        onClick={() => { setSelectedCategory('all'); setIsCategoryMenuOpen(false); }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${selectedCategory === 'all'
                            ? 'bg-slate-900 text-white'
                            : 'hover:bg-slate-50 text-slate-700'
                          }`}
                      >
                        <span>Shop tyres & tools</span>
                        <span className="text-[10px] opacity-75 font-mono">({products.length})</span>
                      </button>
                      {categoriesData.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => { setSelectedCategory(cat.id); setIsCategoryMenuOpen(false); }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${selectedCategory === cat.id
                              ? 'bg-brand-500 text-white shadow-sm'
                              : 'hover:bg-slate-50 text-slate-700'
                            }`}
                        >
                          <span>{cat.name}</span>
                          <span className="text-[10px] opacity-75 font-sinhala">{cat.sinhalaName}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {/* Price Budget Filter Dropdown Button */}
            <div ref={priceDropdownRef} className="relative w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setIsPriceOpen(!isPriceOpen)}
                className={`w-full sm:w-auto flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-bold transition-all shadow-2xs group cursor-pointer border ${isScrolled ? 'px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-full' : 'px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl'
                  } ${isPriceFiltered
                      ? 'bg-red-50 text-brand-700 border-brand-500/30'
                      : 'bg-slate-50 hover:bg-slate-100/90 text-slate-900 border-slate-200/70'
                }`}
                aria-expanded={isPriceOpen}
              >
                <SlidersHorizontal className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isPriceFiltered ? 'text-brand-500' : 'text-slate-400 group-hover:text-brand-500'} transition-colors shrink-0`} />
                <span className="text-slate-400 font-semibold hidden md:inline">Budget:</span>
                <span className={`truncate ${isPriceFiltered ? 'text-brand-700 font-black' : 'text-slate-900 font-bold'}`}>
                  {isPriceFiltered
                    ? `Rs. ${(priceRange[0] / 1000).toFixed(0)}K–${(priceRange[1] / 1000).toFixed(0)}K`
                    : 'Budget'}
                </span>
                <ChevronDown className={`w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${isPriceOpen ? 'rotate-180 text-brand-500' : ''}`} />
              </button>

              {/* Luxury Floating Price Budget Card */}
              {isPriceOpen && (
                <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 w-[calc(100vw-2.5rem)] sm:w-96 max-w-sm bg-white rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.2)] p-4 sm:p-6 z-50 animate-in fade-in zoom-in-95 duration-150 border border-slate-100 text-left">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4 text-brand-500" />
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 font-display">
                        Price Budget (LKR)
                      </h3>
                    </div>
                    {isPriceFiltered && (
                      <button
                        type="button"
                        onClick={() => setPricePreset(0, 300000)}
                        className="text-[11px] font-bold text-brand-600 hover:underline cursor-pointer"
                      >
                        Reset
                      </button>
                    )}
                  </div>

                  {/* Numerical Input Boxes */}
                  <div className="grid grid-cols-2 gap-2 text-xs pt-4">
                    <div className="p-2.5 rounded-2xl bg-slate-50 focus-within:bg-white focus-within:shadow-2xs transition-all border border-slate-100">
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">Min Price (Rs.)</label>
                      <div className="flex items-center gap-1 font-mono font-bold text-slate-900">
                        <span className="text-slate-400 text-xs">Rs.</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={minInputStr}
                          onChange={handleMinInputChange}
                          placeholder="0"
                          className="w-full bg-transparent focus:outline-none font-bold text-xs"
                        />
                      </div>
                    </div>

                    <div className="p-2.5 rounded-2xl bg-slate-50 focus-within:bg-white focus-within:shadow-2xs transition-all border border-slate-100">
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">Max Price (Rs.)</label>
                      <div className="flex items-center gap-1 font-mono font-bold text-slate-900">
                        <span className="text-slate-400 text-xs">Rs.</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={maxInputStr}
                          onChange={handleMaxInputChange}
                          placeholder="300000"
                          className="w-full bg-transparent focus:outline-none font-bold text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Single Unified Luxury Dual-Thumb Range Slider */}
                  <div className="space-y-2 pt-4">
                    <div className="relative h-6 flex items-center">
                      <div className="w-full h-2 bg-slate-100 rounded-full" />
                      <div
                        className="absolute h-2 bg-gradient-to-r from-brand-600 to-brand-500 rounded-full shadow-[0_0_8px_rgba(237,28,36,0.3)] pointer-events-none"
                        style={{
                          left: `${(priceRange[0] / 300000) * 100}%`,
                          width: `${Math.max(0, ((priceRange[1] - priceRange[0]) / 300000) * 100)}%`,
                        }}
                      />
                      <input
                        type="range"
                        min="0"
                        max="300000"
                        step="500"
                        value={priceRange[0]}
                        onChange={handleMinSliderChange}
                        className="range-slider-input absolute inset-0 w-full h-2 appearance-none bg-transparent pointer-events-none z-20"
                      />
                      <input
                        type="range"
                        min="0"
                        max="300000"
                        step="1000"
                        value={priceRange[1]}
                        onChange={handleMaxSliderChange}
                        className="range-slider-input absolute inset-0 w-full h-2 appearance-none bg-transparent pointer-events-none z-20"
                      />
                    </div>

                    <div className="flex items-center justify-between text-[9px] font-mono font-semibold text-slate-400">
                      <span>Rs. 0</span>
                      <span>Rs. 150K</span>
                      <span>Rs. 300K</span>
                    </div>
                  </div>

                  {/* Quick Price Preset Chips */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPricePreset(0, 5000)}
                      className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
                    >
                      &lt; Rs. 5K
                    </button>
                    <button
                      type="button"
                      onClick={() => setPricePreset(5000, 25000)}
                      className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
                    >
                      Rs. 5K – 25K
                    </button>
                    <button
                      type="button"
                      onClick={() => setPricePreset(25000, 100000)}
                      className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
                    >
                      Rs. 25K – 100K
                    </button>
                    <button
                      type="button"
                      onClick={() => setPricePreset(100000, 300000)}
                      className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
                    >
                      &gt; Rs. 100K
                    </button>
                  </div>

                  {/* Summary & Apply Button */}
                  <div className="pt-3.5 mt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-600 font-mono">
                      Rs. {priceRange[0].toLocaleString()} – {priceRange[1].toLocaleString()}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsPriceOpen(false)}
                      className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Luxury Custom Sort By Dropdown */}
            <div ref={sortDropdownRef} className="relative w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setIsSortOpen(!isSortOpen)}
                className={`w-full sm:w-auto flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-bold transition-all shadow-2xs group cursor-pointer border ${isScrolled ? 'px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-full' : 'px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl'
                  } ${sortBy !== 'featured'
                      ? 'bg-red-50 text-brand-700 border-brand-500/30'
                      : 'bg-slate-50 hover:bg-slate-100/90 text-slate-900 border-slate-200/70'
                }`}
                aria-expanded={isSortOpen}
              >
                <ArrowUpDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 group-hover:text-brand-500 transition-colors shrink-0" />
                <span className="text-slate-400 font-semibold hidden md:inline">Sort:</span>
                <span className="text-slate-900 font-black truncate">
                  <span className="sm:hidden">{activeSortOption.shortLabel || activeSortOption.label}</span>
                  <span className="hidden sm:inline">{activeSortOption.label}</span>
                </span>
                <ChevronDown className={`w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${isSortOpen ? 'rotate-180 text-brand-500' : ''}`} />
              </button>

              {/* Luxury Floating Menu */}
              {isSortOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 sm:w-72 max-w-[calc(100vw-2.5rem)] bg-white rounded-3xl shadow-[0_20px_50px_-10px_rgba(0,0,0,0.18)] p-2 z-50 animate-in fade-in zoom-in-95 duration-150 border border-slate-100 text-left">
                  <div className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                    Sort Catalog By
                  </div>
                  <div className="p-1 space-y-1">
                    {sortOptions.map((opt) => {
                      const isSelected = sortBy === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setSortBy(opt.id);
                            setIsSortOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-left transition-all ${isSelected
                                ? 'bg-red-50/80 text-brand-700'
                                : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="space-y-0.5 min-w-0 flex-1 pr-2">
                            <span className={`block text-xs truncate ${isSelected ? 'font-bold text-brand-700' : 'font-semibold text-slate-800'}`}>
                              {opt.label}
                            </span>
                            <p className="text-[10px] text-slate-400 font-normal leading-tight">{opt.desc}</p>
                          </div>
                          {isSelected && (
                            <Check className="w-4 h-4 text-brand-600 shrink-0 stroke-[2.5]" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Category Horizontal Pills - Smooth Edge-to-Edge Touch Scroll */}
        <div
          className={`transition-all duration-300 ease-in-out ${isScrolled
              ? 'max-h-0 opacity-0 -translate-y-2 pointer-events-none mt-0 overflow-hidden'
              : 'opacity-100 translate-y-0 mt-3 sm:mt-3.5'
            }`}
        >
          <div className="-mx-3.5 px-3.5 sm:mx-0 sm:px-0 flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 scrollbar-none no-scrollbar scroll-smooth">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl sm:rounded-2xl text-xs font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer ${selectedCategory === 'all'
                  ? 'bg-slate-900 text-white shadow-soft'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                }`}
            >
              Shop tyres & tools ({products.length})
            </button>
            {categoriesData.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl sm:rounded-2xl text-xs font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer ${selectedCategory === cat.id
                    ? 'bg-brand-500 text-white shadow-glow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                  }`}
              >
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Active Filter Chips Bar - Smooth Animated Collapse when Scrolled */}
        {hasActiveFilters && (
          <div
            className={`transition-all duration-300 ease-in-out overflow-hidden ${isScrolled
                ? 'max-h-0 opacity-0 -translate-y-2 pointer-events-none mt-0'
                : 'max-h-36 opacity-100 translate-y-0 pt-3 border-t border-slate-100 mt-3.5'
              }`}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active:</span>

              {searchQuery && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-red-50 text-brand-700 text-xs font-bold">
                    "{searchQuery}"
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setSearchQuery('')} />
                  </span>
              )}

                  {selectedCategory !== 'all' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 text-slate-800 text-xs font-bold">
                      Category: {selectedCategory}
                      <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedCategory('all')} />
                    </span>
                  )}

                  {selectedBrands.map((b) => (
                    <span key={b} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 text-slate-800 text-xs font-bold">
                      Brand: {b}
                      <X className="w-3 h-3 cursor-pointer" onClick={() => toggleBrand(b)} />
                    </span>
                  ))}

                  {(priceRange[0] > 0 || priceRange[1] < 300000) && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 text-slate-800 text-xs font-bold font-mono">
                      Rs. {priceRange[0].toLocaleString()} – Rs. {priceRange[1].toLocaleString()}
                      <X className="w-3 h-3 cursor-pointer" onClick={() => setPricePreset(0, 300000)} />
                    </span>
                  )}

                  {inStockOnly && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold">
                      In Stock Only
                      <X className="w-3 h-3 cursor-pointer" onClick={() => setInStockOnly(false)} />
                    </span>
                  )}

                  {flashOnly && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-red-50 text-red-700 text-xs font-bold">
                      Flash Deals Only
                      <X className="w-3 h-3 cursor-pointer" onClick={() => setFlashOnly(false)} />
                    </span>
                  )}

                  <button
                    onClick={clearAllFilters}
                    className="inline-flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700 ml-auto cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset All</span>
                  </button>
                </div>
          </div>
        )}
          </div>

      {/* Main Product Grid Stage - Full Width */}
        <div id="catalog-products" className="w-full space-y-6 scroll-mt-28 sm:scroll-mt-36">

          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
            <span>
              Showing <b className="text-slate-900">{visibleProducts.length}</b> of {filteredProducts.length} items
            </span>
            <span className="text-emerald-600 font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> 100% Verified Warranty
            </span>
          </div>

          {filteredProducts.length > 0 ? (
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-4.5">
                {visibleProducts.map((product, idx) => {
                  const bnpl = bnplMap[product.id] ?? {
                    kokoCount: product.kokoInstallmentCount || product.installmentCount || 3,
                    kokoAmount: product.kokoInstallmentAmount || product.installmentAmount || Math.round(product.price / 3),
                    payzyCount: product.payzyInstallmentCount || 4,
                    payzyAmount: product.payzyInstallmentAmount || Math.round(product.price / 4),
                  };
                  return (
                    <div
                      key={product.id}
                      onClick={(e) => {
                        const target = e.target as HTMLElement;
                        if (target.closest('a, button')) return;
                        window.location.href = `/product/${product.slug}`;
                      }}
                      style={{ animationDelay: `${(idx % 8) * 60}ms` }}
                      className="product-card bg-white flex flex-col justify-between p-4 sm:p-4.5 group relative text-left rounded-2xl sm:rounded-3xl border border-slate-200/90 hover:border-brand-500 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.06),0_10px_24px_-4px_rgba(15,23,42,0.10),0_20px_35px_-6px_rgba(15,23,42,0.08)] hover:shadow-[0_24px_48px_-10px_rgba(15,23,42,0.18),0_12px_28px_-6px_rgba(237,28,36,0.28)] transition-all duration-300 hover:-translate-y-1.5 overflow-hidden animate-[fadeIn_0.45s_ease_both] cursor-pointer"
                    >
                      <div>
                        {/* Full-bleed Product Thumbnail with Glass Canvas */}
                        <a
                          href={`/product/${product.slug}`}
                          className="block relative aspect-[4/3] sm:aspect-square max-h-[250px] sm:max-h-none w-full rounded-xl sm:rounded-2xl overflow-hidden bg-gradient-to-b from-slate-100/60 to-slate-50/40 backdrop-blur-md border border-white/70 mb-3 sm:mb-3.5 flex items-center justify-center p-3 sm:p-3"
                        >
                          <img
                            src={product.featuredImage}
                            alt={product.title}
                            loading="lazy"
                            className="w-full h-full object-contain group-hover:scale-106 transition-transform duration-500 ease-out"
                          />

                          {/* Badges */}
                          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
                            {product.isFlashDeal && product.flashDealDiscount && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-red-600 to-rose-500 text-white shadow-md">
                                <Zap className="w-2.5 h-2.5 fill-current" />
                                -{product.flashDealDiscount}% OFF
                              </span>
                            )}
                          </div>
                        </a>

                        {/* Brand & In-Stock Micro-Strip */}
                        <div className="flex items-center justify-between text-[11px] mb-1.5">
                          <span className="text-brand-600 uppercase tracking-widest font-mono text-[10px] font-extrabold bg-brand-50/80 px-2 py-0.5 rounded-md border border-brand-100/60">{product.brand}</span>
                          <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            In Stock
                          </span>
                        </div>

                        {/* Info */}
                        <div className="space-y-0.5 sm:space-y-1 text-left">
                          <a href={`/product/${product.slug}`} className="block">
                            <h3 className="text-sm font-bold text-slate-900 line-clamp-2 group-hover:text-brand-600 transition-colors leading-snug pt-0.5 font-sans">
                              {product.title}
                            </h3>
                          </a>

                          {product.sinhalaTitle && (
                            <p className="text-xs sm:text-[11px] text-slate-400 font-sinhala line-clamp-1">
                              {product.sinhalaTitle}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Price & Direct Click Arrow */}
                      <div className="mt-3.5 pt-3 sm:mt-4 sm:pt-3.5 border-t border-slate-100 flex items-end justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline gap-2 flex-wrap">
                            <span className="text-base sm:text-lg font-black text-slate-900 font-display tracking-tight leading-none">
                              Rs. {product.price.toLocaleString('en-US')}
                            </span>
                            {product.originalPrice && (
                              <span className="text-xs sm:text-[11px] text-slate-400 line-through font-mono">
                                Rs. {product.originalPrice.toLocaleString('en-US')}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-1 font-medium flex-wrap">
                            <span>or {bnpl.kokoCount}× <b className="text-slate-800 font-mono font-bold">Rs. {bnpl.kokoAmount.toLocaleString('en-US')}</b></span>
                            <div className="flex items-center gap-0.5 shrink-0">
                              <a
                                href="https://paykoko.com/"
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-0.5 hover:opacity-80 transition-opacity"
                                title="Pay with Koko (opens paykoko.com)"
                              >
                                <img src="/images/payments/koko-logo.png" alt="Koko" className="h-3 object-contain" />
                                <span className="w-3 h-3 rounded-full bg-slate-800 text-white inline-flex items-center justify-center text-[8px] font-serif font-bold">i</span>
                              </a>
                              <span className="text-slate-300">/</span>
                              <a
                                href="https://payzy.lk/"
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-0.5 hover:opacity-80 transition-opacity"
                                title="Pay with PayZy (opens payzy.lk)"
                              >
                                <img src="/images/payments/payzy-logo.png" alt="PayZy" className="h-2.5 object-contain" />
                                <span className="w-3 h-3 rounded-full bg-slate-800 text-white inline-flex items-center justify-center text-[8px] font-serif font-bold">i</span>
                              </a>
                            </div>
                          </div>
                        </div>

                          <div className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-white/80 hover:bg-brand-500 text-slate-600 hover:text-white backdrop-blur-md border border-white/70 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_8px_20px_rgba(237,28,36,0.35)] shrink-0">
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </div>
                      </div>
                      );
                })}

                      {/* Skeletons rendered during batch loading */}
                      {isLoadingBatch && (
                        <>
                          <ProductCardSkeleton />
                          <ProductCardSkeleton />
                          <ProductCardSkeleton />
                          <ProductCardSkeleton />
                          <ProductCardSkeleton />
                        </>
                      )}
                    </div>

              {/* Infinite Scroll Trigger Sentinel */ }
                  <div ref={sentinelRef} className="h-6 w-full pointer-events-none" />

                  {/* Progressive Progress & Manual Load Control Bar / Completion Stage */ }
                  {
                    hasMore ? (
                      <div className="p-6 sm:p-8 rounded-[2rem] bg-white shadow-[0_10px_30px_-5px_rgba(0,0,0,0.06),0_2px_8px_-2px_rgba(0,0,0,0.04)] border-0 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="space-y-2.5 w-full md:flex-1 text-left">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                            <span className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
                              Loaded {visibleProducts.length} of {filteredProducts.length} Tyres & Tools
                            </span>
                            <span className="text-[11px] font-mono font-black text-brand-600 bg-brand-50 px-2.5 py-0.5 rounded-lg">
                              {Math.round((visibleProducts.length / filteredProducts.length) * 100)}% EXPLORED
                            </span>
                          </div>
                          <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-brand-600 via-brand-500 to-red-500 rounded-full transition-all duration-500 shadow-glow-sm"
                              style={{ width: `${(visibleProducts.length / filteredProducts.length) * 100}%` }}
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleManualLoadMore}
                          disabled={isLoadingBatch}
                          className="w-full md:w-auto shrink-0 inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm transition-all shadow-soft hover:scale-105 active:scale-95 disabled:opacity-60 cursor-pointer"
                        >
                          {isLoadingBatch ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin text-brand-400" />
                              <span>Loading Next Batch...</span>
                            </>
                          ) : (
                            <>
                              <PackagePlus className="w-4 h-4 text-brand-400" />
                              <span>Load Next Hardware ({filteredProducts.length - visibleProducts.length} Remaining)</span>
                              <ArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      <div className="p-8 rounded-[2rem] bg-gradient-to-b from-white to-slate-50 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.06),0_2px_8px_-2px_rgba(0,0,0,0.04)] border-0 text-center space-y-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-2xs">
                          <ShieldCheck className="w-6 h-6" />
                        </div>

                        <div className="space-y-1 max-w-md mx-auto">
                          <h4 className="text-base font-black text-slate-900 font-display">
                            You've Viewed All {filteredProducts.length} Matching Hardware Items
                          </h4>
                          <p className="text-xs text-slate-500">
                            Need a custom accessory bundle or bulk inquiry? Our Horana support desk is ready on WhatsApp.
                          </p>
                        </div>

                        <div className="pt-1 flex flex-wrap items-center justify-center gap-3">
                          <a
                            href="https://wa.me/94783724920?text=Hi%20Tyrelink,%20I%20am%20looking%20for%20a%20custom%20setup%20recommendation"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-glow-green hover:scale-105 active:scale-95 transition-all cursor-pointer"
                          >
                            <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                            </svg>
                            <span>Request Custom Setup on WhatsApp</span>
                          </a>

                          <button
                            type="button"
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                            className="inline-flex items-center gap-1.5 px-5 py-3 rounded-2xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs shadow-2xs border border-slate-200/80 transition-all cursor-pointer"
                          >
                            <span>Back to Top</span>
                            <ArrowRight className="w-3.5 h-3.5 -rotate-90" />
                          </button>
                        </div>
                      </div>
                    )
                  }
            </div>
              ) : (
              <div className="bg-white rounded-[2rem] p-12 text-center shadow-[0_10px_30px_-5px_rgba(0,0,0,0.06)] space-y-4 border-0">
                <Search className="w-12 h-12 text-slate-300 mx-auto" />
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-900">No matching hardware found</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Try clearing some filter criteria or search with general terms like "tyre size", "brand", or "vehicle".
                  </p>
                </div>
                <button
                  onClick={clearAllFilters}
                  className="px-6 py-2.5 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-glow-sm transition-all"
                >
                  Reset All Filters
                </button>
              </div>
          )}

            </div>

    </div>
        );
}
