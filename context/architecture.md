# Architecture: AutoNexa Platform (CAMP)

## Stack

| Layer | Tool | Purpose |
| :--- | :--- | :--- |
| **Framework** | Next.js 15 (App Router) | Full-stack framework, SSR for marketing SEO, API route proxies |
| **Styling** | Tailwind CSS v4 + Shadcn UI | Zero-runtime CSS, accessible headless UI primitives |
| **Server State** | TanStack Query v5 | Data fetching, caching, background polling, optimistic updates |
| **Client State** | Zustand | Multi-step form state (Listing Wizard), UI toggles (minimal footprint) |
| **Forms & Validation**| React Hook Form + Zod | Uncontrolled form inputs, shared schema validation with backend |
| **Localization** | `next-intl` | Server-rendered bilingual routing (`/en`, `/fr`) for Quebec Law 25 |
| **Real-time Sync** | Server-Sent Events (SSE) | Unidirectional stream for live bid counts and authoritative countdowns |
| **Client Compression**| `browser-image-compression` | Downscaling & EXIF stripping of photos before S3 upload |
| **Backend API** | Node.js + Express (External) | Source of truth, REST API, MySQL ACID transactions, BullMQ jobs |

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

*   **No Floating Point Math:** Never use standard JS floats for CAD currency. Always perform calculations on integers (cents) and format to decimals only at the very last step in the UI.
*   **No Generic Polling:** Do not use `setInterval` to poll the API for bid updates. Use the SSE listener utility in `lib/sse.ts`.
*   **No Direct Node.js Database Queries:** The Next.js app is decoupled. It communicates exclusively with the Express backend REST API via standard HTTP fetches. Do not write Prisma/MySQL code in Next.js `app/api`.
*   **Zustand vs TanStack:** Never store server responses in Zustand. Server data belongs in TanStack Query. Zustand is only for local UI state.
*   **Sealed Bid Secrecy:** Never attempt to render "Highest Bid" or "Current Bid Amount" while an auction is `ACTIVE`. The UI must only render the Bid Count.