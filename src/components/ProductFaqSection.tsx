import { useEffect, useState } from 'react';
import { Edit3, Plus, RotateCcw, Save, Trash2, X } from 'lucide-react';
import type { Product, ProductFAQ } from '../types';
import { fetchProductById } from '../services/productService';
import { getAdminSession, subscribeAdmin, saveSingleProduct } from '../utils/adminStore';
import { getDefaultProductFaqs, resolveProductFaqs } from '../utils/productFaq';

interface ProductFaqSectionProps {
  product: Product;
  defaultFaqs: ProductFAQ[];
}

export default function ProductFaqSection({ product: initialProduct, defaultFaqs }: ProductFaqSectionProps) {
  const [liveProduct, setLiveProduct] = useState<Product>(initialProduct);
  const [faqs, setFaqs] = useState<ProductFAQ[]>(
    initialProduct.faqs?.length ? initialProduct.faqs : defaultFaqs
  );
  const [isAdmin, setIsAdmin] = useState(false);
  const [editing, setEditing] = useState(false);
  const [drafts, setDrafts] = useState<ProductFAQ[]>([]);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    setIsAdmin(Boolean(getAdminSession()));
    const unsub = subscribeAdmin((s) => setIsAdmin(Boolean(s)));

    fetchProductById(initialProduct.id).then((fresh) => {
      if (fresh) {
        setLiveProduct(fresh);
        setFaqs(resolveProductFaqs(fresh));
      }
    });

    const handleProductUpdated = (ev: Event) => {
      const updated = (ev as CustomEvent<{ product?: Product }>)?.detail?.product;
      if (updated && updated.id === initialProduct.id) {
        setLiveProduct(updated);
        setFaqs(resolveProductFaqs(updated));
      }
    };
    window.addEventListener('tyrelink:product-saved', handleProductUpdated);

    return () => {
      unsub();
      window.removeEventListener('tyrelink:product-saved', handleProductUpdated);
    };
  }, [initialProduct.id]);

  function openEditor() {
    setDrafts(faqs.map((f) => ({ ...f })));
    setStatusMsg(null);
    setEditing(true);
  }

  function updateDraft(index: number, field: 'question' | 'answer', value: string) {
    setDrafts((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  }

  function addDraft() {
    setDrafts((prev) => [...prev, { question: '', answer: '' }]);
  }

  function removeDraft(index: number) {
    setDrafts((prev) => prev.filter((_, i) => i !== index));
  }

  function resetToDefaults() {
    setDrafts(getDefaultProductFaqs(liveProduct));
  }

  async function saveFaqs() {
    const cleaned = drafts
      .map((f) => ({ question: f.question.trim(), answer: f.answer.trim() }))
      .filter((f) => f.question.length > 0 && f.answer.length > 0);

    if (cleaned.length === 0) {
      setStatusMsg({ text: 'Add at least one Question and Answer before saving.', ok: false });
      return;
    }

    setSaving(true);
    setStatusMsg(null);
    const updatedProduct: Product = {
      ...liveProduct,
      faqs: cleaned,
    };

    const res = await saveSingleProduct(updatedProduct, false);
    setSaving(false);
    if (!res.success) {
      setStatusMsg({ text: res.error || 'Could not save product FAQs.', ok: false });
      return;
    }

    const savedProduct = res.product || updatedProduct;
    setLiveProduct(savedProduct);
    setFaqs(resolveProductFaqs(savedProduct));
    setEditing(false);
    setStatusMsg({ text: 'FAQs updated and saved live.', ok: true });
    window.dispatchEvent(new CustomEvent('tyrelink:product-saved', { detail: { product: savedProduct } }));
    setTimeout(() => setStatusMsg(null), 3500);
  }

  return (
    <section className="pd-faq" aria-labelledby="pd-faq-title">
      <div>
        <div className="flex items-center justify-between gap-3">
          <span className="pd-eyebrow">Before you choose</span>
          {isAdmin && !editing && (
            <button
              type="button"
              onClick={openEditor}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-[#e31b23] text-white text-[11px] font-bold transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit FAQs
            </button>
          )}
        </div>
        <h2 id="pd-faq-title">
          A little clarity.
          <br />
          <span>A better journey.</span>
        </h2>
        {statusMsg && (
          <p
            role="status"
            className={`mt-4 px-3 py-2 rounded-lg text-xs font-semibold border ${
              statusMsg.ok
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-red-50 text-red-700 border-red-200'
            }`}
          >
            {statusMsg.text}
          </p>
        )}
      </div>

      {editing ? (
        <div className="p-5 rounded-2xl bg-slate-950 text-slate-100 border border-amber-500/40 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-amber-300">
                Admin FAQ Editor — {liveProduct.title}
              </p>
              <p className="text-[11px] text-slate-400">
                Customize questions shown in “Before You Choose” for this product.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={resetToDefaults}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                Reset Defaults
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                aria-label="Close FAQ editor"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {drafts.map((item, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                    Question 0{idx + 1}
                  </span>
                  {drafts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeDraft(idx)}
                      className="inline-flex items-center gap-1 text-[11px] text-red-400 hover:text-red-300 font-bold cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      Remove
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={item.question}
                  onChange={(e) => updateDraft(idx, 'question', e.target.value)}
                  placeholder="Enter question..."
                  className="w-full h-9 px-3 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                />
                <textarea
                  rows={2}
                  value={item.answer}
                  onChange={(e) => updateDraft(idx, 'answer', e.target.value)}
                  placeholder="Enter clear customer answer..."
                  className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                />
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={addDraft}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Question
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setEditing(false)}
                disabled={saving}
                className="px-3.5 py-2 rounded-lg text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveFaqs}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#e31b23] hover:bg-red-600 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? 'Saving...' : 'Save FAQs'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div>
          {faqs.map((faq, i) => (
            <details key={`${faq.question}-${i}`}>
              <summary>
                <span>{String(i + 1).padStart(2, '0')}</span>
                {faq.question}
                <b>+</b>
              </summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      )}
    </section>
  );
}
