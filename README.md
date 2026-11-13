# Nexora

A responsive movie and TV discovery demo inspired by the Nexora Figma screens.

## Start the demo

1. Install Node.js 20 or later.
2. Run `npm start` from this folder.
3. Open `http://localhost:4173`.

No package install or external database is needed. The first start creates `data/nexora.json` for demo accounts, watchlists, newsletter subscriptions, and submitted viewer stories.

## Pages

- `/` — landing page with featured titles, genres, platforms, product benefits, viewer stories, and newsletter signup.
- `/testimonials` — dedicated viewer stories page and review submission form.
- `/app` — signed-in style discovery home.
- `/app/discover`, `/app/trending`, `/app/top-rated`, `/app/genres`, `/app/platforms`, `/app/watchlist` — linked catalog views and filters.
- `/signin`, `/signup` — demo account flows.

The app includes a small local API for the catalog, session-based authentication, persisted watchlists, newsletter signups, and testimonial submissions. New testimonials are stored for review and do not appear publicly until approved in the database.

## Demo notes

- Create an account from `/signup` using any valid email and a password of at least eight characters.
- Watchlists work for guest visitors and are stored on the local server; accounts get their own watchlists after sign-in.
- Movie artwork and the Oswald/Inter web fonts load from their respective public CDNs. The interface retains gradient artwork and system font fallbacks if those services are unavailable.
- This is a demonstration backend, not a production streaming service. Movie data is sample content; the play action opens a title detail preview rather than a stream.

