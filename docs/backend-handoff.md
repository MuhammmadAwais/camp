# AutoNexa / CAMP — Reference Backend Architecture & Senior Engineer Handoff Manual

> **Branch:** `feat/supabase-backend` (leaves `main` and `camp-amber.vercel.app` mock-mode deployment untouched)  
> **Stack:** Next.js `16.3.5` App Router BFF + Supabase Cloud (`@supabase/supabase-js` `2.119.2`, `@supabase/ssr` `0.12.7`, Postgres 16 + PostGIS + `pg_cron` + Realtime + Storage) + Stripe SDK `^23.2.0` + Upstash Redis REST + Vitest `^3.2.7`  
> **Scope:** Canadian 24-hour sealed-bid wholesale vehicle auction marketplace across Ontario (`OMVIC`), Alberta (`AMVIC`), British Columbia (`VSA`), and Quebec (`OPC`), adhering to PIPEDA, Quebec Law 25, CASL, and integer CAD cents accounting.

---

## 1. Architecture Overview & Layer Boundaries

The backend strictly follows a 4-layer architecture so no React component talks directly to Postgres and external vendors stay swappable behind adapter boundaries:

1. **Request Edge Proxy (`proxy.ts` → `lib/supabase/proxy.ts`):**
   - Intercepts all non-static routes via `updateSession()`.
   - Bypasses `/api/webhooks/*` immediately so Stripe raw-body HMAC verification is untouched.
   - Refreshes `@supabase/ssr` cookies and validates session JWTs via `supabase.auth.getClaims()`.
   - Enforces portal RBAC (`SELLER`, `DEALER_ADMIN`, `DEALER_AGENT`, `ADMIN`) using `app_metadata.role` synced by Postgres triggers (`sync_profile_claims_to_auth`).
2. **Thin App Router BFF Route Handlers (`app/api/**/route.ts` — 59 routes):**
   - Wrapped in `handleApiRoute()` (`lib/server/http.ts`) with Zod `parseBody()` / `parseQuery()` and uniform envelopes: `{ data }` on success or `{ error: { code, message, fields?, details?, requestId } }` on failure.
   - Zero Next.js Server Actions for standard CRUD or mutations.
   - Auth helpers in `lib/server/auth.ts`: `getSessionContext()`, `requireAuth()`, `requireRole()`, `requireKycVerified()`, `requireActiveDealership()`, and `requireAal2ForPrivilegedRoles()` (enforces TOTP AAL2 MFA for `ADMIN` and `DEALER_ADMIN` on privileged mutations).
   - Domain namespaces:
     - `/api/auth/*` (15 routes): `login`, `register`, `logout`, `me`, `session`, `refresh`, `dev-switch`, `password/forgot`, `password/reset`, `registrations/[registrationId]`, `verify/[channel]`, `verify/resend`, `mfa/enroll`, `mfa/factors`, `mfa/verify`
     - `/api/listings/*` & `/api/seller/dashboard` & `/api/vin/decode` (7 routes)
     - `/api/dealer/*` (12 routes): `register`, `inventory`, `inventory/[id]`, `bid`, `active-bids`, `won-matches`, `won-matches/[id]/outcome`, `team`, `team/[memberId]`, `subscription`, `subscription/checkout`, `subscription/portal`, `billing/invoices`
     - `/api/admin/*` (13 routes): `moderation`, `moderation/[id]`, `dealers`, `dealers/[id]`, `auctions`, `auctions/[id]/override`, `disputes`, `disputes/[id]`, `analytics`, `audit-log`, `config`, `subscriptions`, `users/[id]`
     - `/api/kyc/*` (`status`, `submissions`), `/api/disputes/*` (`disputes`, `disputes/evidence/presign`), `/api/notifications/*` (`notifications`, `notifications/unsubscribe`), `/api/settings/*` (`profile`, `security`, `privacy/export`, `privacy/delete`), `/api/webhooks/stripe`, and `/api/mock/s3-upload`
3. **Pure Service Layer (`lib/server/services/*` — 20 modules):**
   - `auth.service.ts`, `mfa.service.ts`, `kyc.service.ts`, `listing.service.ts`, `moderation.service.ts`, `dealer-feed.service.ts`, `bidding.service.ts`, `fulfillment.service.ts`, `dealer-matches.service.ts`, `dealer-verification.service.ts`, `dealer-team.service.ts`, `dispute.service.ts`, `billing.service.ts`, `stripe-webhook.service.ts`, `notification.service.ts`, `admin-auctions.service.ts`, `admin-analytics.service.ts`, `admin-audit.service.ts`, `settings.service.ts`, `privacy.service.ts`.
