import type { APIRoute } from 'astro';
import { business } from '../data/business';
export const GET: APIRoute = ({ site }) => new Response(
  `User-agent: *\nAllow: /\nDisallow: /admin\n\nSitemap: ${new URL('/sitemap.xml', site || business.siteUrl).href}\n`,
  { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
);
