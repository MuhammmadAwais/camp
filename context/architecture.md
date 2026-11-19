# Architecture: AutoNexa Platform (CAMP)

## Stack

| Layer | Tool | Purpose |
| :--- | :--- | :--- |
| **Framework** | Next.js 16 (App Router) on Vercel | Full-stack framework, SSR for marketing SEO, BFF Route Handlers (`app/api/**`) |
| **Styling** | Tailwind CSS v4 + Shadcn UI | Zero-runtime CSS, accessible headless UI primitives |
| **Server State** | TanStack Query v5 | Data fetching, caching, optimistic updates, cache invalidation |
| **Client State** | Zustand | Multi-step form state (Listing Wizard), ephemeral UI toggles only |
| **Forms & Validation** | React Hook Form + Zod | Uncontrolled form inputs + strict server/client schema validation |
| **Localization** | `next-intl` *(Phase B10)* | Bilingual routing (`/en`, `/fr`) for Quebec Law 25 parity; backend is i18n-ready (`language_pref`, structured error codes) from Day 1 |
| **Backend & Database** | **Supabase Cloud (AWS `ca-central-1` Montreal)** | Managed PostgreSQL 16 + PostGIS (`ST_DWithin`), Row-Level Security (RLS), atomic PL/pgSQL RPCs, `pg_cron` sweeps |
| **Auth & MFA** | **Supabase Auth (`@supabase/ssr`)** | HttpOnly secure cookie sessions refreshed in `proxy.ts`, JWT role/dealership claims, native TOTP MFA (NFR-06) |
| **Real-time Sync** | **Supabase Realtime** | WebSocket subscription to `listings.bid_count`, `status`, and authoritative `auction_ends_at` (zero bid dollar amounts broadcast) |
| **Media & Compression** | `browser-image-compression` + Storage Adapter | Client-side WebP downscaling & EXIF stripping → Direct PUT to signed upload URLs (`Supabase Storage ca-central-1` in MVP, drop-in `AWS S3 ca-central-1` adapter) |
| **Payments** | Stripe Billing (CAD) | Dealership SaaS subscription checkout, portal, idempotent signature-verified webhooks (`/api/webhooks/stripe`) |

---

## Backend Reference Architecture (Scenario 3 — Next.js 16 + Supabase `ca-central-1`)

> Authoritative blueprint: `docs/architecture/backend/03-nextjs-supabase-vercel.md` and `docs/specifications/SRS_Car_Auction_Marketplace.pdf`.
> Built on branch `feat/supabase-backend` (keeping `main` untouched on Vercel with mock APIs until Senior Backend Engineer review & production promotion).

### Strict 4-Layer Server Architecture (Crash-Proof & Senior-Reviewable)

```text
React Components (Presentation only — never call Supabase DB directly)
       │
       ├── TanStack Query hooks (hooks/*) ──► lib/api-client.ts ──► app/api/**/route.ts  [Layer 1: Thin HTTP Controllers]
       │                                                                   │               (Zod parse, handleApiRoute wrapper, RBAC guard)
       │                                                                   ▼
       │                                                       lib/server/services/*.ts   [Layer 2: Pure Domain Services]
       │                                                                   │               (Business rules BR-01..14, unit-testable, audit logging)
       │                                                      ┌────────────┴────────────┐
       │                                                      ▼                         ▼
       │                                        lib/supabase/{server,admin}.ts   lib/server/adapters/*.ts  [Layer 3: Infrastructure & External Adapters]
       │                                        (Typed DB queries & RPC calls)   (Storage, VIN, Geo, KYC, Stripe, Notifications — never crash on missing keys)
       │                                                      │
       │                                                      ▼
       │                                        Supabase Postgres 16 + PostGIS + RLS + Atomic RPCs + pg_cron  [Layer 4: Database Engine (ca-central-1)]
       │
       ├── Live Bid Count Telemetry ──────────► Supabase Realtime WebSocket (listings.bid_count & status ONLY)
       └── Direct Photo Upload ───────────────► Signed Upload URL (direct browser PUT; photos never transit Next.js)
```

### Canonical Domain Contracts (Reconciled SRS + Built UI)

1. **Listing Status State Machine (`listing_status` Postgres enum):**
   `DRAFT` → `PENDING_MODERATION` → (`EDITS_REQUESTED` | `REJECTED` | `ACTIVE`) → `UNSEALED` → (`ACCEPTED` | `EXPIRED`) → `COMPLETED` | `CANCELLED`
   - Supports relisting via `relist_count` + `parent_listing_id` (FR-EU-13 / BR-12).
   - Enforces **BR-02 (one active listing per VIN)** via a partial unique index on `listings(vin)` where `status IN ('PENDING_MODERATION', 'ACTIVE', 'UNSEALED', 'ACCEPTED')`.
