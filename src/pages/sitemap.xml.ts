import type { APIRoute } from 'astro';
import products from '../data/products.json';
import categories from '../data/categories.json';
import { business } from '../data/business';
export const GET: APIRoute = ({ site }) => {
  const paths = ['/', '/shop', '/about', '/contact', '/faq', '/tools',
    ...categories.map(category => `/category/${category.id}`),
    ...products.map(product => `/product/${product.slug}`)];
  const escape = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map(path => `<url><loc>${escape(new URL(path, site || business.siteUrl).href)}</loc></url>`).join('')}</urlset>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
