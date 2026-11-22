# Nexora

Nexora is an independent, responsive movie and series discovery and streaming MVP. It is being built in phases toward the larger streaming and creator platform in the project brief. The active product does not aggregate Netflix, Prime Video, Disney+ or Hulu subscriptions.

## Current architecture

- **Frontend:** Static HTML, CSS and browser JavaScript in `public/`. The UI uses Oswald and Inter with responsive layouts and light/dark themes.
- **Backend:** Node.js HTTP server in `lib/server.mjs`, exposed locally and as a Vercel serverless function through `api/[...path].js`.
- **Data:** Neon Postgres is used for account/session/profile storage and the catalogue, rights and playback checks when `DATABASE_URL` is configured. Local/demo fallback data is stored in `data/nexora.json`; process memory is used for sessions and authentication throttling when Neon is not configured.
- **Hosting:** Vercel. Production must use persistent storage; the Vercel `/tmp` demo JSON store is temporary and instance-local.
- **Dependencies:** Node.js and `@neondatabase/serverless` (declared in `package.json`).

## Run locally

1. Install Node.js 20 or later.
2. Copy `.env.example` to `.env` and set `DATABASE_URL` if you want to exercise Neon-backed features. Never commit secrets.
3. Run `npm start`.
4. Open `http://localhost:4173`.

For the Neon-backed paths, apply `lib/schema.sql` to the database before use. Without Neon, the app can start in demo mode, but persistent accounts, profiles, rights administration and watch history are unavailable or temporary.

## Main pages

- `/` — Nexora landing page, featured stories, genres and testimonials.
- `/plans` — Free, Plus and Family plan preview. USD amounts are illustrative and checkout is disabled.
- `/testimonials` — viewer stories and a submission form; submissions await moderation.
- `/app` — discovery home.
- `/app/discover`, `/app/trending`, `/app/top-rated`, `/app/genres`, `/app/watchlist` — catalogue views and saved titles.
- `/app/movie/{id}` — title details and trailer/play entry points.
- `/app/player/demo` — the openly licensed Big Buck Bunny playback demonstration, subject to the licence attribution shown on the page and territory check.
- `/app/account` — account and viewer-profile management.
- `/signin`, `/signup`, `/forgot-password` — account flows.
- `/admin` — restricted catalogue and licensing administration.

## Phase 1 capabilities

The current MVP includes catalogue discovery, seeded movie/series cards, title detail pages, search/filtering, YouTube trailer links, account registration/sign-in, up to five profiles, watchlists, profile-scoped watch history, an open-film player demo, subscription-plan preview, admin catalogue drafts, rights review, and publication checks for rights plus ready playback assets.

Read [the API reference](docs/API.md) for methods, inputs, permission requirements and responses.

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | Required for durable accounts and database-backed catalogue/rights flows | Neon Postgres connection string. Keep it in local environment or Vercel project settings. |
| `PORT` | No | Local HTTP port; defaults to `4173`. |
| `VERCEL` | Set by Vercel | Selects Vercel runtime behavior. |

## Important launch limitations

- Subscription plan prices are examples. Checkout returns unavailable and does not collect card details. A hosted payment provider and subscription lifecycle integration must be implemented before monetisation.
- Only properly licensed media may be streamed. Most catalogue entries are discovery previews or trailer links; they do not grant playback rights. Big Buck Bunny is the only seeded full-film playback demo and includes the CC BY 3.0 attribution/credit requirements on its player page.
- Rights records capture territory, date range, agreement reference and SVOD/AVOD permissions. A human must verify the signed agreement; the software cannot establish legal rights.
- Password reset email delivery is not configured.
- Local JSON fallback, in-process sessions and in-process rate limits are for demonstration only. Use durable shared database/session/rate-limit infrastructure before launch.
- No upload/creator publishing, Shorts, live streaming, AI generation, ad serving or real payments are implemented yet. These belong to later phases.
- This repository does not claim regulatory compliance. Verify applicable Nigerian and regional licensing, privacy, consumer protection, tax and content classification obligations before launch.
- Never put payment card data or secrets in Nexora forms, source code, logs or commits.

## Development roadmap

1. **Phase 1 — Streaming MVP:** Complete and harden discovery, details, playback, authentication/profiles, watchlist/history, subscription architecture, admin/content and licence management.
2. **Phase 2 — Creator platform:** Creator profiles, rights-aware uploads/processing, Shorts, likes/comments/follows, reporting and moderation.
3. **Phase 3 — Monetisation:** Hosted subscriptions, ads, creator revenue and reporting.
4. **Phase 4 — Advanced features:** Live video/chat and authorised AI generation/publishing.
5. **Phase 5 — International expansion:** Regional restrictions, localised interfaces, currencies, payment methods and language support.

Do not enable paid checkout, publish content, or claim a feature is operational until its required provider, credentials, rights, and end-to-end behavior have been verified.
