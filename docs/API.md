# Nexora API reference

Base path: `/api`. Responses use JSON unless a route streams a media asset. Mutating requests must be same-origin and send `Content-Type: application/json`. JSON request bodies are limited to 64 KB.

## Health and catalogue

| Method | Path | Behavior |
|---|---|---|
| GET | `/api/health` | Health status and seeded catalogue count. |
| GET | `/api/movies?q=&genre=&type=&sort=` | Search and filter the seeded catalogue plus published, rights-cleared database titles for the request territory. `sort=rating` sorts by rating. |
| GET | `/api/movie?id={id}` | Compatibility route for one movie; delegates to the movie detail route. |
| GET | `/api/movies/{id}` | Return one seeded title or a published database title currently licensed in the request territory. |
| GET | `/api/content/{id}/playback` | Return playable assets only when active demo playback rights cover the detected territory and a ready open-film asset exists. |
| GET | `/api/playback?id={id}` | Compatibility route for the playback endpoint. |

The server uses Vercel's `x-vercel-ip-country` country header when present and defaults to `NG` locally. The browser must still obey the title's own licensing terms; an API response is not a substitute for the licence. The open-film player seed and its authorised assets are installed by `migrations/003_streaming_extensions.sql` after migrations 001 and 002.

## Authentication and profiles

| Method | Path | Behavior |
|---|---|---|
| GET | `/api/auth?action=me` | Return the current user, or `null`. |
| POST | `/api/auth?action=register` | Register with `{ "name", "email", "password" }`. Password must be at least 8 characters and pass the weak-password checks. |
| POST | `/api/auth?action=login` | Sign in with `{ "email", "password" }`. |
| POST | `/api/auth?action=logout` | Revoke the current session and clear its cookie. |
| POST | `/api/auth?action=forgot-password` | Validates the email and returns an explicit not-configured response; password reset email delivery is not implemented. |
| GET | `/api/profiles` | List the signed-in user's profiles. |
| POST | `/api/profiles` | Add a profile with `{ "name", "isKids" }`; maximum five profiles per account. |

Sessions use an HTTP-only, SameSite=Lax cookie and have a seven-day expiry. When `DATABASE_URL` is configured, users, sessions and profiles use Neon Postgres. A production deployment must configure this variable and verify the database schema before relying on account persistence.

## Watchlist and progress

| Method | Path | Behavior |
|---|---|---|
| GET | `/api/watchlist` | List saved title IDs for the current user or demo guest. |
| POST | `/api/watchlist` | Save a title with `{ "id" }`. |
| DELETE | `/api/watchlist/{id}` | Remove a saved title. |
| DELETE | `/api/watchlist-remove?id={id}` | Compatibility route to remove a saved title. |
| GET | `/api/watch-history` | Return the signed-in user's progress for the selected profile. |
| POST | `/api/watch-history` | Save `{ "id", "positionSeconds", "durationSeconds", "completed" }`; playback and territory rights are checked by the server. |

Signed-in profile selection is sent with `x-nexora-profile`; the server verifies the profile belongs to the authenticated user.

## Subscription preview

| Method | Path | Behavior |
|---|---|---|
| GET | `/api/subscription/plans` | Return the illustrative USD Free, Plus and Family plans with `checkoutEnabled: false`. |
| POST | `/api/subscription/checkout` | Returns HTTP 503 while payment checkout is disabled. It does not accept or store card details. |

Do not treat preview plan prices as launch prices. A hosted payment provider, approved content rights, taxes, customer support and subscription lifecycle handling must be configured before collecting money.

## Testimonials and newsletter

| Method | Path | Behavior |
|---|---|---|
| GET | `/api/testimonials` | Return seeded stories and user submissions that an administrator has approved. |
| POST | `/api/testimonials` | Submit `{ "name", "role", "quote", "rating" }`; new items are pending review. |
| POST | `/api/newsletter` | Subscribe using `{ "email" }`; current implementation stores demo signups in the server's demo store. |

## Admin content and rights

All routes below require an authenticated account with the appropriate role stored in `nexora_admin_roles`. A normal signup does not grant an admin role.

| Method | Path | Role | Behavior |
|---|---|---|---|
| GET | `/api/admin/content` | Admin, catalogue editor, rights manager | List catalogue records and their rights. |
| POST | `/api/admin/content` | Admin, catalogue editor | Create a draft movie or series record; optional poster URLs are restricted to approved HTTPS hosts. |
| POST | `/api/admin/content?action=rights&id={id}` | Admin, rights manager | Add a pending rights record with territory, agreement reference, dates and SVOD/AVOD flags. |
| POST | `/api/admin/content?action=rights-review&id={id}` | Admin, rights manager | Activate an eligible pending licence or revoke active rights using `{ "rightId", "status" }`. Optional review notes are limited to 500 characters. Each successful review records an audit event atomically with the status change. |
| GET | `/api/admin/content/{id}/rights-history?rightId={rightId}` | Admin, rights manager | Read up to 200 newest rights-review audit events for a title, optionally narrowed to one licence. |
| POST | `/api/admin/content?action=publish&id={id}` | Admin, catalogue editor | Publish only when active rights and a ready playback asset exist. |

## Error behavior and security

- Validation errors return 400; unauthenticated requests return 401; insufficient roles return 403; unavailable or unconfigured capabilities return 503.
- Mutations with a cross-origin `Origin` header are rejected. Missing `Origin` is accepted for non-browser/local clients.
- Authentication attempts are limited per source IP in process memory. For production, replace this with a shared rate limiter.
- Never send card data to Nexora API routes. Use a payment provider's hosted checkout when configured.
- The local JSON demo store and process-memory session/rate-limit state are not durable shared production storage.
