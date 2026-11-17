// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  site: process.env.PUBLIC_SITE_URL || 'https://tyrelink.lk',
  integrations: [react(), tailwind({ applyBaseStyles: false })],
  vite: {
    ssr: { noExternal: ['lucide-react'] },
  },
});
