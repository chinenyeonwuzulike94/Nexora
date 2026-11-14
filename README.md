# Nexora

A responsive movie and TV discovery demo inspired by the Nexora Figma screens.

## Start the demo

1. Install Node.js 20 or later.
2. Run `npm start` from this folder.
3. Open `http://localhost:4173`.

No package install or external database is needed. The first start creates `data/nexora.json` for demo accounts, watchlists, newsletter subscriptions, and submitted viewer stories.

## Pages

- `/` — landing page with featured titles, genres, platforms, product benefits, viewer stories, and newsletter signup.
- `/plans` — Nexora One subscription preview with proposed USD plan options; checkout is intentionally disabled.
- `/testimonials` — dedicated viewer stories page and review submission form.
- `/app` — signed-in style discovery home.
- `/app/discover`, `/app/trending`, `/app/top-rated`, `/app/genres`, `/app/platforms`, `/app/watchlist` — linked catalog views and filters.
- `/signin`, `/signup` — demo account flows.

The app includes a small local API for the catalog, session-based authentication, watchlists, newsletter signups, testimonial submissions, and a read-only subscription plan catalog. New testimonials are stored for review and do not appear publicly until approved.

## Demo notes

- Create an account from `/signup` using any valid email and a password of at least eight characters.
- Watchlists work for guest visitors and are stored on the local server; accounts get their own watchlists after sign-in.
- Movie artwork and the Oswald/Inter web fonts load from their respective public CDNs. The interface retains gradient artwork and system font fallbacks if those services are unavailable.
- This is a demonstration backend, not a production streaming service. Movie data is sample content; the play action opens a title detail or trailer preview rather than streaming platform content.
- Nexora One pricing is illustrative only. The four-platform bundle and card checkout are not live; service access requires confirmed partner arrangements and a configured hosted payment provider.
- Before a paid launch, connect a durable database and shared session/rate-limit storage. The current Vercel demo store uses temporary instance storage, so it is not suitable for production subscriptions or durable customer records.
- Card details must be collected only by the chosen hosted payment provider, never by Nexora forms or logs.
