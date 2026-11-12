import type { APIRoute } from 'astro';
export const GET: APIRoute = ({ site }) => new Response(`User-agent: *\nAllow: /\nSitemap: ${site ?? 'https://tyrelink.lk'}/sitemap-index.xml`);