4. **Swappable External Adapters (`lib/server/adapters/*` — 6 modules):**
   - `billing.adapter.ts`: Stripe Checkout Sessions (CAD), Customer Billing Portal, HMAC-verified webhook construction.
   - `geo.adapter.ts`: Canadian FSA lookup (`public.postal_centroids`) + provincial centroid fallback + PostGIS WKT formatting (`formatPointWkt`) + Haversine helper.
   - `kyc.adapter.ts`: `SandboxKycAdapter` (discards raw ID bytes in memory) vs. private `kyc-docs` storage / external provider boundary controlled by `KYC_MODE`.
   - `notification.adapter.ts`: Bilingual EN/FR notification templates across 16 events (`IN_APP`, SendGrid/Resend email, Twilio SMS, signed HMAC CASL unsubscribe tokens).
   - `storage.adapter.ts`: Dual driver selected via `STORAGE_DRIVER` (`SupabaseStorageAdapter` or pure-Node AWS SigV4 `S3StorageAdapter` targeting `ca-central-1` with optional `AWS_CLOUDFRONT_URL`).
   - `vin.adapter.ts`: ISO 3779 check-digit validation, 30-day DB caching in `public.vin_decode_cache`, and NHTSA vPIC lookup (`3000ms` timeout with clean `MANUAL` fallback).

### Non-Negotiable Platform Invariants
- **Sealed-Bid Secrecy (H1 / BR-04):** While a listing is `ACTIVE`, sellers and competing dealers receive **only `bidCount`** (`bid_count`). Bid dollar amounts and dealer identities are stripped in both Postgres RLS (`bids_sealed_select`) and `listing.service.ts` serializers until `UNSEALED`/`ACCEPTED`/`COMPLETED`/`EXPIRED`.
- **Integer CAD Cents (`BIGINT`, NFR-14):** All prices, reserves, bids, settlements, dispute adjustments, and subscription fees are stored and calculated strictly as whole integer cents (`currency = 'CAD'`).
- **Tamper-Evident Audit Trail (H8 / NFR-11):** All sensitive state transitions write to append-only `public.audit_logs`, protected by `trg_audit_logs_immutable` (`UPDATE`/`DELETE` blocked except PostgreSQL `ON DELETE SET NULL` on `actor_id` during user deletion per Migration `0010`) and linked by a SHA-256 hash chain (`compute_audit_entry_hash` / `verify_audit_log_chain()`).

---

## 2. Database ERD Summary (23 Public Tables + Views + PostGIS + RPCs)

