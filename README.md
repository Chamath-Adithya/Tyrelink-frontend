# Tyrelink Frontend

Astro storefront for Tyrelink tyres, garage tools and equipment. This repository owns pages, components, catalogue presentation, brand assets and browser-side interactions.

Run: `npm ci && npm run dev`.

Production build: `npm ci && npm run build`; deploy `dist/` to the VPS static
directory behind the reverse proxy. Copy `.env.example` to `.env` only for
local development. The storefront never stores secrets in browser variables.

Branches: `main` is releasable; use `feat/*`, `fix/*`, `docs/*` and
`security/*` pull requests. CI runs the lockfile install, high-severity audit
and production build. The API contract and release order are maintained in
`Tyrelink-docs`.

Deployment target: VPS reverse-proxied static output or a static asset server. Backend API URL is configured through a public runtime-safe environment variable when API integration is enabled.
