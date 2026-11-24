# Nexora Architecture

## Product boundary

Nexora is an independent streaming product. It does not bundle, resell, or provide access to Netflix, Prime Video, Disney+, Hulu, or other third-party subscriptions. Phase 1 focuses on movie and series discovery, account profiles, watchlists and progress, rights-aware catalogue administration, and an authorised open-film player demonstration.

The project stays a modular monolith. The existing static HTML, CSS, and browser JavaScript frontend is served with the Node.js API from `lib/server.mjs`, locally and through Vercel. Neon Postgres is the durable store when `DATABASE_URL` is configured. The current stack is retained; introducing a new frontend framework or splitting services is not required for this phase.

## Three connected systems

| System | Phase 1 responsibility | Later work |
| --- | --- | --- |
| Streaming | Catalogue discovery, movie and series details, profiles, watchlists, watch progress, territory checks, rights dates, and the open-film player | Licensed adaptive playback, signed media delivery, richer recommendations, episodes and resume/next-episode flows |
| Creator | Shared user accounts and permission model only | Creator profiles, uploads, Shorts, follows, comments, moderation and Creator Studio (Phase 2) |
| Business | Illustrative plan preview, staff roles, draft catalogue management, licence review, publication gates, and rights audit history | Hosted subscription billing, advertising, creator earnings and business analytics (Phase 3) |

Live broadcasting and AI video generation are Phase 4. International expansion is Phase 5. These are not represented as working features in the current UI.

## Request and access flow

1. The browser calls same-origin JSON routes served by `lib/server.mjs`.
2. Signed-in sessions use an HTTP-only, SameSite=Lax cookie. Neon-backed sessions are stored by token hash; the raw token is not stored in the database.
3. Profile-specific watchlist and history requests include the selected profile ID. The server verifies that the profile belongs to the signed-in account.
4. Staff actions require a role from `nexora_admin_roles`. A normal signup does not grant staff access.
5. Catalogue publishing checks for current active rights and a ready playback asset. Playback also checks the request territory and rights window.
6. The only full-film player item currently enabled is the Big Buck Bunny open-film demo. Commercial titles remain discovery records or trailer links unless Nexora obtains and records the required playback rights and assets.

## Data model and migrations

`migrations/001_phase1_schema.sql` defines users, sessions, profiles, staff roles, content, rights, playback asset metadata, genres, watchlists, and watch history. Apply `migrations/002_rights_audit.sql` next for licence review history, then `migrations/003_streaming_extensions.sql` for series metadata, season and episode records, and the authorised open-film sample. The review status update and audit insert are performed together so a status change cannot succeed without its history event.

The `db/migrations/` SQL files are an older, separate schema snapshot. Do not apply them alongside the canonical ordered `migrations/001`, `002`, and `003` sequence; the required Phase 1 additions are now covered by that sequence.

## Integration boundaries and launch requirements

- Plan prices are illustrative USD preview values. Checkout returns unavailable and collects no card details until a payment provider, approved rights, taxes, and lifecycle handling are configured.
- Password reset returns a clear unavailable response until an email provider and single-use reset-token flow are configured.
- No commercial catalogue playback, user video upload, live stream, or AI generation is claimed as operational.
- The local JSON fallback and in-process session throttling are for demonstration only. Production requires Neon and shared rate limiting.
- `x-vercel-ip-country` is used for the request territory on Vercel and defaults to `NG` locally. It is an access signal, not a substitute for validating licence agreements or applicable requirements.
- Never store payment card details in Nexora. Hosted provider checkout and signed playback delivery belong behind server-side integration adapters.

## Phase sequence

1. Complete and verify the streaming MVP before broadening the product.
2. Build creator accounts, uploads, Shorts, and moderation.
3. Add subscriptions, ads, creator earnings, and reporting after providers and business approvals are ready.
4. Integrate managed live video and AI generation services without exposing provider secrets.
5. Add regional catalogues, currencies, payments, and localisations for expansion.