2. **Two-Level Dealership RBAC:**
   - Top-level `profiles.role` (and JWT claim): `SELLER | DEALER_ADMIN | DEALER_AGENT | ADMIN` (drives RLS, `proxy.ts` routing, and mandatory TOTP MFA for `ADMIN`/`DEALER_ADMIN`).
   - Granular seat permission in `dealership_members.seat_role`: `DEALER_ADMIN | DEALER_BUYER | DEALER_INSPECTOR` (inspectors cannot place bids; only `DEALER_ADMIN` manages billing & team).
3. **Configurable Platform Timers (`platform_config` table — FR-AD-08):**
   - `auction_duration_hours = 24` (BR-03), `acceptance_window_hours = 24` (BR-08), `relist_cooldown_hours = 24` (BR-12), `min_photo_count = 8` (FR-EU-05), `default_radius_km = 100`.
4. **Crash-Proof API Envelope & Error Boundary:**
   - Every `app/api/**/route.ts` MUST wrap execution in `handleApiRoute(request, handler)` (`lib/server/http.ts`) which catches `AppError`, `ZodError`, and unexpected errors, logs structured JSON with `requestId`, and ALWAYS returns `{ data }` on success or `{ error: { code, message, fields?, requestId } }` — never raw stack traces or unhandled 500 HTML pages.
5. **Defense-in-Depth Security:**
   - Sealed-bid secrecy (H1 / BR-04) is enforced **twice**: at the Postgres RLS/View layer AND in `lib/server/services/listing.service.ts` response serialization.
   - All financial mutations (`submit_dealer_bid`, `accept_dealer_bid`, Stripe webhooks) require idempotency keys and row-level locking (`SELECT ... FOR UPDATE`).
   - `SUPABASE_SERVICE_ROLE_KEY` is strictly server-only (`lib/supabase/admin.ts`), never imported in client code, and only used where cross-tenant/system writes are explicitly required (e.g., webhooks, admin overrides, `pg_cron` reconciliation).

---

## Folder Structure

```text
/
├── AGENTS.md
├── context/
│   ├── project-overview.md
│   ├── architecture.md
│   ├── ui-tokens.md
│   ├── ui-rules.md
│   ├── ui-registry.md
│   ├── code-standards.md
│   ├── library-docs.md
│   ├── build-plan.md
│   └── progress-tracker.md
├── src/
│   ├── app/
│   │   ├── [locale]/                             → next-intl routing wrapper
│   │   │   ├── (marketing)/                      → Public Landing, Legal
│   │   │   ├── (auth)/                           → Login, KYC Registration
│   │   │   ├── (seller)/                         → Mobile-first listing & dashboards
│   │   │   ├── (dealer)/                         → High-density inventory & bidding
│   │   │   └── (admin)/                          → Moderation & Operations
│   │   └── api/                                  → Next.js API Routes (BFF/Proxy to Express)
│   ├── components/
│   │   ├── ui/                                   → shadcn/ui generic primitives only
│   │   ├── marketing/                            → Landing page components
│   │   ├── seller/                               → Damage mapper, VIN decoder UI
│   │   ├── dealer/                               → Bid slips, telemetry bars
│   │   └── shared/                               → Countdown timers, regulatory badges
│   ├── hooks/                                    → TanStack Query hooks (e.g., `useAuctions`)
│   ├── store/                                    → Zustand stores (e.g., `useListingStore`)
│   ├── lib/                                      → Utils, API clients, Zod schemas, SSE listeners
│   └── i18n/                                     → next-intl dictionaries (en.json, fr.json)


## System Boundaries

| Directory | Ownership Rules |
| :--- | :--- |
| `app/` | Page layouts, server-side data pre-fetching, and localized routing. No heavy business logic. |
| `components/` | Strictly presentation. Reads state from props or hooks. Never fetches raw APIs directly. |
| `hooks/` | Exclusive owner of TanStack Query definitions (`useQuery`, `useMutation`). |
| `store/` | Exclusive owner of Zustand stores. Only used for ephemeral client state (e.g., multi-step wizard progress). Never stores server data (let TanStack handle caching). |
| `lib/` | Reusable utilities, API fetch wrappers, and formatters (e.g., CAD cents to dollars). |

---

## Data Flow Patterns

### 1. The Listing & Media Upload Flow (Direct-to-S3)
To prevent crashing the backend VPS, media is uploaded directly from the client to AWS S3.

```text
Seller selects 15 photos in UI
        ↓
Client compresses images & strips EXIF data (Web Worker)
        ↓
Client calls POST /api/listings/media/presign (requests 15 URLs)
        ↓