All public tables enforce Row-Level Security (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`). Migrations `0002` and `0008` define **23 public tables** across four domains:

### Domain A — Identity, Consent & Compliance
- `public.profiles` (1:1 `auth.users(id)` `ON DELETE CASCADE`): role (`SELLER` | `DEALER_ADMIN` | `DEALER_AGENT` | `ADMIN`), `kyc_status`, `dealership_id`, `language_pref` (`'en'` | `'fr'`), `location` (`geography(Point, 4326)`), `mfa_enabled`, `notification_preferences` (added in `0014`), `account_status` (`ACTIVE` | `SUSPENDED` | `PENDING_DELETION` | `DELETED`), `deletion_requested_at`.
- `public.user_consents`: Timestamped PIPEDA / Quebec Law 25 / CASL / KYC biometric consent ledger.
- `public.kyc_submissions`: 1:1 per user tracking `provider`, `id_doc_type` (`DRIVERS_LICENCE` | `PASSPORT`), private storage paths (`kyc-docs`), and review status.
- `public.auth_challenges` (added in `0008`): Serverless hashed two-channel OTP verification state (`email_code_hash`, `phone_code_hash`, attempt counters, 30-min expiry).

### Domain B — Licensed Dealerships & SaaS Billing
- `public.dealerships`: Regulator (`OMVIC` | `AMVIC` | `VSA` | `OPC`), unique `(regulator, license_number)`, `status` (`PENDING` | `VERIFIED` | `REJECTED` | `SUSPENDED` | `REVOKED`), PostGIS `location`, `service_radius_km` (10–1000).
- `public.dealership_members`: Multi-seat dealership staff (`DEALER_ADMIN`, `DEALER_BUYER`, `DEALER_INSPECTOR`), `is_active`, unique `(dealership_id, user_id)`.
- `public.plans`: Monthly & annual CAD plans (`basic-monthly`, `pro-monthly`, `enterprise-monthly`, `basic-annual`, `pro-annual`, `enterprise-annual`), `monthly_bid_quota`, `max_radius_km`, `max_team_seats`, `stripe_price_id`.
- `public.subscriptions`: 1:1 per dealership tracking `plan_id`, `status` (`ACTIVE` | `TRIALING` | `PAST_DUE` | `EXPIRED` | `CANCELLED`), `stripe_customer_id`, `stripe_subscription_id`, period window, and `bids_used`.
- `public.payments`: Integer-cent CAD invoices (`invoice_number`, `stripe_invoice_id`, `status`: `PAID` | `FAILED` | `REFUNDED` | `OPEN`).
- `public.stripe_webhook_events`: Idempotency log keyed by Stripe `event_id`.

### Domain C — Vehicle Auctions, Sealed Bids & Fulfillment
- `public.listings`: Seller vehicle lot (`seller_id`, `vin`, specs, Carfax summary, `damage_grade`, `postal_code`, PostGIS `location`, `reserve_price_cents`, `status` enum, `bid_count`, `auction_started_at`, `auction_ends_at`, `closed_at`, `relist_count`, `parent_listing_id`). Enforces partial unique index `uniq_listings_active_vin` (`BR-02`).
- `public.listing_media`: Ordered vehicle photos (EXIF scrubbed client-side in `components/seller/wizard/PhotoUploadStep.tsx`), `is_cover`, `sort_order`.
- `public.damage_hotspots`: Vehicle condition diagram markers (`viewpoint`, `x_percent`, `y_percent`, `panel`, `severity`).
- `public.bids`: Sealed offers (`listing_id`, `dealership_id`, `amount_cents BIGINT`, `status` enum, `version`, `revision_count`, `idempotency_key UNIQUE`, `UNIQUE(listing_id, dealership_id)`). Upward-only revisions handled exclusively inside `submit_dealer_bid()`.
- `public.matches`: Accepted dealer offer + appointment voucher (`listing_id UNIQUE`, `winning_bid_id UNIQUE`, `voucher_code UNIQUE`, `agreed_amount_cents`, `accept_expires_at`, `outcome` enum, `final_price_cents`).
- `public.disputes` & `public.dispute_timeline`: Hoist-inspection arbitration dockets (`docket_number`, `category` enum, `disputed_adjustment_cents`, `net_settlement_cents`, `evidence_photos_json`, `resolution_decision`).

### Domain D — Notifications, Geo Cache, Platform Config & Audit Trail
- `public.notifications` & `public.notification_deliveries`: Persistent in-app notifications + per-channel delivery ledger (`IN_APP`, `EMAIL`, `SMS`, `PUSH`).
- `public.postal_centroids`: Seeded Canadian FSA (`postal_prefix` char(3)) coordinates + PostGIS `location` (`GIST`).
- `public.vin_decode_cache`: 30-day cached NHTSA vPIC responses keyed by 17-char VIN.
- `public.platform_config`: Runtime rules (`auction_duration_hours = 24`, `acceptance_window_hours = 24`, `relist_cooldown_hours = 24`, `min_photo_count = 8`, `default_radius_km = 100`).
- `public.audit_logs`: Append-only `BIGINT IDENTITY` ledger with `immutable_hash` SHA-256 chain.

### Views, Spatial Indexes & Key Postgres RPCs
- **Views:** `public.public_auction_telemetry` (`listing_id, status, auction_started_at, auction_ends_at, closed_at, bid_count`), `public.admin_analytics_settlement_ledger`, `public.admin_analytics_provincial_summary`, `public.admin_analytics_metro_velocity`, `public.admin_analytics_dealer_leaderboard` (all `WITH (security_invoker = true)`).
- **PostGIS GiST Indexes (`0003`):** `idx_profiles_location_gist`, `idx_dealerships_location_gist`, `idx_listings_location_gist`, `idx_postal_centroids_location_gist`.
- **Critical Functions & RPCs:**
  - `public.submit_dealer_bid(...)` (`0005`): Row-locks listing & subscription, enforces `ACTIVE` auction, verified dealership, `DEALER_ADMIN`/`DEALER_BUYER` seat, HTTP 402 quota/past-due check, upward-only revision, idempotency key, and atomic `bid_count` increment.
  - `public.accept_dealer_bid(...)` (`0005`): Locks `UNSEALED` listing, creates `ACCEPTED` state, winning/losing bid statuses, and `APPOINTMENT_CONFIRMED` voucher match.
  - `public.get_dealer_inventory_with_distance(...)`, `public.get_dealership_listing_distances(...)`, `public.get_unsealed_bid_distances(...)` (`0011`): PostGIS `ST_DWithin` / `ST_Distance` sourcing radius & distance (`km`) calculations.
  - `public.transition_dealership_status_and_void_bids(...)` (`0012`): Atomic `BR-14` suspension/revocation voiding all active bids and decrementing `listings.bid_count`.
  - `public.verify_audit_log_chain()` & `public.get_admin_platform_analytics(...)` (`0013`): Cryptographic audit chain integrity verifier and parameterized analytics RPC.
  - `public.get_eligible_dealerships_within_radius(...)` (`0016`): `service_role`-only PostGIS fan-out recipient query.
  - `private.close_expired_auctions()` & `private.expire_overdue_matches()` (`0005` upgraded in `0016`): Scheduled via `pg_cron` (`0006`) every minute (`* * * * *`), writing bilingual EN/FR notifications (`IN_APP`) and audit entries.
  - **Supabase Realtime Publication (`0006`):** `public.listings` and `public.notifications` added to `supabase_realtime`.

---

## 3. Ordered Migration Manifest (`0001`–`0017` + Manual `0017b`)

Apply `supabase/migrations/*.sql` strictly in numeric filename order:

| Order | File | Purpose |
| :--- | :--- | :--- |
| 01 | `supabase/migrations/0001_extensions_and_enums.sql` | Installs `pgcrypto`, `postgis` (`extensions`), `pg_cron` (`pg_catalog`) and all 14 domain enums. |
| 02 | `supabase/migrations/0002_core_tables.sql` | Creates core normalized tables (`platform_config` through `audit_logs`), BIGINT cent checks, and enables RLS on all 22 tables. |
| 03 | `supabase/migrations/0003_indexes_and_constraints.sql` | Adds `uniq_listings_active_vin` (`BR-02`), 4 PostGIS GiST indexes, full FK coverage indexes, and `set_updated_at()` triggers. |
| 04 | `supabase/migrations/0004_rls_policies.sql` | Creates `private` schema, 9 `SECURITY DEFINER` RLS helpers, `audit_logs` immutability trigger, table policies, and `public_auction_telemetry` view. |
| 05 | `supabase/migrations/0005_rpc_functions.sql` | Adds auth sync triggers (`handle_new_auth_user`, `sync_profile_claims_to_auth`), `submit_dealer_bid`, `accept_dealer_bid`, and cron workers. |
| 06 | `supabase/migrations/0006_pg_cron_and_realtime.sql` | Schedules 1-minute `pg_cron` jobs (`close-expired-auctions`, `expire-overdue-matches`) and adds `listings` & `notifications` to `supabase_realtime`. |
| 07 | `supabase/migrations/0007_seed_demo.sql` | Seeds default `platform_config`, initial monthly plans, starter FSA centroids, and demo dealership/listings fixtures. |
| 08 | `supabase/migrations/0008_auth_challenges.sql` | Creates `public.auth_challenges` table (RLS enabled, `REVOKE ALL` from client roles) and hardens auth trigger function privileges. |
| 09 | `supabase/migrations/0009_storage_buckets.sql` | Provisions `listing-media` (public), `kyc-docs` (private), and `dispute-evidence` (private) storage buckets + `storage.objects` policies. |
| 10 | `supabase/migrations/0010_audit_logs_erasure_compat.sql` | Updates `prevent_audit_log_mutation()` so Postgres FK `ON DELETE SET NULL` anonymizes `actor_id` on user deletion while rejecting all other updates/deletes. |
| 11 | `supabase/migrations/0011_postal_centroids_and_geo_rpc.sql` | Seeds ~115 Canadian FSA centroids across all 13 provinces/territories and adds PostGIS radius/distance RPCs. |
| 12 | `supabase/migrations/0012_dealer_verification_br14_rpc.sql` | Adds atomic `transition_dealership_status_and_void_bids()` (`BR-14`). |
| 13 | `supabase/migrations/0013_analytics_views_and_audit_hash.sql` | Adds SHA-256 chain trigger (`set_audit_log_hash`), `verify_audit_log_chain()`, 4 analytics views, and `get_admin_platform_analytics()`. |
| 14 | `supabase/migrations/0014_profile_notification_prefs.sql` | Adds `profiles.notification_preferences` JSONB column. |
| 15 | `supabase/migrations/0015_annual_plans_and_seed_invoices.sql` | Seeds annual CAD plans (`basic-annual`, `pro-annual`, `enterprise-annual`) and initial invoice history. |
| 16 | `supabase/migrations/0016_notifications_fanout_and_cron.sql` | Adds `get_eligible_dealerships_within_radius()` and upgrades `close_expired_auctions` / `expire_overdue_matches` to emit bilingual notifications. |
| 17 | `supabase/migrations/0017_security_and_perf_hardening.sql` | Non-destructive Advisor hardening: explicit `auth_challenges_deny_client` policy + revokes client execute on `rls_auto_enable()`. |
| Manual | `supabase/manual/0017b_split_rls_write_policies.sql` | **Manual / CLI promotion script:** splits 8 `FOR ALL` write policies (`platform_config`, `plans`, `postal_centroids`, `vin_decode_cache`, `subscriptions`, `payments`, `listing_media`, `damage_hotspots`) into explicit `INSERT`/`UPDATE`/`DELETE` policies so Supabase Performance Advisor `multiple_permissive_policies` warnings drop to 0. Separated because hosted MCP blocks `DROP POLICY` confirmations. Run via Supabase Dashboard SQL Editor or `supabase db push` during production promotion. |

---

## 4. RLS Policy Matrix & Security Hardening

RLS helpers live in non-exposed schema `private` (`0004_rls_policies.sql`) as `STABLE SECURITY DEFINER SET search_path = ''` functions (`current_user_role()`, `is_admin()`, `current_dealership_id()`, `is_verified_dealer()`, `is_dealer_admin_of()`, `dealer_has_bid_on_listing()`, `is_unsealed_seller_listing()`, `is_listing_editable_by_owner()`, `is_match_participant()`).

| Table | `anon` | `SELLER` | `DEALER_ADMIN` / `DEALER_AGENT` | `ADMIN` | `service_role` |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `platform_config` | None | `SELECT` | `SELECT` | Full (`SELECT`/Write) | Bypass |
| `plans` | `SELECT` (`is_active`) | `SELECT` (`is_active`) | `SELECT` (`is_active`) | Full (`SELECT`/Write) | Bypass |
| `postal_centroids`, `vin_decode_cache` | None | `SELECT` | `SELECT` | Full (`SELECT`/Write) | Bypass |
| `profiles` | None | Own row `SELECT`/`UPDATE` (role/dealership locked) | Own row + same dealership `SELECT`; self `UPDATE` | Full | Bypass |
| `user_consents` | None | Own rows `SELECT`/`INSERT` | Own rows `SELECT`/`INSERT` | Full `SELECT`/`INSERT` | Bypass |
| `kyc_submissions` | None | Own row `SELECT`/`INSERT`/`UPDATE` while `<> VERIFIED` | Same as own user | Full | Bypass |
| `auth_challenges` | Deny (`0017`) | Deny (`0017`) | Deny (`0017`) | Deny (`0017`) | Exclusively server-managed |
| `dealerships` | None | `SELECT` `VERIFIED` only | Own dealership + `VERIFIED` `SELECT`; `PENDING` `INSERT`; `DEALER_ADMIN` non-status `UPDATE` | Full | Bypass |
| `dealership_members` | None | None | Same dealership `SELECT`; `DEALER_ADMIN` `INSERT`/`UPDATE`/`DELETE` | Full | Bypass |
| `subscriptions`, `payments` | None | None | Own dealership `SELECT` only | Full | Bypass (webhook writes) |
| `stripe_webhook_events` | None | None | None | `SELECT` | Bypass |
| `listings` | None | Own `SELECT`; `DRAFT`/`PENDING_MODERATION` `INSERT`; editable `UPDATE` | `SELECT` if verified dealer AND (`ACTIVE` OR has bid on listing) | Full | Bypass |
| `listing_media`, `damage_hotspots` | None | Readable when parent listing readable; editable while listing editable | Readable when parent listing readable | Full | Bypass |
| `bids` (**H1 / BR-04**) | None | **`SELECT` ONLY when `is_unsealed_seller_listing(listing_id)`** (`0 rows` while `ACTIVE`) | `SELECT` **only own dealership's bids**; **no direct `INSERT`/`UPDATE`/`DELETE`** (RPC only) | `SELECT` | Bypass |
| `matches` | None | Own `seller_id` `SELECT` | Own `dealership_id` `SELECT`/`UPDATE` | Full | Bypass |
| `disputes`, `dispute_timeline` | None | Participant `SELECT`/`INSERT` | Participant `SELECT`/`INSERT` | Full | Bypass |
| `notifications` | None | Own `user_id` `SELECT`/`UPDATE` | Own `user_id` `SELECT`/`UPDATE` | Full | Bypass |
| `notification_deliveries` | None | Own `user_id` `SELECT` | Own `user_id` `SELECT` | `SELECT` | Bypass |
| `audit_logs` (**NFR-11**) | None | None | None | `SELECT` only (`UPDATE`/`DELETE`/`TRUNCATE` blocked by trigger & grants) | `INSERT` only (`UPDATE`/`DELETE` trigger-blocked except FK `SET NULL`) |

### Application Security & Privacy Controls
- **TOTP MFA (`NFR-06`, `lib/server/services/mfa.service.ts`, `lib/server/auth.ts`):** `ADMIN` and `DEALER_ADMIN` accounts require verified AAL2 (`requireAal2ForPrivilegedRoles`) via `/settings/security` (`/api/auth/mfa/*`).
- **Sliding-Window Rate Limiting (`NFR-07`, `lib/server/rate-limit.ts`):** Upstash Redis REST pipeline (`ZREMRANGEBYSCORE` / `ZCARD` / `ZADD` / `PEXPIRE`) with in-memory fallback across 8 policies:
  - `auth_login` (`10 / 15m`), `auth_register` (`5 / 15m`), `auth_verify` (`5 / 15m`), `auth_password_forgot` (`5 / 15m`), `dealer_bid` (`30 / 1m`), `vin_decode` (`20 / 1m`), `privacy_export` (`5 / 15m`), `privacy_delete` (`3 / 15m`).
- **OWASP Headers & CSP (`next.config.ts`):** Sets `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, and `Content-Security-Policy` (`'unsafe-eval'` stripped when `NODE_ENV === 'production'`).
- **PIPEDA & Quebec Law 25 Data Portability & Erasure (`lib/server/services/privacy.service.ts`):**
  - `GET /api/settings/privacy/export` (`?download=1` attachment): exports profile, consents, KYC metadata, owned listings, bids (preserving `ACTIVE` sealed-bid secrecy), matches, disputes, and notifications.
  - `POST /api/settings/privacy/delete`: requires exact confirmation `"DELETE MY ACCOUNT"`, blocks deletion while open obligations (`ACTIVE`/`UNSEALED`/`ACCEPTED` listings, active matches, open disputes) exist, marks `account_status = 'PENDING_DELETION'` with a 30-day grace window, records audit trail, and revokes auth session.

---

## 5. Complete Environment Variable Reference

Defined in `lib/server/env.ts` (`getPublicSupabaseEnv()`, `getServerEnv()`) and `.env.example` (plus helper flags in `lib/api-client.ts`, `lib/session.ts`, `lib/server/services/auth.service.ts`):

| Variable | Scope | Required | Default | Purpose / Production Notes |
| :--- | :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Yes | — | Supabase project URL. **Prod MUST be AWS `ca-central-1` (Montreal) for NFR-09.** |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public | Yes* | — | Supabase publishable client key (*or legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY`). |
| `SUPABASE_SECRET_KEY` | Server | Yes* | — | Supabase elevated server key (*or legacy `SUPABASE_SERVICE_ROLE_KEY`). **Never expose via `NEXT_PUBLIC_`.** |
| `NEXT_PUBLIC_APP_URL` | Public | Recommended | Request origin fallback | Canonical origin (`https://autonexa.ca`) for Stripe redirects, CASL links, and password reset URLs. |
| `ENABLE_MOCK_API` | Server/Edge | Recommended | `"false"` | Set `"false"` in Supabase backend / Production (`"true"` is only for static UI mock mode on `main`). |
| `STORAGE_DRIVER` | Server | Optional | `"supabase"` | `"supabase"` (buckets in `0009`) or `"s3"` (AWS S3 `ca-central-1` SigV4 in `storage.adapter.ts`). |
| `KYC_MODE` | Server | Optional | `"sandbox"` | `"sandbox"` | `"manual"` | `"provider"`. Switch to `"provider"` once Persona/Onfido/Trulioo is wired. |
| `ALLOW_DEMO_AUTH` | Server | Optional | `false` | Enables seeded sandbox shortcuts in dev/preview. **MUST be `"false"` or unset in Production.** |
| `ENABLE_DEMO_SWITCH` | Server | Optional | `false` | Enables `/api/auth/dev-switch` role switcher. **MUST be `"false"` or unset in Production.** |
| `DEMO_ACCOUNT_PASSWORD` | Server/Seed | Optional | `"password123"` (dev fallback) | Override password for `scripts/seed-auth-users.ts` / preview demo switch. **Do not seed demo users in Production.** |
| `STRIPE_SECRET_KEY` | Server | Prod billing | — | Live `sk_live_...` Stripe secret key (`CAD`). Without it, checkout/portal return `503 BILLING_NOT_CONFIGURED`. |
| `STRIPE_WEBHOOK_SECRET` | Server | Prod billing | — | Stripe webhook endpoint signing secret (`whsec_...`) for `/api/webhooks/stripe`. |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Public | Optional | — | Stripe publishable key documented in `.env.example` for frontend Stripe Elements if added later. |
| `SENDGRID_API_KEY` | Server | Optional | — | Primary email transport in `notification.adapter.ts` (logs `SANDBOX_LOGGED` if no email provider key is set). |
| `RESEND_API_KEY` | Server | Optional | — | Alternative/secondary email transport if SendGrid key is absent. |
| `EMAIL_FROM` | Server | Recommended | — | Verified DKIM sender address (e.g. `AutoNexa <noreply@autonexa.ca>`). |
| `CASL_UNSUBSCRIBE_SECRET` | Server | Prod CASL | Derived fallback | Dedicated HMAC secret signing one-click `/api/notifications/unsubscribe` tokens. **Set unique secret in Production.** |
| `TWILIO_ACCOUNT_SID` | Server | Optional | — | Twilio Account SID for bilingual SMS alerts. |
| `TWILIO_AUTH_TOKEN` | Server | Optional | — | Twilio Auth Token. |
| `TWILIO_FROM_NUMBER` | Server | Optional | — | Canadian SMS sender / Messaging Service number in E.164 format. |
| `UPSTASH_REDIS_REST_URL` | Server | Prod RL | — | Upstash Redis REST endpoint for distributed serverless rate limiting (`lib/server/rate-limit.ts`). |
| `UPSTASH_REDIS_REST_TOKEN` | Server | Prod RL | — | Upstash Redis REST token. |
| `AWS_REGION` | Server | If `s3` | `"ca-central-1"` | AWS S3 region when `STORAGE_DRIVER="s3"`. **Keep `"ca-central-1"` for Canadian residency.** |
| `AWS_S3_BUCKET` | Server | If `s3` | — | Target S3 bucket name for listing media / KYC / dispute evidence. |
| `AWS_ACCESS_KEY_ID` | Server | If `s3` | — | Scoped IAM access key for S3 presigned URLs & direct object uploads. |
| `AWS_SECRET_ACCESS_KEY` | Server | If `s3` | — | IAM secret key. |
| `AWS_CLOUDFRONT_URL` | Server | Optional | — | Optional HTTPS CDN origin used by `S3StorageAdapter.getPublicUrl()` for `listing-media`. |
| `GOOGLE_MAPS_API_KEY` | Server | Future (`TODO`) | — | Documented in `.env.example` for upgrading `geo.adapter.ts` from FSA centroids to rooftop geocoding. |
| `SESSION_SECRET` | Server | Legacy helper | Dev string | Used only by `lib/session.ts` legacy mock JWT helpers when mock auth paths are active. |
| `NEXT_PUBLIC_API_URL` | Public | Optional | `""` (same origin) | Optional external API origin override for `lib/api-client.ts`; leave unset to hit same-origin `/api/*`. |

---

## 6. Complete `TODO(senior-review)` Inventory (13 Markers)

Every `TODO(senior-review)` comment currently in the repository is catalogued below:

| # | Location | Summary & Recommended Production Action |
| :--- | :--- | :--- |
| 1 | `.env.example:8` | Provision production Supabase project inside **AWS `ca-central-1` (Montreal)** to guarantee PIPEDA & Quebec Law 25 residency (`NFR-09`). |
| 2 | `hooks/useAuctionRealtime.ts:244` | Move dealer Realtime WebSocket subscriptions off `public.listings` onto a dedicated `public.auction_telemetry` mirror table (or Realtime Broadcast trigger) emitting only `(id, status, bid_count, auction_ends_at)` so `listings.reserve_price_cents` never traverses dealer-bound Postgres WAL frames. |
| 3 | `lib/server/adapters/geo.adapter.ts:105` | Upgrade `geocodeCanadianPostalCode()` to call Google Geocoding API (`GOOGLE_MAPS_API_KEY`) for street-level rooftop coordinates in production and cache resolved coordinates in `public.postal_centroids`. |
| 4 | `lib/server/adapters/kyc.adapter.ts:66` | Replace `SandboxKycAdapter` with hosted Persona / Onfido / Trulioo verification SDK + signed webhook verification before production launch (`FR-EU-02`). |
| 5 | `lib/server/adapters/kyc.adapter.ts:186` | Wire the live Persona / Onfido / Trulioo provider adapter branch inside `getKycAdapter()` when `KYC_MODE=provider`. |
| 6 | `lib/server/services/auth.service.ts:117` | Remove/disable sandbox OTP bypass code `"000000"` once SendGrid and Twilio Verify are live in production. |
| 7 | `lib/server/services/auth.service.ts:136` | Expand `public.regulator_code` enum (`OMVIC`, `AMVIC`, `VSA`, `OPC`) if additional provincial regulators (SK, MB, Atlantic) require distinct codes. |
| 8 | `lib/server/services/auth.service.ts:173` | Dispatch generated 6-digit registration Email & SMS OTP challenges through `notification.adapter.ts` / SendGrid / Twilio Verify. |
| 9 | `lib/server/services/auth.service.ts:978` | Dispatch branded bilingual password reset emails via SendGrid / Resend instead of dev-logging tokens. |
| 10 | `lib/server/services/dealer-matches.service.ts:622` | Replace `UNIQUE(listing_id)` on `public.matches` with a partial unique index covering active/completed outcomes (`WHERE outcome IN ('APPOINTMENT_CONFIRMED', 'COMPLETED', 'RENEGOTIATED_LOWER')`) and update `accept_dealer_bid()` to enable secondary dealer selection after a `NO_SHOW` or `DECLINED_AFTER_INSPECTION`. |
| 11 | `lib/server/services/dealer-matches.service.ts:760` | Dispatch CASL-compliant seller payout/settlement confirmation email & SMS via `notification.adapter.ts` when dealership finalizes outcome. |
| 12 | `lib/server/services/dealer-team.service.ts:431` | Send branded bilingual dealership onboarding invitation email via Resend / SendGrid when `DEALER_ADMIN` invites a staff seat. |
| 13 | `scripts/seed-auth-users.ts:5` | Keep demo user seeding strictly excluded from production databases; rotate any staging seed passwords before promotion. |

---

## 7. Production Cutover & Go-Live Checklist

Complete these infrastructure and security tasks before promoting `feat/supabase-backend` to `main`:

- [ ] **Canadian Data Residency & PITR (`NFR-09`, `NFR-10`):** Provision production Supabase **Pro** project in **AWS `ca-central-1` (Montreal)** and enable **Point-in-Time Recovery (PITR)** to satisfy the 1-hour RPO / 4-hour RTO requirement.
- [ ] **Leaked Password Protection:** Enable **Leaked Password Protection (HaveIBeenPwned)** (`auth_leaked_password_protection`) under Supabase Dashboard → Authentication → Settings (requires Pro plan).
- [ ] **Database Migrations & Advisor Check:** Apply `supabase/migrations/0001_*.sql` through `0017_*.sql` in order, then execute `supabase/manual/0017b_split_rls_write_policies.sql` in SQL Editor (or via `supabase db push`). Verify Supabase Security Advisor & Performance Advisor report **0 ERRORs** and zero remaining `multiple_permissive_policies` warnings.
- [ ] **7-Year WORM Audit Log Archival (`NFR-11`):** Provision an **AWS S3 bucket in `ca-central-1` with S3 Object Lock enabled in Compliance Mode (7-year retention)** and configure a scheduled export worker (daily/weekly cron) archiving `public.audit_logs` batches alongside `verify_audit_log_chain()`.
- [ ] **S3 Media Storage (`STORAGE_DRIVER=s3`):** Configure private/public S3 buckets in `ca-central-1`, CORS rules allowing browser `PUT` presigned uploads from `https://autonexa.ca`, optional CloudFront origin (`AWS_CLOUDFRONT_URL`), and scoped IAM credentials (`AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`).
- [ ] **Upstash Redis + Exact-Second Auction Timers (`NFR-07`, `H3`):** Configure `UPSTASH_REDIS_REST_URL` & `UPSTASH_REDIS_REST_TOKEN` for distributed rate limiting, and wire **Upstash QStash** delayed callbacks at auction approval (`+24h`) and offer acceptance (`+24h`) alongside the existing `pg_cron` 1-minute sweep (`close-expired-auctions`, `expire-overdue-matches`) as defense in depth.
- [ ] **Live Stripe CAD Billing:** Create live CAD monthly & annual products/prices in Stripe, backfill `public.plans.stripe_price_id`, register `/api/webhooks/stripe` in Stripe Dashboard, and configure `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
- [ ] **CASL Email, SMS & KYC Providers:** Verify DKIM/SPF domain for `EMAIL_FROM`, configure SendGrid/Resend + Twilio Canadian number, generate strong `CASL_UNSUBSCRIBE_SECRET`, switch `KYC_MODE=provider` once Persona/Onfido/Trulioo adapter is implemented, and configure `GOOGLE_MAPS_API_KEY` for rooftop geocoding.
- [ ] **Lock Down Demo & Sandbox Flags:** Verify `ENABLE_MOCK_API="false"`, `ALLOW_DEMO_AUTH="false"`, `ENABLE_DEMO_SWITCH="false"` in Vercel Production environment variables, remove `"000000"` sandbox OTP code (`auth.service.ts:117`), and exclude `scripts/seed-auth-users.ts`.
- [ ] **Configure GitHub Actions Secrets:** Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `SUPABASE_SECRET_KEY` in GitHub Repository Secrets so CI runs both unit tests and live Postgres RLS leak tests automatically on PRs.
- [ ] **Dealer Realtime Isolation (`hooks/useAuctionRealtime.ts:244`):** Before high-volume production traffic, replace dealer CDC subscription on `public.listings` with a dedicated telemetry table / Broadcast trigger carrying zero `reserve_price_cents`.

---

## 8. Testing, CI & Local Development Runbook

### Package Scripts (`package.json`)
- `npm run dev`: Starts local Next.js 16 dev server (`http://localhost:3000`).
- `npx tsc --noEmit`: Strict TypeScript check (`0` errors required).
- `npm run lint`: Runs ESLint (`eslint.config.mjs` — `0` errors required for CI).
- `npm run test:unit`: Runs the **5 unit test suites** (56 tests total) in `tests/unit/`:
  - `currency.test.ts` — Integer CAD cents formatting, parsing & zero float drift (`NFR-14`).
  - `bidding.service.test.ts` — Upward-only bid rules, dealership/seat-role guards, HTTP `402` `PAST_DUE` quota/subscription blocking, and RPC error mapping.
  - `listing-secrecy.test.ts` — Sealed-bid serialization (`H1` / `AC-04`): proves `ACTIVE` listings strip all bid amounts & bidder identities and expose only `bidCount`.
  - `stripe-webhook.test.ts` — Stripe HMAC signature verification and idempotent duplicate event deduplication (`H9`).
  - `security-privacy.test.ts` — Sliding-window rate limit headers/429 responses (`NFR-07`), PIPEDA/Law 25 JSON export sealed-bid preservation, 30-day erasure guardrails, and AWS S3 SigV4 `STORAGE_DRIVER=s3` URL signing.
- `npm run test:integration`: Runs `tests/integration/rls-sealed-bids.test.ts` (7 real JWT Postgres RLS tests verifying `anon`, `SELLER`, Dealer A, Dealer B, and `ADMIN` isolation against live Supabase Cloud; automatically skips via `describe.skipIf(!HAS_SUPABASE_ENV)` if Supabase secrets are omitted).
- `npm run test:coverage`: Runs all Vitest suites (`tests/**/*.test.ts`) with `@vitest/coverage-v8` enforcing `>= 70%` global coverage thresholds across `lines`, `statements`, `functions`, and `branches` (`vitest.config.ts`).
- `npm run build`: Runs the production Next.js build (`79` app & API routes).

### GitHub Actions CI (`.github/workflows/ci.yml`)
- Runs automatically on `push` and `pull_request` targeting `feat/supabase-backend` and `main` on Node `22`.
- Executes sequentially: `npm ci` → `npx tsc --noEmit` → `npm run lint` → `npm run test:coverage` → `npm run build`.
- When repository secrets (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`) are present, CI also executes the live Postgres RLS isolation suite against staging Supabase.
