import { useEffect, useState, useRef } from 'react';
import type { Product } from '../types';
import {
  getReviews,
  submitReview,
  getDeliveryRates,
  type Review,
  type DeliveryRate,
} from '../services/customerService';
import { request, getStoredToken } from '../services/apiClient';
import { deleteAdminReview } from '../services/productService';
import { getAdminSession } from '../utils/adminStore';
import { recordViewed, toggleSaved, readIds, SAVED_KEY } from '../utils/shoppingStore';
import '../styles/product-experience.css';

interface PendingLocalReview extends Review {
  localPending?: boolean;
}

export default function ProductExperience({ product }: { product: Product }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const elements = root.current?.querySelectorAll('section');
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('experience-entered');
            observer.unobserve(entry.target);
          }
        }),
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    elements?.forEach((element) => {
      element.classList.add('experience-animate');
      observer.observe(element);
    });
    return () => observer.disconnect();
  }, []);

  const [saved, setSaved] = useState(false);
  const [reviews, setReviews] = useState<PendingLocalReview[]>([]);
  const [adminReviews, setAdminReviews] = useState<Review[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [rates, setRates] = useState<DeliveryRate[]>([]);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [photo, setPhoto] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewState, setReviewState] = useState<'loading' | 'ready' | 'offline'>('loading');
  const [filterMode, setFilterMode] = useState<'all' | 'photos'>('all');
  const [sortMode, setSortMode] = useState<'newest' | 'highest'>('newest');
  const [formOpen, setFormOpen] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const localPendingKey = `tyrelink_my_pending_review_${product.id}`;

  const loadAllReviews = async (activeRef: { current: boolean }) => {
    try {
      const approved = await getReviews(product.id);
      if (!activeRef.current) return;

      // Include user's own pending submission stored in sessionStorage if not yet approved
      let ownPending: PendingLocalReview[] = [];
      try {
        const raw = sessionStorage.getItem(localPendingKey);
        if (raw) {
          const parsed: PendingLocalReview = JSON.parse(raw);
          const alreadyLive = approved.some(
            (r) => r.id === parsed.id || (r.name === parsed.name && r.text === parsed.text)
          );
          if (alreadyLive) {
            sessionStorage.removeItem(localPendingKey);
          } else {
            ownPending = [{ ...parsed, localPending: true }];
          }
        }
      } catch {}

      setReviews([...ownPending, ...approved]);
      setReviewState('ready');
    } catch {
      if (activeRef.current) setReviewState('offline');
    }

    // If Admin is signed in, load moderation queue for this product
    if (getAdminSession() && getStoredToken()) {
      setIsAdmin(true);
      try {
        const res = await request<{ data: Review[] }>('/v1/admin/reviews');
        if (activeRef.current && Array.isArray(res?.data)) {
          setAdminReviews(
            res.data.filter(
              (r) => r.productId === product.id || r.productId === product.slug
            )
          );
        }
      } catch {}
    }
  };

  useEffect(() => {
    recordViewed(product.id);
    const sync = () => setSaved(readIds(SAVED_KEY).includes(product.id));
    sync();
    window.addEventListener('tyrelink:shopping', sync);

    const activeRef = { current: true };
    loadAllReviews(activeRef);
    getDeliveryRates()
      .then((rows) => {
        if (activeRef.current) setRates(rows);
      })
      .catch(() => {});

    return () => {
      activeRef.current = false;
      window.removeEventListener('tyrelink:shopping', sync);
    };
  }, [product.id]);

  const enquiry = (text: string) =>
    `https://wa.me/94712500420?text=${encodeURIComponent(
      `${text}\n${product.title}\n${typeof location !== 'undefined' ? location.href.split('#')[0] : ''}`
    )}`;

  async function sendReview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const authorName = String(data.get('name') || '').trim();
    const bodyText = String(data.get('text') || '').trim();

    if (!rating) {
      setMessage({ text: 'Please select a 1 to 5 star rating first.', ok: false });
      return;
    }

    setBusy(true);
    setMessage(null);
    try {
      await submitReview(product.id, {
        name: authorName,
        rating,
        text: bodyText,
        ...(photo ? { photoDataUrl: photo } : {}),
      });

      const pendingEntry: PendingLocalReview = {
        id: 'pending-' + Date.now(),
        productId: product.id,
        name: authorName,
        rating,
        text: bodyText,
        status: 'pending',
        photoDataUrl: photo || undefined,
        createdAt: new Date().toISOString(),
        localPending: true,
      };
      try {
        sessionStorage.setItem(localPendingKey, JSON.stringify(pendingEntry));
      } catch {}

      setReviews((prev) => [pendingEntry, ...prev.filter((r) => !r.localPending)]);
      setMessage({
        text: 'Thank you! Your review has been submitted and will be published publicly once approved.',
        ok: true,
      });
      form.reset();
      setPhoto('');
      setRating(0);

      // Refresh admin moderation queue if signed in
      if (isAdmin) {
        const res = await request<{ data: Review[] }>('/v1/admin/reviews').catch(() => null);
        if (res?.data) {
          setAdminReviews(res.data.filter((r) => r.productId === product.id || r.productId === product.slug));
        }
      }
    } catch (error) {
      setMessage({
        text:
          error instanceof TypeError
            ? 'Review service is temporarily unreachable. Your text has been preserved — please retry.'
            : error instanceof Error
            ? error.message
            : 'Could not submit review. Please try again.',
        ok: false,
      });
    } finally {
      setBusy(false);
    }
  }

  async function loadPhoto(file?: File) {
    setPhoto('');
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setMessage({ text: 'Choose a JPG, PNG or WebP photo smaller than 5 MB.', ok: false });
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 640 / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
      setPhoto(canvas.toDataURL('image/jpeg', 0.78));
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      setMessage({ text: 'Could not read image file.', ok: false });
    };
    img.src = url;
  }

  async function moderateOnPage(id: string, status: Review['status']) {
    try {
      await request(`/v1/admin/reviews/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      setAdminReviews((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
      const fresh = await getReviews(product.id);
      setReviews(fresh);
    } catch (err: any) {
      setMessage({ text: err?.message || 'Moderation failed', ok: false });
    }
  }

  async function deleteOnPage(id: string) {
    if (!window.confirm('Delete this review permanently?')) return;
    try {
      await deleteAdminReview(id);
      setAdminReviews((prev) => prev.filter((r) => r.id !== id));
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch (err: any) {
      setMessage({ text: err?.message || 'Delete failed', ok: false });
    }
  }

  const approvedReviews = reviews.filter((r) => !r.localPending);
  const avgScore =
    approvedReviews.length > 0
      ? (approvedReviews.reduce((acc, r) => acc + r.rating, 0) / approvedReviews.length).toFixed(1)
      : product.rating > 0
      ? product.rating.toFixed(1)
      : '—';

  const photoCount = reviews.filter((r) => Boolean(r.photoDataUrl)).length;

  const displayedReviews = reviews
    .filter((r) => (filterMode === 'photos' ? Boolean(r.photoDataUrl) : true))
    .sort((a, b) => {
      if (sortMode === 'highest') return b.rating - a.rating;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return (
    <div className="product-experience" ref={root}>
      <nav className="product-utilities" aria-label="Product tools">
        <button
          type="button"
          aria-pressed={saved}
          onClick={() => {
            toggleSaved(product.id);
            setSaved(readIds(SAVED_KEY).includes(product.id));
          }}
        >
          {saved ? '♥ Saved' : '♡ Save for later'}
        </button>
        <a href={`/tools?compare=${encodeURIComponent(product.id)}`}>Compare similar ↗</a>
        <a href={enquiry('Take a look at this product at TyreLink:')} target="_blank" rel="noreferrer">
          Share on WhatsApp ↗
        </a>
        <a href="/tools#recent">Recently viewed ↗</a>
      </nav>

      <section className="experience-delivery" aria-labelledby="delivery-heading">
        <div>
          <span className="experience-eyebrow">BEFORE YOU ORDER</span>
          <h2 id="delivery-heading">
            A little certainty.
            <br />
            A better journey.
          </h2>
          <p>Confirm your tyre size, manufacture date and delivery with our team.</p>
        </div>
        <div className="experience-details">
          <details>
            <summary>Manufacture date &amp; tyre batch</summary>
            <p>
              Confirm the current tyre manufacture date (DOT batch) with our team before ordering.
            </p>
            <a href={enquiry('Please confirm the manufacture date (DOT batch) for:')}>
              Ask about this batch ↗
            </a>
          </details>
          <details>
            <summary>Islandwide delivery</summary>
            {rates.length ? (
              <p>
                Flat islandwide courier fee: Rs. {Number(rates[0].fee).toLocaleString('en-US')} · {rates[0].estimate}. Same flat rate anywhere in Sri Lanka.
              </p>
            ) : (
              <p>Flat islandwide courier fee: Rs. 450 · 1–3 working days islandwide.</p>
            )}
            <a href={enquiry('Please confirm dispatch timing for:')}>
              Ask about delivery timing ↗
            </a>
          </details>
          <details>
            <summary>Need a different size or more stock?</summary>
            <p>
              Tell us your size and quantity. Our team can check availability and discuss alternatives.
            </p>
            <a href={enquiry('Please let me know when stock / alternative sizes are available for:')}>
              Enquire about availability ↗
            </a>
          </details>
        </div>
      </section>

      {/* Production-Grade Customer Reviews Section */}
      <section className="experience-reviews" aria-labelledby="product-reviews-title">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 border-b border-[#deded8]">
          <div>
            <span className="experience-eyebrow">CUSTOMER REVIEWS</span>
            <h2 id="product-reviews-title">Real driver feedback.</h2>
            <p className="text-sm text-[#676b64]">
              Reviews are moderated by our store team to prevent spam and keep feedback genuine.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setFormOpen((o) => !o)}
            className="px-5 py-3 rounded-xl bg-[#18191b] hover:bg-[#e31b23] text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shrink-0 self-start lg:self-auto"
          >
            {formOpen ? 'Close Review Form ×' : 'Write a Review ＋'}
          </button>
        </div>

        {/* Rating Breakdown Histogram & Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8 p-6 rounded-2xl bg-white border border-[#e3e3dd]">
          <div className="flex flex-col justify-center">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-[#18191b] font-mono">{avgScore}</span>
              <span className="text-sm text-[#676b64] font-semibold">/ 5.0</span>
            </div>
            <p className="experience-stars text-lg mt-1">
              {'★'.repeat(Math.round(Number(avgScore) || 5))}
              {'☆'.repeat(5 - Math.round(Number(avgScore) || 5))}
            </p>
            <p className="text-xs text-[#676b64] mt-1">
              {approvedReviews.length > 0
                ? `Based on ${approvedReviews.length} approved customer review${approvedReviews.length === 1 ? '' : 's'}`
                : reviewState === 'loading'
                ? 'Loading reviews...'
                : 'No approved reviews published yet'}
            </p>
          </div>

          <div className="space-y-1.5 justify-center flex flex-col">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = approvedReviews.filter((r) => r.rating === star).length;
              const pct = approvedReviews.length > 0 ? Math.round((count / approvedReviews.length) * 100) : 0;
              return (
                <div key={star} className="flex items-center gap-2 text-xs">
                  <span className="w-7 font-bold text-[#18191b] font-mono">{star}★</span>
                  <div className="flex-1 h-2 rounded-full bg-[#eeeeea] overflow-hidden">
                    <div className="h-full bg-[#e31b23] rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-8 text-right text-[#676b64] font-mono">{count}</span>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
                  filterMode === 'all'
                    ? 'bg-[#18191b] text-white border-[#18191b]'
                    : 'bg-[#f6f6f3] text-[#202320] border-[#deded8]'
                }`}
              >
                All ({reviews.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('photos')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
                  filterMode === 'photos'
                    ? 'bg-[#18191b] text-white border-[#18191b]'
                    : 'bg-[#f6f6f3] text-[#202320] border-[#deded8]'
                }`}
              >
                With Photos ({photoCount})
              </button>
            </div>

            <select
              aria-label="Sort reviews"
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as 'newest' | 'highest')}
              className="h-9 px-3 rounded-lg bg-[#f6f6f3] border border-[#deded8] text-xs font-semibold text-[#202320]"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="highest">Sort: Highest Rating</option>
            </select>
          </div>
        </div>

        {/* Review Submission Form */}
        {formOpen && (
          <div className="mb-8 p-6 rounded-2xl bg-white border border-[#deded8] shadow-sm">
            <h3 className="text-base font-black text-[#18191b] mb-1">Share Your Experience</h3>
            <p className="text-xs text-[#676b64] mb-4">
              Help fellow motorists choose with confidence. Your review goes live right after moderation.
            </p>
            <form onSubmit={sendReview} className="space-y-4 max-w-2xl">
              <div className="review-fields">
                <label>
                  Your Name
                  <input name="name" required minLength={2} maxLength={80} autoComplete="name" placeholder="e.g. Nuwan Perera" />
                </label>
                <fieldset className="review-rating">
                  <legend>Your Rating</legend>
                  <div className="review-star-buttons" onMouseLeave={() => setHoverRating(0)}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        aria-label={`${n} ${n === 1 ? 'star' : 'stars'}`}
                        aria-pressed={rating === n}
                        onMouseEnter={() => setHoverRating(n)}
                        onFocus={() => setHoverRating(n)}
                        onBlur={() => setHoverRating(0)}
                        onClick={() => setRating(n)}
                        className={n <= (hoverRating || rating) ? 'star-selected' : ''}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  <span className="review-rating-caption">
                    {['Tap a star', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'][hoverRating || rating]}
                  </span>
                </fieldset>
              </div>

              <label>
                Your Experience
                <textarea
                  placeholder="How is the road grip, comfort, delivery or fitment guidance?"
                  name="text"
                  required
                  minLength={10}
                  maxLength={2000}
                  rows={4}
                />
              </label>

              <div>
                <label>
                  Product Photo (optional, JPG/PNG/WebP under 5 MB)
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => loadPhoto(e.target.files?.[0])}
                  />
                </label>
                {photo && (
                  <div className="flex items-center gap-3 mt-2">
                    <img src={photo} alt="Review upload preview" className="w-20 h-20 object-cover rounded-lg border" />
                    <button
                      type="button"
                      onClick={() => setPhoto('')}
                      className="text-xs text-red-600 font-bold underline cursor-pointer"
                    >
                      Remove Photo
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={busy}
                  className="px-6 py-3 rounded-xl bg-[#18191b] hover:bg-[#e31b23] text-white text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {busy ? 'Submitting…' : 'Submit Review'}
                </button>
              </div>

              {message && (
                <p
                  role="status"
                  aria-live="polite"
                  className={`p-3 rounded-xl text-xs font-semibold border ${
                    message.ok
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-red-50 text-red-700 border-red-200'
                  }`}
                >
                  {message.text}
                </p>
              )}
            </form>
          </div>
        )}

        {/* Approved & Submitted Reviews Grid */}
        {displayedReviews.length > 0 ? (
          <div className="experience-review-grid">
            {displayedReviews.map((r) => (
              <article key={r.id} className="flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="experience-eyebrow">
                      {r.localPending ? 'PENDING APPROVAL (YOUR SUBMISSION)' : 'VERIFIED DRIVER REVIEW'}
                    </span>
                    {r.createdAt && (
                      <span className="text-[11px] text-[#757970] font-mono">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <p aria-label={`${r.rating} out of 5 stars`} className="experience-stars">
                    {'★'.repeat(r.rating)}
                    {'☆'.repeat(5 - r.rating)}
                  </p>
                  <blockquote className="text-sm leading-relaxed text-[#202320] mt-2 mb-4">{r.text}</blockquote>
                  {r.photoDataUrl && (
                    <button
                      type="button"
                      onClick={() => setLightboxSrc(r.photoDataUrl || null)}
                      className="block mb-3 rounded-lg overflow-hidden border border-[#e3e3dd] hover:opacity-90 cursor-pointer"
                    >
                      <img src={r.photoDataUrl} alt="Customer product photograph" loading="lazy" width="160" height="120" className="object-cover" />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2.5 pt-3 border-t border-[#eeeeea]">
                  <span className="w-7 h-7 rounded-full bg-[#18191b] text-white text-xs font-bold flex items-center justify-center">
                    {(r.name || 'D').slice(0, 1).toUpperCase()}
                  </span>
                  <strong className="text-xs text-[#18191b]">{r.name}</strong>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="my-6 p-8 rounded-2xl bg-white border border-dashed border-[#d8d8d0] text-center space-y-3">
            <p className="text-sm font-bold text-[#18191b]">
              {reviewState === 'loading'
                ? 'Loading customer reviews...'
                : reviewState === 'offline'
                ? 'Reviews service is currently connecting.'
                : filterMode === 'photos'
                ? 'No photo reviews posted yet.'
                : `No reviews published for ${product.title} yet.`}
            </p>
            <p className="text-xs text-[#676b64]">
              Already fitted this item? Share your feedback to help other motorists.
            </p>
            {!formOpen && (
              <button
                type="button"
                onClick={() => setFormOpen(true)}
                className="px-4 py-2 rounded-xl bg-[#e31b23] text-white text-xs font-bold cursor-pointer"
              >
                Write the First Review
              </button>
            )}
          </div>
        )}

        {/* Inline Admin Review Moderation Panel (Visible only to authenticated Admin) */}
        {isAdmin && (
          <div className="mt-8 p-5 rounded-2xl bg-slate-950 text-slate-100 border border-amber-500/40 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-wider text-amber-300">
                Admin Review Queue ({adminReviews.length} for this product)
              </p>
              <a href="/merchant?tab=reviews" className="text-xs text-sky-400 underline font-bold">
                Open All Store Reviews ↗
              </a>
            </div>
            {adminReviews.length === 0 ? (
              <p className="text-xs text-slate-400">No reviews awaiting moderation for this product.</p>
            ) : (
              <div className="space-y-2">
                {adminReviews.map((ar) => (
                  <div key={ar.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-white">{ar.name}</span> ·{' '}
                      <span className="text-amber-400">{ar.rating}★</span> ·{' '}
                      <span className="uppercase font-mono text-[10px] px-2 py-0.5 rounded bg-slate-800">{ar.status}</span>
                      <p className="text-slate-300 truncate mt-0.5">{ar.text}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {(['approved', 'rejected'] as const).map((st) => (
                        <button
                          key={st}
                          type="button"
                          disabled={ar.status === st}
                          onClick={() => moderateOnPage(ar.id, st)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 font-bold capitalize cursor-pointer"
                        >
                          {st}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => deleteOnPage(ar.id)}
                        className="px-2.5 py-1 rounded-lg bg-red-600/20 text-red-300 border border-red-500/30 font-bold cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Photo Lightbox */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-[9999] bg-black/85 flex items-center justify-center p-4"
          onClick={() => setLightboxSrc(null)}
        >
          <img src={lightboxSrc} alt="Customer photo preview" className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl" />
        </div>
      )}
    </div>
  );
}