Backend returns 15 presigned AWS S3 PUT URLs
        ↓
Client executes parallel PUT requests directly to S3
        ↓
Client submits final listing payload (including S3 object keys) to Backend
```

### 2. The Real-Time Bidding Flow (SSE)
We do not use `setInterval` for auction timers, as client clocks drift and can be manipulated.

```text
Dealer opens Active Auction page
        ↓
Client establishes SSE (Server-Sent Events) connection to Backend
        ↓
Backend pushes { auction_ends_at: timestamp, current_bid_count: N }
        ↓
UI renders countdown based strictly on server time delta
        ↓
Dealer submits sealed bid (TanStack useMutation)
        ↓
Backend validates bid -> Broadcasts new current_bid_count via SSE to all clients
```

---

## API & State Expectations (Frontend View)
The frontend expects the backend API to adhere to these data contracts:

### Listings
*   **Amounts:** All financial values (asking price, bids) must be returned and sent as integer cents (e.g., $42,500.00 = `4250000`).
*   **Dates:** All timestamps must be ISO 8601 UTC strings.
*   **Data Hiding:** When fetching a listing as a Dealer, the bids array must be `null` or obscured. When fetching as a Seller, only the `bid_count` is exposed while `status === 'ACTIVE'`.

### User Session (JWT)
*   **Authentication:** Utilizes short-lived JWT Access Tokens (stored in memory/Zustand) and HttpOnly secure Refresh Tokens.
*   **RBAC:** Validation relies on the `role` claim in the JWT (`SELLER`, `DEALER_ADMIN`, `DEALER_AGENT`, `ADMIN`).

---

## Auth Session & Mock API (as built, 2026-10-10)

*   **Session:** `POST /api/auth/login` (or the final OTP verify) returns `{ accessToken, user }` and sets the HttpOnly `autonexa_rt` refresh cookie. The access token lives only in `store/useSessionStore.ts`; `lib/api-client.ts` attaches it and, on a 401, calls `POST /api/auth/refresh` once (concurrent 401s share one refresh) and retries.
*   **Route protection:** `proxy.ts` redirects to `/login?next=…` when the refresh cookie is absent (optimistic only). `components/auth/RequireSession.tsx` handles expired cookies client-side. The real API must therefore be same-site (or proxied through Next) so the cookie is visible to `proxy.ts`.
*   **Mock backend:** `app/api/**` route handlers + `lib/mock/*` (in-memory, resets on restart) implement the seller auth/KYC/VIN contract. Leave `NEXT_PUBLIC_API_URL` unset to use them; set it to the Express origin to switch every hook over. Mocks return 404 in production unless `ENABLE_MOCK_API=true`. Demo account, OTP code and demo VINs live in `lib/mock/seed.ts`.
*   **Seller funnel endpoints:** `POST /api/vin/decode`, `POST /api/auth/register`, `GET /api/auth/registrations/:id`, `POST /api/auth/verify/{email|phone}`, `POST /api/auth/verify/resend`, `POST /api/auth/login|refresh|logout`, `GET /api/auth/me`, `POST /api/auth/password/forgot|reset`, `POST /api/kyc/submissions` (multipart), `GET /api/kyc/status`.

---

## Invariants
Rules the Antigravity AI agent must never violate:

*   **No Floating Point Math:** Never use standard JS floats for CAD currency. Always store/process as integer cents (`BIGINT` in Postgres, `number` integer cents in TypeScript) and format to decimals only at the very last step in the UI.
*   **No Generic Polling:** Do not use `setInterval` to poll the API for live bid counts or countdown clocks. Use Supabase Realtime (`hooks/useAuctionRealtime.ts`) synced to authoritative server `auction_ends_at`.
*   **Strict Server Layering (No DB Calls in React Components):** React components NEVER call `supabase.from(...)` directly. All CRUD & mutations go through TanStack Query hooks → `lib/api-client.ts` → `app/api/**/route.ts` → `lib/server/services/*.ts` → Supabase/Postgres RPCs. Browser Supabase client is strictly limited to Realtime subscriptions and Auth/MFA helpers.
*   **Zero Unhandled Crashes:** Every Route Handler MUST run inside `handleApiRoute(...)` with Zod validation and typed `AppError` handling so raw DB errors or stack traces never escape.
*   **Zustand vs TanStack:** Never store server responses in Zustand. Server data belongs in TanStack Query. Zustand is only for local UI state (e.g., listing wizard draft).
*   **Sealed Bid Secrecy (Defense-in-Depth):** Never return or render "Highest Bid" or individual bid amounts/dealer identities while an auction is `ACTIVE`. Enforced simultaneously by Postgres RLS/Views AND `lib/server/services/listing.service.ts`. Only `bidCount` is exposed.