import type { APIRoute } from 'astro';
import { business } from '../data/business';
export const GET: APIRoute = ({ site }) => {
  const origin = site?.origin || business.siteUrl;
  return new Response(`# TyreLink\n\n> Tyres and automotive essentials from Walasmulla, Sri Lanka.\n\n## Business\n\n${business.legalName}\n${business.address}\nPhone: ${business.phone}\nEmail: ${business.email}\nHours: ${business.openingHours}\n\n## Pages\n\n- [Shop](${origin}/shop): Browse products and specifications.\n- [About](${origin}/about): Business background.\n- [Contact](${origin}/contact): Speak to the team.\n- [Questions](${origin}/faq): Buying guidance.\n\n## Purchasing information\n\nCustomers can enquire and order without a customer account. Confirm current price, stock, fitment, manufacture date and flat-rate delivery with the team before purchase. Catalog prices are indicative samples until verified. The Maps location is awaiting owner confirmation. No verified Google review feed is connected.\n`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
