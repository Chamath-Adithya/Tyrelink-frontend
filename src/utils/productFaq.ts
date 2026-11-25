import type { Product, ProductFAQ } from '../types';

const WORKSHOP_CATEGORIES = new Set(['garage-equipment', 'garage-tools', 'wheels']);

export function getDefaultProductFaqs(product: Pick<Product, 'title' | 'category'>): ProductFAQ[] {
  if (WORKSHOP_CATEGORIES.has(product.category)) {
    return [
      {
        question: `How can I confirm ${product.title} suits my workshop or vehicle?`,
        answer:
          'Check the technical specifications listed above against your workshop or rim requirements, or send a photo to our team on WhatsApp to confirm compatibility before ordering.',
      },
      {
        question: 'Can I pay in instalments?',
        answer:
          'Koko and Payzy instalment options are shown alongside the price where eligible. Confirm your preferred payment method with our team when placing your order.',
      },
      {
        question: 'How do I confirm delivery charges and dispatch timing?',
        answer:
          'We charge a single uniform flat islandwide delivery fee across Sri Lanka. Share your delivery details with our team to confirm stock and dispatch timing before payment.',
      },
    ];
  }

  return [
    {
      question: `Will ${product.title} fit my vehicle?`,
      answer:
        'Check the listed size and load/speed specifications against your vehicle requirements, or send our team a photo of your current tyre sidewall on WhatsApp to confirm fitment before ordering.',
    },
    {
      question: 'Can I pay in instalments?',
      answer:
        'Koko and Payzy options are shown with the price. Provider eligibility and terms apply; confirm the available payment option when placing your order.',
    },
    {
      question: 'How do I confirm delivery and manufacture date?',
      answer:
        'Our flat islandwide delivery fee and estimated dispatch timing apply everywhere in Sri Lanka. Confirm current stock and the available DOT manufacture date batch with our team before you pay.',
    },
  ];
}

export function resolveProductFaqs(product: Pick<Product, 'title' | 'category' | 'faqs'>): ProductFAQ[] {
  if (Array.isArray(product.faqs) && product.faqs.length > 0) {
    const valid = product.faqs
      .map((f) => ({
        question: String(f?.question || '').trim(),
        answer: String(f?.answer || '').trim(),
      }))
      .filter((f) => f.question.length > 0 && f.answer.length > 0);
    if (valid.length > 0) return valid;
  }
  return getDefaultProductFaqs(product);
}
