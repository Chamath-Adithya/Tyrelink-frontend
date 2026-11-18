# Product experience update

Implemented a light editorial product layout with visible descriptions, sticky desktop gallery, viewport-triggered reveals, reduced-motion support, illustrated specification section, product FAQ markup, same-category recommendations and a buy dock that meets the footer boundary.

`/tools` provides tyre-size lookup, sidewall illustration, category-constrained comparison (maximum three), differences-only view, shareable comparison URLs, browser-local saved products and recently viewed products. Storage keys use the `tyrelink:` prefix. Data is fetched from the catalog API with the existing seed fallback.

Product reviews have rating/name/text and an optional image, resized client-side and validated server-side. Pending reviews never appear publicly. Samples are explicitly labeled and excluded from structured data. The backend requires PostgreSQL and migrations 001–003. A failed API submission keeps the form text; it does not pretend to save locally.

`/merchant` adds catalog readiness checks, multi-row price/stock/batch edits, publish flags, draft previews and local draft recovery, review moderation, delivery rates and the existing enquiry manager. Live endpoints require admin authentication. Without a live session it is a labeled browser-only preview. Merchant pages are noindex.

## Operational limits

The existing storefront uses statically generated product pages. API catalog changes require syncing the build catalog and rebuilding the site for static details, metadata and purchase props to agree. This update does not silently deploy or automate that pipeline. The merchant save message makes this explicit. Existing sample product images/prices/warranty claims require merchant verification. No fictional review totals are added to JSON-LD.

Delivery amounts remain unset until an admin supplies verified town rates. Stock notifications are WhatsApp enquiries, not an automated notification subscription. Real customer reviews need the deployed API and migrated PostgreSQL database. Existing product editing remains available through in-page edit mode; the new workspace focuses on bulk operations.

## Validation

Run `npm run build` in the frontend and `go test ./...` in the API. Set `TYRELINK_TEST_DATABASE_URL` to an isolated, migrated database to run the pending-to-approved persistence integration test. Never point this test at production.
