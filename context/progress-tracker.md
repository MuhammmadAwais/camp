# Progress Tracker: AutoNexa & CAMP Platform

Update this file after completing each page/component. Any AI agent reading this will immediately know what is done, what is in progress, and what is next.

---

## Current Status

**Frontend Status (`main` branch — Live on Vercel `camp-amber.vercel.app`):** 100% Operational (26/26 routes passing HTTP 200 OK, `npx tsc --noEmit` clean, mock API enabled via `ENABLE_MOCK_API=true`)
**Backend Status (`feat/supabase-backend` branch — Reference Backend):** In Progress (Prompt B3.2 Complete) — **Next Prompt: `Prompt B3.3`**
**Target Architecture:** Next.js 16 App Router BFF (`app/api/**`) + Pure Service Layer (`lib/server/services/*`) + External Adapters (`lib/server/adapters/*`) + Managed Supabase Cloud (`ca-central-1` Montreal: Postgres 16, PostGIS, `@supabase/ssr` Auth + TOTP MFA, RLS, Atomic RPCs, Realtime, Storage, `pg_cron`)
**Completed Frontend Phases:**
- Phase 1: Security, Auth & RBAC Foundation (UI Shell Complete; Route Guards & `next-intl` tracked in Backend Roadmap Phases B2.1 & B10)
- Phase 2: Public Marketing Funnel & Legal Pages (100% Complete)
- Phase 3: Unified Authentication & Canadian KYC Suite (100% Complete)
- Phase 4: Full Seller Portal & 5-Step Listing Wizard (100% Complete)
- Phase 5: Dealership Wholesale Trading Terminal (100% Complete: Trading Floor, Inspection Sheet, Bids, Won Matches, Registration, Subscriptions, Invoices, Team — All modernized with direct-canvas architecture, fluid zero-truncation KPIs, live search, sorting, and body-portaled accessible modal overlays)
- Phase 6: Platform Administrator Backoffice (100% Complete: Moderation Queue, Dealer Verification, Auction Overrides, Dispute Management, Market Analytics, Immutable Audit Log)
**Workspace State:** 26/26 routes passing HTTP 200 OK. TypeScript compiler 0 errors (`npx tsc --noEmit` clean). Sealed-bid secrecy & Integer CAD cents strictly enforced. Full responsive parity across mobile & desktop with simplified sidebar navigations and default open list view.

---

## Master Implementation Plan by Phases & Pages

### Phase 1 — Foundation, RBAC Security Infrastructure & Workspace
- [x] **01 Next.js 16 Scaffold & Route Groups** (`app/(marketing)`, `app/(auth)`, `app/(seller)`, `app/(dealer)`, `app/(admin)`)
- [x] **02 Tailwind CSS v4 & Dual-Theme Tokens** (`globals.css` @theme config with Autumn Editorial & FinTech Obsidian/Porcelain)
- [x] **03 TanStack Query v5 & Zustand Store Initialization** (`app/providers.tsx`, `lib/query-keys.ts`, `store/`)
- [x] **04 Enterprise Workspace Organization** (`docs/specifications/`, `docs/references/`, `docs/designs/`)
- [x] **05 Dual Route-Aware Scrollbar Engine** (Autumn Wine `#8C383E` for light mode vs. Honey Amber `#E59344` for dark mode, green eliminated)
- [x] **06 In-Rail Nav Toggle & Segmented Theme Switcher** (`Sidebar.tsx`, `ThemeToggle.tsx`)
- [x] **07 Pre-Hydration Browser Extension Shield** (`layout.tsx` DOM interception for `bis_skin_checked` attribute mutations)
- [x] **08 Role Route Guards & Edge Middleware** (`components/auth/RequireRole.tsx`, `proxy.ts` matchers for `/seller/*`, `/dealer/*`, `/admin/*`)
- [ ] **09 `next-intl` Bilingual Layer** (Quebec Law 25 compliance for French `/fr` and English `/en` strings)

---

### Phase 2 — Public Marketing Funnel & Appraisal Engine (Completed)
*Design Language: Autumn Editorial (Terracotta Wine `#8C383E`, Honey Amber `#E59344`, Cream Canvas `#FFF8F2`). Full responsive parity.*

- [x] **10-A Navigation Header** (`Navbar.tsx` — brand identity, portal deep links, and sticky scroll transitions)
- [x] **10-B Hero Section & Appraisal Card** (`HeroSection.tsx` & `MarketValuationWidget.tsx` with 3D tilt & glare micro-interactions)
- [x] **10-B.1 Press & Media Ribbon** (`BrandCarousel.tsx` with high-contrast badge cutouts)
- [x] **10-C What is AutoNexa** (`WhatIsAutoNexa.tsx` narrative value proposition & statistics cards)
- [x] **10-D Discover Wholesale Sales** (`DiscoverSection.tsx` verified dealer transactions & surplus above trade-in)
- [x] **10-E How It Works** (`HowItWorks.tsx` 3-step illustrated auction journey)
- [x] **10-F Features & Guarantees** (`FeaturesSection.tsx` sealed bid secrecy, OMVIC/AMVIC compliance, EXIF privacy)
- [x] **10-F.1 Dual Comparison Engine** (`ComparisonCards.tsx` 2-card challenge & `ComparisonMatrix.tsx` full-height audit matrix)
- [x] **10-G Social Proof & Testimonials** (`TestimonialsSection.tsx` with verified Canadian province badges)
- [x] **10-H Interactive FAQs Accordion** (`FaqSection.tsx` high-intent Q&A)
- [x] **10-I Pre-Footer Conversion Banner** (`CtaBanner.tsx` valuation trigger banner)
- [x] **11 Modern Legal & Regulatory Hub** (`/legal/privacy` and `/legal/terms` — `LegalViewLayout.tsx`: Fully integrated into app's persistent sidebar layout, unboxed clean editorial typography matching Lotessa/Integri specifications, squircle document badge, left floating sticky Table of Contents with active indicator rail, numbered section hierarchy, brand color highlighting for Canadian statutory frameworks [PIPEDA, Quebec Law 25, OMVIC, AMVIC, VSA], and underlined interactive links).

---

### Phase 3 — Unified Authentication & Canadian KYC Suite
*Design Mode: Porcelain Light / Obsidian Dark Glassmorphism (`.glass-card`, `.glow-teal`). Both Mobile & Desktop responsive.*

- [x] **12 Login Page** (`/login` — `LoginForm.tsx` email/password, demo role switcher, redirect sanitization)
- [x] **13 Seller Registration** (`/register` — `RegisterForm.tsx` FR-EU-01 fields, CASL opt-in, PIPEDA consent, postal auto-lookup)
- [x] **14 Contact OTP Verification** (`/verify` — `VerifyOtpForm.tsx` SMS + Email two-channel verification with resend cooldown)
- [x] **15 Password Recovery Suite** (`/forgot-password` & `/reset-password` — email verification token mock)
- [x] **16 Automated Identity KYC Verification** (`/verify-kyc` — `KycVerificationView.tsx`: Government ID capture [Driver's License / Passport] + liveness selfie stub, `PENDING` → `VERIFIED` state engine)

---

### Phase 4 — Seller Portal & 5-Step Listing Wizard (Mobile-First Priority)
*Primary Canvas: Mobile Viewport (`375px` to `640px`) scalable to Desktop. Light porcelain theme (`#FAFBFC`).*

#### Milestone 4.1: Seller Dashboard
- [x] **Page 4.1: Seller Dashboard Shell**
  - **Route:** `/seller/dashboard`
  - **Component:** `SellerDashboard.tsx`
  - **Features:** KYC Status Banner, 4-column active vehicle cards with authentic automaker brand logos (Toyota, Honda, Ford, Jeep, Polestar, Mitsubishi, Hyundai, Cadillac), warm oat `#FFF8F2` light canvas & solid pure black `#000000` dark canvas (zero `#0A0A0A` artifacts), DiscoverSection pocket notch with 13px channel cushion, sealed-bid count telemetry (`N sealed dealer bids`), "List New Vehicle" CTA, empty-state placeholder, strict route-aware RBAC sidebar navigation.
  - **API Contract:** `GET /api/seller/dashboard`, `GET /api/kyc/status`.

#### Milestone 4.2: 5-Step Listing Wizard (`/seller/list-car`)
- [x] **Page 4.2.1: Step 1 — VIN Auto-Decode**
  - **Route:** `/seller/list-car` (Step 1 in `ListingWizard.tsx`)
  - **Component:** `VinDecodeStep.tsx`
  - **Features:** 17-character VIN mask, ISO 3779 checksum validator, NHTSA vPIC auto-decode hook, manual specification fallback override.
  - **API Contract:** `POST /api/vin/decode`.
- [x] **Page 4.2.2: Step 2 — Vehicle Specs & History**
  - **Route:** `/seller/list-car?step=details`
  - **Component:** `VehicleSpecsStep.tsx`
  - **Features:** Odometer mileage in km, transmission, drivetrain, exterior/interior colour, number of keys, accident declaration, lien status.
  - **API Contract:** Controlled inputs via React Hook Form + Zod validation.
- [x] **Page 4.2.3: Step 3 — Interactive 2D Damage Hotspot Mapper**
  - **Route:** `/seller/list-car?step=condition`
  - **Component:** `DamageMapperStep.tsx`
  - **Features:** Interactive SVG vehicle schematics (front, sides, rear, roof). Tap to place pins, select severity (Minor, Moderate, Severe), add description and photo attachments.
  - **API Contract:** `DamageHotspot[]` saved to `useListingWizardStore`.
- [x] **Page 4.2.4: Step 4 — Media Gallery & Direct-to-S3 Upload**
  - **Route:** `/seller/list-car?step=media`
  - **Component:** `PhotoUploadStep.tsx`
  - **Features:** 8 to 30 photo intake, drag-and-drop zone, client-side downscaling to 1920px WebP (`browser-image-compression`), EXIF metadata scrubbing, presigned S3 upload, cover photo selection, reorder controls, quota tracker, and demo auto-fill.
  - **API Contract:** `POST /api/listings/media/presign` -> Direct S3 PUT.
- [x] **Page 4.2.5: Step 5 — Reserve Price & Legal Submission**
  - **Route:** `/seller/list-car?step=pricing`
  - **Component:** `PriceReviewStep.tsx`
  - **Features:** Reserve asking price in CAD cents (formatted as `$XX,XXX`), declaration checkboxes (owner attestation, accurate condition declaration), 1-click submit to moderation queue.
  - **API Contract:** `POST /api/listings`.

#### Milestone 4.3: Auction Telemetry & Fulfillment
- [x] **Page 4.3: Active Auction Live Tracker**
  - **Route:** `/seller/listings/[id]`
  - **Component:** `SellerActiveAuctionView.tsx`
  - **Features:** Dashboard-style horizontal 4-metric bar (Reserve Price, Dealer Activity, Live Countdown, Dealer Protection) with vertical dividers & side icons, 24h digital countdown timer clock, real-time sealed-bid count telemetry *(Strict invariant: zero dollar amounts exposed while ACTIVE)*, photo strip with cover showcase, condition disclosure sheet, specs recap, plain-language non-technical copy, and seamless header canvas continuity.
- [x] **Page 4.4: Post-Auction Unsealed Dealer Selection**
  - **Route:** `/seller/listings/[id]/select-dealer`
  - **Component:** `DealerSelectionView.tsx` & `VehicleSwitcherModal.tsx`
  - **Features:** Interactive vehicle switcher pill & modal for multi-car inventory, borderless 4-metric executive bar smoothly blended into the background canvas (`bg-gradient-to-b from-portal-surface/90 via-portal-surface/40 to-transparent`), balanced 3D amphitheater stage tilt (`[perspective:1200px]` with Y-axis curvature across top 3 cards), metallic highlighted pedestal numerals (`01` Gold, `02` Silver, `03` Bronze) with smooth hover scaling (`group-hover:scale-110`), plain-language non-technical phrasing, high-density rows for remaining ranks 4+, dual sort switch (Highest Bid / Nearest Dealership), and 1-click binding offer acceptance modal.
- [x] **Page 4.5: Offline Appointment & Dealership Voucher**
  - **Route:** `/seller/listings/[id]/appointment`
  - **Component:** `AppointmentVoucherCard.tsx`
  - **Features:** Dealership address, business hours, map directions, required documents checklist (Ownership slip, safety cert, ID), 48h appointment window, QR verification pass.

---

### Phase 5 — Dealership Trading Terminal (Desktop-First Priority)
*Primary Canvas: Desktop Monitor (`1280px` to `1920px`). High-density FinTech Obsidian Dark theme (`#0C0A09`, `#131215`, `#E59344` amber, `#8C383E` wine, `#10B981` emerald checkmarks).*

#### Milestone 5.1: Dealer Onboarding & Subscription
- [x] **Page 5.1: Dealership Registration & Licensing**
  - **Route:** `/dealer/register`
  - **Component:** `DealerRegisterView.tsx`
  - **Features:** Redesigned into an unboxed 3-step progressive wizard (01. Licensing & Legal Entity, 02. Premises & Sourcing Radius, 03. Purchasing Officer) with interactive radius quick-chips (50km, 100km, 250km), full `Plus Jakarta Sans` typography, and zero robotic monospace.
- [x] **Page 5.2: Subscription Tier Gate**
  - **Route:** `/dealer/subscription`
  - **Component:** `DealerSubscriptionView.tsx`
  - **Features:** 3D concave tilt pricing architecture with dual-theme contrast, S-curve notched cards, balanced 2-line pricing numerals (`Plus Jakarta Sans`), and minimal 1-line status bar with direct billing link.

#### Milestone 5.2: Trading Floor & Bidding Engine
- [x] **Page 5.3: Live Wholesale Auction Exchange (Trading Floor)**
  - **Route:** `/dealer/inventory`
  - **Component:** `DealerInventoryFeed.tsx`, `DealerAuctionCard.tsx`, `DealerHeader.tsx`
  - **Features:** Streamlined institutional header (removed quota/admin clutter), open page header with live inventory & bid counter chips, signature notched cards with authentic automaker marques (`CAR_BRAND_LOGOS`), clean photo canvases, key specs (mileage, transmission, drivetrain, Carfax), sealed bid status, and docked concave squircle button launching `SealedBidSlip`.
- [x] **Page 5.4: Vehicle Inspection Sheet & Photo Gallery**
  - **Route:** `/dealer/auctions/[id]`
  - **Component:** `VehicleInspectionView.tsx`
  - **Features:** Re-architected with strong visual hierarchy and anti-card-soup layout: unboxed 16/10 hero media viewer, seamless condition & seller disclosure stream (no card nesting), and a single unified sticky dealership console with 3 clear tiers (Bidding CTA, 2x2 scannable Vehicle Vitals, and Carfax title trust signals). Low-value hardcoded clutter removed.
- [x] **Page 5.5: Sealed-Bid Placement Modal / Slip**
  - **Route:** Integrated modal in `/dealer/inventory` & `/dealer/auctions/[id]`
  - **Features:** Integer CAD cents dollar input, quick-increment chips (`+$250`, `+$500`, `+$1,000`, `+$2,500`), upward-revision tracker (dealers can raise their bids, never lower them), legally binding commitment declaration, portaled to `document.body` (`z-[9999]`) with full-viewport dimming & background scroll lock.
- [x] **Page 5.6: Active Bids & Outbid Telemetry**
  - **Route:** `/dealer/active-bids`
  - **Component:** `DealerActiveBidsView.tsx`
  - **Features:** All placed bids across open auctions, status indicators (`ACTIVE`, `OUTBID_ESTIMATE`, `CLOSING_SOON`), 1-click upward revision modal.

#### Milestone 5.3: Match Fulfillment & Administration
- [x] **Page 5.7: Won Matches & Offline Inspection Logger**
  - **Route:** `/dealer/won-matches`
  - **Component:** `DealerWonMatchesView.tsx`
  - **Features:** Unified 4-metric executive overview bar, 2-column dossier and seller communication stream, portaled `z-[9999]` inspection & settlement modal with body scroll lock, dark backdrop dimming persistent sidebar, 4-status interactive cards, live CAD variance comparison against agreed winning bid, one-click technician inspection findings tags, and portaled printable digital QR intake pass.
- [x] **Page 5.8: Dealership Team Management** (`DEALER_ADMIN` role only)
  - **Route:** `/dealer/team`
  - **Component:** `DealerTeamView.tsx`
  - **Features:** Unboxed roster layout with live search, role filter tabs (`All`, `Buyers`, `Inspectors`, `Admins`), member avatar badges, rooftop seat capacity tracker, and interactive permission role selection cards in the invite modal with body scroll lock.
- [x] **Page 5.9: Dealership Invoices & Quotas** (`DEALER_ADMIN` role only)
  - **Route:** `/dealer/billing`
  - **Component:** `DealerBillingView.tsx`
  - **Features:** Direct-canvas unboxed layout, dual summary metric cards (Quota Progress + Active Subscription), real-time search by invoice number or description, CRA year filter tabs (`All`, `2026`, `2025`), sorting toggle, and 1-click PDF receipt downloads.

---

### Phase 6 — Platform Administrator Backoffice (Desktop-First Priority)
*Primary Canvas: Desktop Workstation (`1440px`+). Clean institutional data density.*

- [x] **Page 6.1: Seller Listing Moderation Queue**
  - **Route:** `/admin/moderation`
  - **Component:** `ListingModerationView.tsx`
  - **Features:** Full-width high-density queue: 4-card operational metric ribbon (`Pending Verification`, `Action Required`, `Approved Today`, `Total Intake`) with side-by-side equalized `w-12 h-12` icons and headings, live search across VIN/Model/Seller, status filter tabs, sort dropdown, dual view modes (refined list rows with prominent review buttons & signature S-curve notched grid cards with brand logos, smooth outward concave fillet transitions, and docked squircle buttons), and direct links to dedicated dossier review pages.
- [x] **Page 6.1b: Vehicle Moderation Dossier & Decision Terminal**
  - **Route:** `/admin/moderation/[id]`
  - **Component:** `ListingModerationDetailView.tsx`
  - **Features:** Dedicated full-page vehicle inspection dossier: breadcrumb back navigation, high-resolution photo review stage with portaled fullscreen lightbox (`z-[9999]`), tabular NHTSA decoded vitals & compliance table (eliminated card soup), seller KYC & verified attestation card, and portaled regulatory action modals for corrections and statutory rejections.
- [x] **Page 6.2: Dealer Regulatory License Verification Queue**
  - **Route:** `/admin/dealers`
  - **Component:** `DealerVerificationView.tsx`
  - **Features:** Modernized with Direct-Canvas architecture, 4-metric executive overview ribbon (`Pending Inspection`, `Active Licenses`, `License Inquiries`, `Total Dealerships`) with side-by-side `w-12 h-12` icons, universal `useTableSort` sorting across all columns (Dealership Name, License, Jurisdiction, Officer, Status), 1-click license copy, and an accessible portaled dossier review modal (`z-[9999]`) with provincial registrar audit sign-off.
- [x] **Page 6.3: Auction Master Operations & Emergency Overrides**
  - **Route:** `/admin/auctions`
  - **Component:** `AdminAuctionsView.tsx`
  - **Features:** Direct-Canvas supervision console with 4-metric live operational ribbon, `useTableSort` sorting across Vehicle Lot, Seller/Location, Sealed Telemetry, Reserve CAD cents, and dynamic Countdown Clock (sub-15min crimson pulse state). Bare buttons replaced with portaled safety override modals (`z-[9999]`): +Time Extension with quick chips and audit justification, and Emergency Lot Termination with typed `HALT` verification.
- [x] **Page 6.4: Dispute Resolution Case Management Queue**
  - **Route:** `/admin/disputes`
  - **Component:** `DisputeManagementView.tsx`
  - **Features:** Direct-Canvas full-width queue matching vehicle moderation layout: 4-metric ribbon (`Under Investigation`, `Action Required`, `Resolved Disputes`, `Total Incident Intake`) with side-by-side `w-12 h-12` icons, real-time search across dockets/VIN/parties, status filter pills, sort dropdown, dual view modes (refined list rows with prominent review buttons & signature S-curve notched grid cards with brand logos and docked squircle buttons), linking to dedicated arbitration dossiers.
- [x] **Page 6.4b: Incident Dispute Arbitration Dossier & Escrow Settlement Terminal**
  - **Route:** `/admin/disputes/[id]`
  - **Component:** `DisputeDetailView.tsx`
  - **Features:** Dedicated full-page arbitration dossier: breadcrumb back navigation, dual-party dossiers (Seller vs Dealership & certified hoist technician), photo comparison stage with portaled fullscreen lightbox (`z-[9999]`), technician hoist findings report, escrow financial breakdown (agreed bid, adjustment, net seller payout), and portaled binding arbitration decision modals (approve deduction & release escrow, reject claim, or order mutual cancellation).
- [x] **Page 6.5: Platform Analytics & Provincial Volume**
  - **Route:** `/admin/analytics`
  - **Component:** `AdminAnalyticsView.tsx`
  - **Features:** Complete executive analytics dashboard inspired by modern shadcn/SaaS design: Unified top 4 metric ribbon matching reference specification (Gross Merchandise Value, Total Transactions, Completed Clearance, Bidding Velocity with side-by-side equalized `w-12 h-12` icons), interactive AutoNexa Honey Amber (`#E59344`) & Autumn Wine (`#8C383E`) SVG spline area curve chart with floating tooltips and timeframe toggles, provincial market share SVG donut chart with interactive hover arcs and legend pills, metropolitan hub intake vs. clearance grouped bar chart, top sourcing dealership leaderboard, and Image 4/5 reference-parity Wholesale Settlement Ledger with live search, status filters, multi-row selection, VIN copy, sortable headers (`useTableSort`), and `<TablePagination />`.
- [x] **Page 6.6: Profile & Account Settings**
  - **Route:** `/settings/profile`, `/settings/security`
  - **Component:** `ProfileSettingsView.tsx`, `UserProfileCard.tsx`
  - **Features:** Comprehensive executive account & compliance settings: Avatar management with verified officer/dealer badge, personal & professional identity fields (Legal Name, Title, Work Email, Direct Phone), Canadian provincial jurisdiction selection (`ON`, `AB`, `BC`, `QC`), regulatory oversight board ID (`OMVIC`, `AMVIC`, `VSA`, `OPC`), bilingual language preference (English / Français Loi 25), Multi-Factor Authentication (MFA/2FA) status, password renewal, active clearance sessions with IP/device telemetry, PIPEDA data portability download request, and live dispatch notification toggles. Profile modal overhauled with classic professional SaaS hierarchy and unclipped circular avatar.
- [x] **Universal Modern SaaS Table System (Reference Design Parity)**
  - **Components:** `components/ui/SortableHeader.tsx`, `components/ui/TablePagination.tsx`, `hooks/useTableSort.ts`
  - **Implemented in:**
    - `components/admin/DealerVerificationView.tsx` (`/admin/dealers`)
    - `components/admin/AdminAuctionsView.tsx` (`/admin/auctions`)
    - `components/admin/AdminAuditLogView.tsx` (`/admin/audit-log`)
    - `components/admin/AdminAnalyticsView.tsx` (`/admin/analytics`)
    - `components/dealer/DealerBillingView.tsx` (`/dealer/billing`)
  - **Features:** Card header container with `{count} Total` pill, subtitle, search bar, and action toolbars. Interactive multi-select checkboxes on every row and select-all in header. Single-line scanability without text cramming (icon/thumbnail badges, soft pastel status pills, formatted integer CAD cents). Dedicated SaaS pagination footer with page buttons, ellipses, previous/next buttons, and results count. Type-safe 3-state column sorting.

---

# Backend Implementation Roadmap (Reference Backend — `feat/supabase-backend`)

> **Target Stack:** Next.js 16 Route Handlers (`app/api/**`) + Pure Service Layer (`lib/server/services/*`) + External Adapters (`lib/server/adapters/*`) + Managed Supabase Cloud (AWS `ca-central-1` Montreal: Postgres 16, PostGIS, `@supabase/ssr` Auth + TOTP MFA, RLS, Atomic RPCs, Realtime, Storage, `pg_cron`).
> **Branching & Vercel Isolation:** All work lives on `feat/supabase-backend` (cut from `main`). `main` stays live and untouched on Vercel (`camp-amber.vercel.app`, `ENABLE_MOCK_API=true`). Supabase env vars + `ENABLE_MOCK_API=false` are scoped strictly to **Vercel Preview**.
> **Authoritative Specs:** `docs/architecture/backend/03-nextjs-supabase-vercel.md`, `docs/specifications/SRS_Car_Auction_Marketplace.pdf`, `context/architecture.md`, `context/code-standards.md`.

---

## AI Agent Execution Protocol (How to Prompt Antigravity Efficiently)

To maximize quality, prevent context drift, and guarantee zero regressions across sessions, execute **strictly ONE Prompt Unit (`Prompt B#.#`) per AI prompt/turn** (or at most two adjacent tiny prompts only when explicitly noted).

### Copy-Paste Prompt Template for Antigravity IDE
```text
Execute **Prompt B#.#** from `context/progress-tracker.md`.
1. Read `context/architecture.md`, `context/code-standards.md`, and ONLY the files listed in Prompt B#.#.
2. Follow all production invariants (4-layer architecture, handleApiRoute error boundary, integer BIGINT CAD cents, sealed-bid secrecy, Zod validation, versioned SQL migrations in `supabase/migrations/`).
3. Run the exact Exit Gate checks for Prompt B#.# (`npx tsc --noEmit` + listed tests/verifications).
4. Once green, check off Prompt B#.# in `context/progress-tracker.md`, update "Next Prompt", create a clean conventional `git commit` and `git push origin feat/supabase-backend` (verifying `.env` is never staged and `main` is never touched), and report exact files changed + verification results.
```

### AI Engineering Rules for This Roadmap
- **One Vertical Slice at a Time:** Never ask the agent to build multiple phases in one prompt. Each Prompt Unit below is sized to ~3–6 files or 1 cohesive SQL migration + service + route + UI hook.
- **Auto-Commit & Push Per Verified Prompt:** After every Prompt Unit passes its Exit Gate and is checked off in `context/progress-tracker.md`, always create a clean conventional commit on `feat/supabase-backend` (e.g., `feat(backend): complete Prompt B1.2 core schema migrations`) and push to `origin feat/supabase-backend`. Never commit `.env` or secret values; never push to `main` (which remains the live Vercel production branch).
- **No Unversioned DB Edits:** Every schema, RLS, index, RPC, or `pg_cron` change MUST be saved under `supabase/migrations/00XX_*.sql` AND applied to Supabase (via Supabase MCP `apply_migration` or CLI).
- **Load Supabase Skills Before SQL:** Before running `B1.2`, `B1.3`, `B5.1`, `B6.2`, or `B8.2`, load the `supabase` and `supabase-postgres-best-practices` skills.
- **Zero Crash Guarantee:** Every `app/api/**` handler wraps in `handleApiRoute(...)` and throws typed `AppError` subclasses (`lib/server/errors.ts`). No raw DB errors or stack traces ever leave the server.
- **Senior Handoff Transparency:** Any intentional MVP/reference shortcut (e.g., Supabase Storage before dedicated AWS S3, seeded postal centroids before Google Geocoding, sandbox KYC) MUST carry `// TODO(senior-review): ...`.

---

## Master Backend Prompt Index (30 Atomic AI Prompt Units)

| Part | Phase | Prompt ID | Deliverable (Build From → To) | Milestone Tier | Est. Time | Status |
|---|---|---|---|---|---:|:---:|
| **I** | **B1** | `Prompt B1.1` | Git branch `feat/supabase-backend`, deps, Zod env, server error/HTTP kernel, Supabase clients | **PM Demo (Day 1)** | 2–3 hrs | [x] |
| **I** | **B1** | `Prompt B1.2` | Provision Supabase `ca-central-1` + Core SQL migrations (`0001`–`0003`: enums, 20 tables, constraints, PostGIS indexes) | **PM Demo (Day 1)** | 3–4 hrs | [x] |
| **I** | **B1** | `Prompt B1.3` | Airtight RLS (`0004`), Atomic RPCs (`0005`), `pg_cron` + Realtime (`0006`), Demo seed (`0007`), generated TS types | **PM Demo (Day 1)** | 3–4 hrs | [x] |
| **I** | **B2** | `Prompt B2.1` | Server RBAC guard (`lib/server/auth.ts`), `proxy.ts` cookie refresh + role routing, cookie-only `api-client.ts` | **PM Demo (Day 2)** | 2–3 hrs | [x] |
| **I** | **B2** | `Prompt B2.2` | Real `/api/auth/*` routes + `auth.service.ts` backed by Supabase Auth, `profiles`, and PIPEDA/CASL consents | **PM Demo (Day 2)** | 3–4 hrs | [x] |
| **I** | **B2** | `Prompt B2.3` | Storage adapter (`ca-central-1` buckets + signed PUT URLs), real `/api/listings/media/presign`, real `/api/kyc/*` | **PM Demo (Day 2)** | 2–3 hrs | [x] |
| **I** | **B3** | `Prompt B3.1` | Cached NHTSA vPIC VIN adapter (`vin.adapter.ts` + 3s timeout + `vin_decode_cache`) & real `/api/vin/decode` | **PM Demo (Day 3)** | 1–2 hrs | [x] |
| **I** | **B3** | `Prompt B3.2` | `listing.service.ts` + real `POST /api/listings`, `GET /api/seller/dashboard`, sealed `GET /api/listings/[id]` | **PM Demo (Day 3)** | 3–4 hrs | [x] |
| **I** | **B3** | `Prompt B3.3` | Admin Moderation service & APIs (`/api/admin/moderation*`) + wire Moderation UI views to TanStack Query | **PM Demo (Day 3)** | 2–3 hrs | [ ] |
| **I** | **B4** | `Prompt B4.1` | Dealer Inventory & Inspection APIs (`/api/dealer/inventory*`) + wire `VehicleInspectionView` | **PM Demo (Day 4)** | 2–3 hrs | [ ] |
| **I** | **B4** | `Prompt B4.2` | `bidding.service.ts` + real `POST /api/dealer/bid` calling atomic `submit_dealer_bid` RPC + verify `SealedBidSlip` | **PM Demo (Day 4)** | 2–3 hrs | [ ] |
| **I** | **B4** | `Prompt B4.3` | `hooks/useAuctionRealtime.ts` (live `bid_count` & `status` WebSocket + server-time clock) wired to Seller & Dealer UIs | **PM Demo (Day 4)** | 2–3 hrs | [ ] |
| **I** | **B4** | `Prompt B4.4` | Post-auction unsealing, `accept_dealer_bid` RPC → Appointment Voucher, + Admin `/api/admin/auctions` overrides | **PM Demo (Day 4–5)** | 3 hrs | [ ] |
| **I** | **B4** | `Prompt B4.5` | Dealer Active Bids & Won Matches APIs + Outcome logging + **Vercel Preview Deploy & Full 3-Role PM Demo Gate** | **PM Demo (Day 5)** | 3–4 hrs | [ ] |
| **II** | **B5** | `Prompt B5.1` | Seed Canadian postal centroids + `geo.adapter.ts` + PostGIS `ST_DWithin` RPC (`distanceKm` in feed & unsealed view) | Complete Platform | 3–4 hrs | [ ] |
| **II** | **B5** | `Prompt B5.2` | Dealer Registration (`/api/dealer/register`) & Admin License Verification (`/api/admin/dealers*` + BR-14 bid voiding) | Complete Platform | 3–4 hrs | [ ] |
| **II** | **B5** | `Prompt B5.3` | Dealership Team & Seat Management (`/api/dealer/team` — `DEALER_ADMIN` gate, buyer vs. inspector permissions) | Complete Platform | 2–3 hrs | [ ] |
| **II** | **B6** | `Prompt B6.1` | Dispute Arbitration Engine (`/api/admin/disputes*` + hoist evidence upload + timeline + resolution) | Complete Platform | 3–4 hrs | [ ] |
| **II** | **B6** | `Prompt B6.2` | Admin Analytics SQL Views (`/api/admin/analytics`) & Paginated Immutable Audit Log + SHA-256 Chain (`/api/admin/audit-log`) | Complete Platform | 3–4 hrs | [ ] |
| **II** | **B6** | `Prompt B6.3` | Seller Relisting (FR-EU-13 cooldown), Account Settings (`/api/settings/*`), & Platform Config (`/api/admin/config`) | Complete Platform | 3 hrs | [ ] |
| **II** | **B7** | `Prompt B7.1` | Stripe Checkout, Billing Portal & Invoices (`billing.adapter.ts`, `/api/dealer/subscription*`, `/api/dealer/billing*`) | Complete Platform | 3–4 hrs | [ ] |
| **II** | **B7** | `Prompt B7.2` | Idempotent Stripe Webhook (`/api/webhooks/stripe` — HMAC verify, quota sync, HTTP 402 bid block on `PAST_DUE`) | Complete Platform | 3–4 hrs | [ ] |
| **II** | **B7** | `Prompt B7.3` | Persistent Notifications + Realtime Bell (`/api/notifications`) + Email/SMS CASL Adapter (radius approval fan-out) | Complete Platform | 3–4 hrs | [ ] |
| **III** | **B8** | `Prompt B8.1` | Mandatory TOTP MFA (`supabase.auth.mfa` — NFR-06) enrollment, QR setup & AAL2 guard for `ADMIN` / `DEALER_ADMIN` | Hardening & Handoff | 3–4 hrs | [ ] |
| **III** | **B8** | `Prompt B8.2` | Rate Limiting (`lib/server/rate-limit.ts` — NFR-07), Security Headers, Supabase Security/Performance Advisor Audit | Hardening & Handoff | 3 hrs | [ ] |
| **III** | **B8** | `Prompt B8.3` | PIPEDA / Law 25 Data Export & 30-Day Deletion Workflow + Optional Drop-In AWS S3 `ca-central-1` Storage Adapter | Hardening & Handoff | 3 hrs | [ ] |
| **III** | **B9** | `Prompt B9.1` | Vitest Setup + ≥70% Unit Tests (auction state machine, bids, integer cents, Stripe webhooks) + Sealed-Bid RLS Leak Tests | Hardening & Handoff | 4–5 hrs | [ ] |
| **III** | **B9** | `Prompt B9.2` | GitHub Actions CI (`.github/workflows/ci.yml`), Full Preview E2E QA & Senior Engineer Handoff (`docs/backend-handoff.md`) | Hardening & Handoff | 3 hrs | [ ] |
| **III** | **B10** | `Prompt B10.1` | *(Separate Track)* `next-intl` Setup, `[locale]` Routing, `messages/en.json` & `fr.json`, Language Sync | Quebec Law 25 i18n | 1–2 days | [ ] |
| **III** | **B10** | `Prompt B10.2` | *(Separate Track)* Full Portal, Legal & Server-Side Bilingual Email/Notification Template Parity (FR-X-04 / NFR-13) | Quebec Law 25 i18n | 2 days | [ ] |

---

## PART I — PM DEMO MILESTONE (Phases B1–B4 · ~65–70% Core Value · 4–5 Working Days)

> **PM Demo Goal:** Demonstrate the complete live 3-role marketplace lifecycle on a Vercel Preview URL backed by real Supabase Postgres (`ca-central-1`), real Auth, real EXIF-stripped photo uploads, atomic sealed bidding with live Realtime bid counter (proving zero bid-amount leakage in DevTools), unsealing, dealer selection, appointment voucher, and won-match logging.

### Phase B1 — Git Branch, Crash-Proof Server Kernel & Supabase Database Foundation (Day 1)

- [x] **`Prompt B1.1` — Branch Setup, Dependencies & Crash-Proof Server Kernel**
  - **Build From → To:** Clean branch `feat/supabase-backend` off `main` → installed Supabase packages, fail-fast env loader, centralized error/response wrapper, structured logger, and `@supabase/ssr` client helpers.
  - **Files to Create/Modify:**
    - Install `@supabase/supabase-js` and `@supabase/ssr` (`package.json`)
    - `.env.example` (document all Supabase, Storage, Stripe, Email/SMS, Rate-Limit vars)
    - `lib/server/env.ts` (Zod-validated server/public env getters; clear startup message when missing)
    - `lib/server/errors.ts` (`AppError` base + `ValidationError`, `UnauthorizedError`, `ForbiddenError`, `NotFoundError`, `ConflictError`, `PaymentRequiredError`, `RateLimitError`, `ExternalServiceError`)
    - `lib/server/logger.ts` (structured JSON logger with `requestId`, actorId, severity, zero PII/token logging)
    - `lib/server/http.ts` (`handleApiRoute(req, handler)`, `parseBody(req, zodSchema)`, `parseQuery(req, zodSchema)`, `ok()`, `created()`, exact `{ data } | { error: { code, message, fields?, requestId } }` envelope)
    - `lib/supabase/client.ts` (browser client for Realtime & Auth helpers), `lib/supabase/server.ts` (per-request `@supabase/ssr` cookie client), `lib/supabase/admin.ts` (`server-only` service-role client)
  - **Invariants:** Never expose `SUPABASE_SERVICE_ROLE_KEY` to `NEXT_PUBLIC_*` or client imports; every error maps to stable machine code.
  - **Exit Gate:** `git branch` confirms `feat/supabase-backend`, `npx tsc --noEmit` passes with 0 errors, `npm run build` passes.

- [x] **`Prompt B1.2` — Provision Supabase `ca-central-1` & Core Schema Migrations (`0001`–`0003`)**
  - **Build From → To:** Empty Supabase `ca-central-1` (Montreal) project → all 20 normalized SRS + UI tables deployed via ordered migrations with `BIGINT` cents constraints, partial unique VIN index, and PostGIS GiST indexes.
  - **Migrations to Create & Apply:**
    - `supabase/migrations/0001_extensions_and_enums.sql` — Enable `postgis`, `pg_cron`, `pgcrypto`; define canonical enums (`user_role`, `dealer_seat_role`, `kyc_status`, `dealership_status`, `regulator_code`, `listing_status` [10 states], `damage_severity`, `bid_status`, `match_outcome`, `dispute_status`, `dispute_category`, `subscription_status`, `notification_type`).
    - `supabase/migrations/0002_core_tables.sql` — Create: `platform_config`, `profiles`, `user_consents`, `kyc_submissions`, `dealerships`, `dealership_members`, `plans`, `subscriptions`, `payments`, `stripe_webhook_events`, `postal_centroids`, `vin_decode_cache`, `listings`, `listing_media`, `damage_hotspots`, `bids`, `matches`, `disputes`, `dispute_timeline`, `notifications`, `notification_deliveries`, `audit_logs`.
    - `supabase/migrations/0003_indexes_and_constraints.sql` — Foreign key indexes on every FK, `UNIQUE (listing_id, dealership_id)` on `bids`, `CHECK (amount_cents > 0)`, `CHECK (reserve_price_cents >= 0)`, partial unique active-VIN index `uniq_active_vin` (BR-02), PostGIS GiST indexes on `dealerships.location` & `listings.location`, composite index `bids(listing_id, amount_cents DESC)`, `updated_at` trigger.
  - **SRS / Rules:** BR-02, BR-05, NFR-09 (`ca-central-1`), NFR-14 (`BIGINT` cents), SRS §7.2 ERD.
  - **Exit Gate:** All 3 migrations apply cleanly to Supabase `ca-central-1`; `list_tables` confirms all tables & constraints exist with zero errors.

- [x] **`Prompt B1.3` — Airtight RLS, Atomic Postgres RPCs, `pg_cron`, Realtime & Demo Seed (`0004`–`0007`)**
  - **Build From → To:** Bare tables → database-enforced sealed-bid secrecy, atomic concurrency-safe bidding & matching RPCs, 1-minute expiry sweeps, demo accounts/vehicles seeded, and generated TypeScript DB types.
  - **Migrations & Files to Create/Apply:**
    - `supabase/migrations/0004_rls_policies.sql` — Enable RLS on EVERY public table. Sealed-bid invariant (H1 / BR-04): dealers read only their own `bids`; sellers read `bids` ONLY when `listings.status IN ('UNSEALED','ACCEPTED','COMPLETED','EXPIRED')`; create safe `public_auction_telemetry` view (count + status + `auction_ends_at`, zero amounts). Append-only `audit_logs` (block `UPDATE`/`DELETE` for all roles, NFR-11).
    - `supabase/migrations/0005_rpc_functions.sql` — `SECURITY DEFINER` RPCs (with `SET search_path = public`):
      1. `submit_dealer_bid(p_listing_id, p_amount_cents, p_idempotency_key, p_conditions, p_notes)` — verifies verified dealer + active subscription/quota + `ACTIVE` window open (`FOR SHARE`), locks dealer bid (`FOR UPDATE`), enforces upward-only `new > old` (BR-05 / H2 / NFR-15), idempotency key deduplication, bumps `listings.bid_count` + `subscriptions.bids_used`, inserts `audit_logs` entry.
      2. `accept_dealer_bid(p_listing_id, p_bid_id, p_selection_reason)` — atomic lock on listing (`UNSEALED`), creates `matches` row with unique voucher code & `acceptance_window_hours` from `platform_config` (BR-08), marks winning bid `WON` & others `LOST`, transitions listing → `ACCEPTED`, writes `audit_logs`.
      3. `close_expired_auctions()` — idempotent bulk close `ACTIVE → UNSEALED` where `auction_ends_at <= NOW()` (H4).
      4. `expire_overdue_matches()` — idempotent expiry of unlogged matches past `accept_expires_at` → releases listing back to `UNSEALED` (BR-09 / AC-05).
      5. `handle_new_auth_user()` trigger syncing `auth.users` → `public.profiles` + syncing `role`/`dealership_id` into JWT `app_metadata`.
    - `supabase/migrations/0006_pg_cron_and_realtime.sql` — Schedule `close_expired_auctions()` and `expire_overdue_matches()` every minute via `pg_cron` (H3 / FR-X-02); add `listings` and `notifications` to `supabase_realtime` publication.
    - `supabase/migrations/0007_seed_demo.sql` + `scripts/seed-auth-users.ts` — Seed `platform_config`, `plans` (Basic/Pro/Enterprise), 4 demo Auth users (`seller@autonexa.ca`, `dealer@autonexa.ca`, `agent@autonexa.ca`, `admin@autonexa.ca`, password `password123`), 3 verified Canadian dealerships with active subscriptions, and realistic sample listings across statuses.
    - Generate `lib/supabase/database.types.ts` via Supabase MCP (`generate_typescript_types`).
  - **Exit Gate:** All migrations apply cleanly; seed script succeeds idempotently; SQL smoke test proves `submit_dealer_bid` rejects downward revision and accepts upward revision; `npx tsc --noEmit` passes.

---

### Phase B2 — Real Authentication, Route Guards, KYC & Direct Media Storage (Day 2)

- [x] **`Prompt B2.1` — Server RBAC Guard, `proxy.ts` Session Middleware & Cookie `api-client.ts`**
  - **Build From → To:** No-op `proxy.ts` + custom Bearer/refresh token client → real `@supabase/ssr` HttpOnly cookie auth, role-based route guards, and centralized server RBAC helpers.
  - **Files to Create/Modify:**
    - `lib/server/auth.ts` — `getSessionContext()`, `requireAuth()`, `requireRole(roles[])`, `requireKycVerified()`, `requireActiveDealership(seatRoles[])` (checks `profiles`, `dealerships.status = 'VERIFIED'`, and `dealership_members.seat_role`).
    - `proxy.ts` — Refresh Supabase session cookies via `@supabase/ssr` on matched routes (`/seller/*`, `/dealer/*`, `/admin/*`, `/dashboard/*`, `/list-car/*`, `/verify-kyc/*`, `/settings/*`), redirect unauthenticated users to `/login?next=...`, and enforce role-to-portal boundaries.
    - `lib/api-client.ts` & `store/useSessionStore.ts` — Keep `{ data } | { error }` contract; rely on same-site HttpOnly cookies (`credentials: "include"`) and clean 401 redirect/clear without legacy mock token refresh loops.
  - **SRS / Rules:** NFR-05, RBAC Matrix (`SELLER`, `DEALER_ADMIN`, `DEALER_AGENT`, `ADMIN`).
  - **Exit Gate:** Unauthenticated request to `/seller/dashboard` or `/admin/moderation` redirects to `/login`; `npx tsc --noEmit` passes.

- [x] **`Prompt B2.2` — Real `/api/auth/*` Routes & Auth Service**
  - **Build From → To:** In-memory mock auth (`lib/mock/db.ts`) → production Supabase Auth flows with profile hydration, PIPEDA/CASL consent capture, and verified OTP/password reset flows.
  - **Files to Create/Modify:**
    - `lib/server/services/auth.service.ts` — Registration (creates Supabase user + `profiles` + `user_consents` timestamped rows), Login (sets `@supabase/ssr` cookies, hydrates `SessionUser`), Logout, `getCurrentUser()`, Password Forgot/Reset via Supabase Auth, Contact Verification bridge (handles Supabase email OTP + sandbox/Twilio phone OTP cleanly).
    - Replace internals of `app/api/auth/{register,login,logout,me,refresh,session}/route.ts`, `app/api/auth/verify/{[channel],resend}/route.ts`, `app/api/auth/registrations/[registrationId]/route.ts`, `app/api/auth/password/{forgot,reset}/route.ts`.
    - Gate `app/api/auth/dev-switch/route.ts` strictly behind `NODE_ENV !== 'production'` (or explicit demo flag) and sign into real seeded Supabase demo accounts.
  - **SRS / Rules:** FR-EU-01, NFR-08 (PIPEDA/CASL explicit consent timestamps), zero mock DB dependency.
  - **Exit Gate:** Register, login (all 3 demo roles), `/api/auth/me`, refresh page (session persists via cookie), and logout all work end-to-end against Supabase Auth; `npx tsc --noEmit` passes.

- [x] **`Prompt B2.3` — Storage Adapter (`ca-central-1`), Presigned Direct Uploads & KYC Intake**
  - **Build From → To:** Fake `/api/mock/s3-upload` + mock KYC timer → real Supabase Storage buckets (`listing-media`, `kyc-docs`, `dispute-evidence`) with signed PUT URLs and real `kyc_submissions` persistence.
  - **Files to Create/Modify:**
    - `supabase/migrations/0009_storage_buckets.sql` & `supabase/migrations/0010_audit_logs_erasure_compat.sql` — Provision buckets + Storage RLS policies (`kyc-docs` strictly private; `listing-media` authenticated upload + public read; MIME & 10MB/20MB size limits) + keep immutable `audit_logs` compatible with user `ON DELETE SET NULL` cascades.
    - `lib/server/adapters/storage.adapter.ts` — Clean `StorageAdapter` interface + `SupabaseStorageAdapter` (`createSignedUploadUrl`, `getPublicUrl`, `createSignedReadUrl`, `deleteObject`) with `// TODO(senior-review): swap to S3StorageAdapter for dedicated AWS S3 + CloudFront`.
    - `lib/server/adapters/kyc.adapter.ts` & `lib/server/services/kyc.service.ts` — Provider-ready KYC adapter (`submitVerification`, `parseWebhookPayload`) + service storing `KYC_BIOMETRIC` consent, `kyc_submissions`, `profiles.kyc_status`, and immutable `audit_logs` (FR-EU-02) with configurable sandbox auto-verify or Admin/manual mode.
    - Replace `app/api/listings/media/presign/route.ts`, `app/api/kyc/submissions/route.ts`, and `app/api/kyc/status/route.ts` (verify `PhotoUploadStep.tsx` direct PUT works seamlessly with Supabase signed upload URL).
  - **SRS / Rules:** FR-EU-02, FR-EU-05, H11 (direct browser upload; EXIF stripped client-side).
  - **Exit Gate:** Uploading vehicle photos in `/seller/list-car` Step 4 PUTs real WebP files directly into Supabase Storage (`ca-central-1`) and renders them; KYC submission writes to `kyc_submissions`; `npx tsc --noEmit` passes.

---

### Phase B3 — Seller Listing Pipeline, VIN Cache & Admin Moderation Launch (Day 3 AM)

- [x] **`Prompt B3.1` — Cached NHTSA vPIC VIN Decoder Adapter**
  - **Build From → To:** Mock VIN route → live NHTSA vPIC decoder with ISO 3779 check-digit validation, 3-second `AbortController` timeout, Postgres `vin_decode_cache`, and graceful fallback to manual entry.
  - **Files to Create/Modify:**
    - `lib/server/adapters/vin.adapter.ts` — Validate 17-char ISO 3779 check digit, check `vin_decode_cache` (30-day TTL), fetch NHTSA vPIC with 3s timeout, cache normalized specs, return `{ decoded, fallbackManual: true }` on upstream timeout (never crash).
    - Replace `app/api/vin/decode/route.ts`.
  - **SRS / Rules:** FR-EU-03, AC-01 (< 3s response, graceful manual fallback).
  - **Exit Gate:** Valid Canadian VIN decodes live on first call, serves instantaneously from `vin_decode_cache` on second call; invalid VIN returns structured 400 `INVALID_VIN`; `npx tsc --noEmit` passes.

- [x] **`Prompt B3.2` — Seller Listing Creation, Dashboard & Sealed-Bid Detail API**
  - **Build From → To:** Mock seller dashboard & listing routes → full Postgres-backed listing creation, real seller dashboard aggregates, and sealed-bid-safe listing detail endpoint.
  - **Files to Create/Modify:**
    - `lib/server/services/listing.service.ts` — `createListing()` (enforces `kyc_status === 'VERIFIED'` BR-01, active-VIN uniqueness BR-02, integer `BIGINT` cents, inserts `listings` + `listing_media` + `damage_hotspots` + `audit_logs`), `getSellerDashboard()` (real stats & listings), `getSellerListingDetail()` (**CRITICAL:** strictly returns `unsealedBids: undefined` whenever `status === 'ACTIVE'`, and ranked unsealed bids + distance + dealer badge ONLY when `status IN ('UNSEALED','ACCEPTED','COMPLETED')`).
    - Replace `app/api/listings/route.ts`, `app/api/seller/dashboard/route.ts`, and `GET` in `app/api/listings/[id]/route.ts`.
  - **SRS / Rules:** FR-EU-04, FR-EU-06, FR-EU-07, FR-EU-08, FR-EU-11, BR-01, BR-02, BR-04, H1, AC-04.
  - **Exit Gate:** Seller completes 5-step wizard → car appears in Postgres as `PENDING_MODERATION` and renders on `/seller/dashboard`; `GET /api/listings/[id]` on an `ACTIVE` auction contains **zero** bid dollar amounts or dealer names in the JSON payload.

- [ ] **`Prompt B3.3` — Admin Listing Moderation Queue & 24h Auction Launch**
  - **Build From → To:** Hardcoded `lib/mock/admin-moderation.ts` → real Admin moderation endpoints wired to `ListingModerationView` & `ListingModerationDetailView` that launch real 24h auctions.
  - **Files to Create/Modify:**
    - `lib/server/services/moderation.service.ts` — `listModerationQueue()`, `getModerationDossier(id)`, `decideListing(id, action: 'APPROVE' | 'REQUEST_EDITS' | 'REJECT', reason)` — on `APPROVE`: reads `auction_duration_hours` from `platform_config`, sets `status = 'ACTIVE'`, `auction_started_at = NOW()`, `auction_ends_at = NOW() + interval`, writes `audit_logs` + seller `notifications` row.
    - Create `app/api/admin/moderation/route.ts` (`GET`) and `app/api/admin/moderation/[id]/route.ts` (`GET`, `PATCH`).
    - Create `hooks/useAdminModeration.ts` and wire `components/admin/ListingModerationView.tsx` + `ListingModerationDetailView.tsx` to real TanStack Query hooks (removing `INITIAL_MODERATION_QUEUE` dependency).
  - **SRS / Rules:** FR-AD-03, FR-EU-07, BR-03, FR-AD-09 (audit trail).
  - **Exit Gate:** Admin approves the newly submitted vehicle on `/admin/moderation/[id]` → status transitions to `ACTIVE` with exact 24h `auction_ends_at`, and `audit_logs` records the admin decision; `npx tsc --noEmit` passes.

---

### Phase B4 — Live Sealed Bidding, Realtime Telemetry, Unsealing & PM Demo Gate (Days 3 PM–5)

- [ ] **`Prompt B4.1` — Dealer Trading Floor & Inspection Dossier APIs**
  - **Build From → To:** Hardcoded dealer inventory & `MOCK_DEALER_INVENTORY_DATABASE` → real Postgres-backed active auction feed & full vehicle inspection sheet showing ONLY the dealer's own bid.
  - **Files to Create/Modify:**
    - `lib/server/services/dealer-feed.service.ts` — `listActiveInventory(dealerCtx, filters)` & `getDealerAuctionDetail(dealerCtx, listingId)` joining `listings` + `listing_media` + `damage_hotspots` + ONLY `bids WHERE dealership_id = dealerCtx.dealershipId` (never exposing competitor bids!) + quota summary from `subscriptions`.
    - Replace `app/api/dealer/inventory/route.ts` & `app/api/dealer/inventory/[id]/route.ts`.
    - Create `hooks/useDealerInventory.ts` and wire `components/dealer/VehicleInspectionView.tsx` (and verify `DealerInventoryFeed.tsx`) to real TanStack Query data.
  - **SRS / Rules:** FR-DL-06, BR-04, H1.
  - **Exit Gate:** Approved listing immediately appears on `/dealer/inventory` and `/dealer/auctions/[id]` with real uploaded photos & mapped damage hotspots; competitor bids never appear in API payload.

- [ ] **`Prompt B4.2` — Atomic Upward-Only Sealed Bidding (`submit_dealer_bid` RPC)**
  - **Build From → To:** Mock `/api/dealer/bid` → atomic Postgres-locked sealed bid submission with idempotency, upward-only validation, and active subscription/quota enforcement.
  - **Files to Create/Modify:**
    - `lib/server/services/bidding.service.ts` — Validates `DEALER_ADMIN | DEALER_BUYER` seat role (blocks `DEALER_INSPECTOR`), validates integer cents ≥ `$1,000` CAD, generates/propagates `idempotencyKey`, calls `submit_dealer_bid` Postgres RPC, translates Postgres exceptions (`AUCTION_NOT_ACTIVE`, `BID_MUST_INCREASE`, `SUBSCRIPTION_PAST_DUE`, `QUOTA_EXCEEDED`) into clean typed HTTP errors (`409` / `402` / `400`).
    - Replace `app/api/dealer/bid/route.ts` and wire `components/dealer/SealedBidSlip.tsx` to pass `idempotencyKey` and invalidate dealer inventory/active-bids queries cleanly.
  - **SRS / Rules:** FR-DL-07, FR-DL-08, BR-05, BR-06, H2, NFR-02 (< 200ms), NFR-14, NFR-15, AC-03.
  - **Exit Gate:** Dealer submits `$35,000` (`3500000`) → succeeds & increments `listings.bid_count`; submitting `$34,000` fails with structured `409 BID_MUST_INCREASE`; raising to `$36,500` updates bid without double-counting `bid_count`.

- [ ] **`Prompt B4.3` — Supabase Realtime Live Bid Counter & Server-Synced Countdown**
  - **Build From → To:** Static mock bid count & client clock → live WebSocket telemetry synced to Supabase Realtime (`listings.bid_count`, `status`, `auction_ends_at`) with zero bid-amount broadcasting.
  - **Files to Create/Modify:**
    - `hooks/useAuctionRealtime.ts` — Subscribes via `lib/supabase/client.ts` to `postgres_changes` (`UPDATE` on `public.listings`), computes drift-free countdown offset against server timestamp returned in API payload, invalidates TanStack Query automatically when `status` flips to `UNSEALED`, cleanly unsubscribes on unmount.
    - Wire into `components/seller/SellerActiveAuctionView.tsx`, `components/dealer/DealerInventoryFeed.tsx`, and `components/dealer/VehicleInspectionView.tsx`.
  - **SRS / Rules:** H5, FR-EU-08, `context/architecture.md` (no `setInterval` polling).
  - **Exit Gate:** Open Seller tab & Dealer tab side-by-side → Dealer submits bid → Seller's sealed bid count increments live in < 1s with zero page reload and zero bid dollar amounts in WebSocket or HTTP traffic.

- [ ] **`Prompt B4.4` — Post-Auction Unsealing, Dealer Selection Voucher & Admin Auction Overrides**
  - **Build From → To:** In-memory Map acceptance & hardcoded `AdminAuctionsView` → atomic `accept_dealer_bid` RPC, real Appointment Voucher, and Admin Auction Oversight (`/api/admin/auctions`) with time extension, live force-close (for PM demo!), and emergency `HALT`.
  - **Files to Create/Modify:**
    - `lib/server/services/fulfillment.service.ts` — `acceptDealerOffer(sellerId, listingId, bidId, reason)` calling `accept_dealer_bid` RPC; returns full `AppointmentVoucher` hydrated from winning `dealerships` row.
    - `lib/server/services/admin-auctions.service.ts` — `listAllAuctions()`, `extendAuction(adminId, id, hours, reason)`, `forceCloseAuction(adminId, id, reason)` (`ACTIVE → UNSEALED` for demo/ops), `haltAuction(adminId, id, reason)` (`CANCELLED`) — every action logs mandatory reason in `audit_logs`.
    - Replace `POST` in `app/api/listings/[id]/route.ts`, create `app/api/admin/auctions/route.ts` and `app/api/admin/auctions/[id]/override/route.ts`.
    - Create `hooks/useAdminAuctions.ts` and wire `components/admin/AdminAuctionsView.tsx` (and verify `DealerSelectionView.tsx` + `AppointmentVoucherCard.tsx`).
  - **SRS / Rules:** FR-EU-09, FR-EU-10, FR-AD-04, BR-07, BR-08, H4, AC-02.
  - **Exit Gate:** Admin force-closes (or `pg_cron` closes) an auction → Seller sees ranked unsealed bids on `/seller/listings/[id]/select-dealer` → clicks Accept → `/seller/listings/[id]/appointment` displays real DB-persisted voucher & 24h expiry.

- [ ] **`Prompt B4.5` — Dealer Active Bids, Won Matches Outcome Logger & PM DEMO GATE**
  - **Build From → To:** Hardcoded `DealerActiveBidsView` & `DealerWonMatchesView` → real DB-backed bids & match fulfillment logging (`COMPLETED`, `RENEGOTIATED_LOWER`, `NO_SHOW`, `DECLINED_AFTER_INSPECTION`) + live Vercel Preview Deployment.
  - **Files to Create/Modify:**
    - Create `app/api/dealer/active-bids/route.ts` (`GET`), `app/api/dealer/won-matches/route.ts` (`GET`), `app/api/dealer/won-matches/[id]/outcome/route.ts` (`POST` — updates `matches.outcome`, `final_price_cents`, `outcome_notes`, transitions `listings.status = 'COMPLETED'` when sold or releases back to `UNSEALED` if declined/no-show, writes `audit_logs`).
    - Create `hooks/useDealerBids.ts` and wire `components/dealer/DealerActiveBidsView.tsx` & `components/dealer/DealerWonMatchesView.tsx`.
    - Configure Vercel Preview environment variables on `feat/supabase-backend` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ENABLE_MOCK_API=false`) via Vercel MCP/Dashboard; keep Production `main` untouched.
  - **SRS / Rules:** FR-DL-09, FR-DL-10, BR-10, BR-11.
  - **PM DEMO EXIT GATE (MANDATORY):** Run full 3-role E2E walkthrough on the live Vercel Preview URL: Seller login → 5-step VIN/photo/damage listing → Admin approve → Dealer sealed bid + live Realtime counter on Seller tab (DevTools verifies zero bid amounts leaked) → Auction close → Seller selects winning dealer → Appointment Voucher generated → Dealer logs `COMPLETED` sale in Won Matches. `npx tsc --noEmit` & `npm run build` pass cleanly.

---

## PART II — COMPLETE PLATFORM PORTALS & INTEGRATIONS (Phases B5–B7 · Remaining ~30–35% · ~8–10 Working Days)

### Phase B5 — PostGIS Spatial Radius Engine, Dealer Onboarding & Team Management

- [ ] **`Prompt B5.1` — PostGIS Radius Search & Canadian Postal Geocoding**
  - **Build From → To:** Placeholder `distanceKm` → real Canadian postal-centroid lookup + PostGIS `ST_DWithin` geography query returning exact dealership-to-vehicle distance in km.
  - **Files to Create/Modify:**
    - `supabase/migrations/0009_postal_centroids_and_geo_rpc.sql` — Seed Canadian FSA/major city centroids (`ON`, `QC`, `BC`, `AB`, `MB`, `SK`, `NS`, `NB`, `NL`, `PE`) + PostGIS RPC `get_dealer_inventory_with_distance(p_dealership_id, p_max_distance_km, p_filters)` using `ST_DWithin` & `ST_Distance`.
    - `lib/server/adapters/geo.adapter.ts` — Resolves postal code → `(lat, lng)` from `postal_centroids` with optional Google Geocoding API upgrade (`// TODO(senior-review)`).
    - Wire automatic `location` geocoding into listing creation (`listing.service.ts`), dealership registration, dealer inventory feed, and seller unsealed bid distance sorting.
  - **SRS / Rules:** FR-X-03, FR-X-05, FR-DL-06, H6.
  - **Exit Gate:** Dealer feed filters accurately by 50km / 100km / 250km radius using real PostGIS `ST_DWithin`, and Seller unsealed offers sort accurately by Nearest Dealership (`distanceKm`).

- [ ] **`Prompt B5.2` — Dealership Licensing Onboarding & Admin License Verification**
  - **Build From → To:** Hardcoded `DealerRegisterView` & `DealerVerificationView` → real dealership application intake + Admin OMVIC/AMVIC/VSA verification workflow with BR-14 suspension handling.
  - **Files to Create/Modify:**
    - `lib/server/services/dealer-verification.service.ts` — `submitDealershipApplication()`, `listDealerApplications()`, `decideDealership(adminId, id, action: 'APPROVE' | 'REJECT' | 'SUSPEND' | 'REVOKE', notes)` — on `APPROVE`: grants `DEALER_ADMIN` role + syncs JWT `dealership_id`; on `SUSPEND`/`REVOKE`: atomically voids all `ACTIVE` bids from that dealership & decrements affected `listings.bid_count` (BR-14), writes `audit_logs`.
    - Create `app/api/dealer/register/route.ts`, `app/api/admin/dealers/route.ts`, `app/api/admin/dealers/[id]/route.ts`.
    - Create `hooks/useDealerOnboarding.ts` & `hooks/useAdminDealers.ts`; wire `components/dealer/DealerRegisterView.tsx` & `components/admin/DealerVerificationView.tsx`.
  - **SRS / Rules:** FR-DL-01, FR-DL-02, FR-AD-02, BR-13, BR-14.
  - **Exit Gate:** New dealer submits OMVIC application → Admin approves on `/admin/dealers` → dealer gains bidding access; suspending dealer immediately voids their active bids and blocks new bids.

- [ ] **`Prompt B5.3` — Dealership Multi-User Team & Seat Management**
  - **Build From → To:** Local-state `DealerTeamView` → real `dealership_members` invite, role assignment, and revocation protected strictly by `DEALER_ADMIN`.
  - **Files to Create/Modify:**
    - `lib/server/services/dealer-team.service.ts` — `listTeam()`, `inviteMember()` (checks plan seat limit, creates Supabase invited user or links profile, sets `dealership_members.seat_role` as `DEALER_ADMIN | DEALER_BUYER | DEALER_INSPECTOR`), `updateMemberRole()`, `removeMember()`.
    - Create `app/api/dealer/team/route.ts` (`GET`, `POST`) and `app/api/dealer/team/[memberId]/route.ts` (`PATCH`, `DELETE`).
    - Create `hooks/useDealerTeam.ts` and wire `components/dealer/DealerTeamView.tsx`.
  - **SRS / Rules:** FR-DL-04 (`DEALER_ADMIN` manages team; `DEALER_INSPECTOR` cannot bid; `DEALER_BUYER` cannot access billing/team).
  - **Exit Gate:** `DEALER_ADMIN` invites a buyer & inspector, updates role, and revokes seat; `DEALER_AGENT` receives `403 FORBIDDEN` on `/api/dealer/team`.

---

### Phase B6 — Disputes, Platform Analytics, Immutable Audit Log, Relisting & Settings

- [ ] **`Prompt B6.1` — Dispute Arbitration Engine & Hoist Evidence Intake**
  - **Build From → To:** Hardcoded `lib/mock/admin-disputes.ts` → real `disputes` + `dispute_timeline` workflow from declined/disputed dealer inspection through binding Admin resolution.
  - **Files to Create/Modify:**
    - `lib/server/services/dispute.service.ts` — `openDispute()` (auto-linked when dealer logs inspection discrepancy/dispute), `listDisputes()`, `getDisputeDetail()`, `resolveDispute(adminId, id, decision: 'APPROVE_ADJUSTMENT' | 'REJECT_CLAIM' | 'MUTUAL_CANCEL', adjustmentCents, notes)` (updates `matches`, appends `dispute_timeline` + `audit_logs`).
    - Create `app/api/disputes/route.ts`, `app/api/admin/disputes/route.ts`, `app/api/admin/disputes/[id]/route.ts`.
    - Create `hooks/useAdminDisputes.ts` and wire `components/admin/DisputeManagementView.tsx` & `DisputeDetailView.tsx`.
  - **SRS / Rules:** FR-AD-06, BR-11, NFR-14 (integer cents adjustment math).
  - **Exit Gate:** Dealer opens dispute with hoist photos → Admin reviews full dossier & executes binding resolution → timeline and `audit_logs` update persistently.

- [ ] **`Prompt B6.2` — Admin Platform Analytics SQL Views & Immutable Audit Log**
  - **Build From → To:** Hardcoded charts/tables in `AdminAnalyticsView` & `AdminAuditLogView` → live PostgreSQL aggregation views/RPCs and paginated, tamper-evident audit log with CSV export.
  - **Files to Create/Modify:**
    - `supabase/migrations/0010_analytics_views_and_audit_hash.sql` — Postgres views/RPCs for GMV (`SUM(final_price_cents)`), fill rate, avg bids/listing, provincial breakdown, metro hub intake vs. clearance, top sourcing dealerships, wholesale settlement ledger; add `BEFORE INSERT` trigger on `audit_logs` computing SHA-256 chain hash (`immutable_hash`).
    - Create `app/api/admin/analytics/route.ts` and `app/api/admin/audit-log/route.ts` (paginated, filterable by action/entity/province/date + `?format=csv` export).
    - Create `hooks/useAdminAnalytics.ts` & `hooks/useAdminAuditLog.ts`; wire `components/admin/AdminAnalyticsView.tsx` & `components/admin/AdminAuditLogView.tsx`.
  - **SRS / Rules:** FR-AD-07, FR-AD-09, H8, NFR-11.
  - **Exit Gate:** Analytics dashboard reflects real DB totals from completed auctions; audit log displays real SHA-256 hashed entries and rejects any SQL `UPDATE`/`DELETE` attempt.

- [ ] **`Prompt B6.3` — Seller Relisting, Profile Settings & Admin Platform Configuration**
  - **Build From → To:** Static `ProfileSettingsView` & unimplemented relisting/config → live profile & security settings, FR-EU-13 relisting with 24h cooldown, and FR-AD-08 dynamic platform config.
  - **Files to Create/Modify:**
    - `lib/server/services/settings.service.ts` — Update profile fields, province, `language_pref`, notification preferences, password change; `relistVehicle()` enforcing cooldown (`relist_cooldown_hours` from `platform_config`, creating child listing with `parent_listing_id` & incremented `relist_count`).
    - Create `app/api/listings/[id]/relist/route.ts`, `app/api/settings/profile/route.ts`, `app/api/settings/security/route.ts`, `app/api/admin/config/route.ts` (`GET`, `PATCH` with audit log).
    - Create `hooks/useProfileSettings.ts` and wire `components/settings/ProfileSettingsView.tsx`.
  - **SRS / Rules:** FR-EU-13, BR-12, FR-AD-08, FR-AD-01 (admin user status management).
  - **Exit Gate:** Seller profile edits persist across refresh; zero-bid/expired listing enforces cooldown before relisting; admin config updates take effect without code changes.

---

### Phase B7 — Stripe CAD Subscriptions & Multi-Channel Notifications

- [ ] **`Prompt B7.1` — Stripe Billing Adapter, Checkout, Portal & Invoices**
  - **Build From → To:** Static `DealerSubscriptionView` & `DealerBillingView` → real Stripe CAD Checkout Sessions, Customer Billing Portal, plan catalog from `plans` table, and downloadable invoice history.
  - **Files to Create/Modify:**
    - Install `stripe` (`package.json`).
    - `lib/server/adapters/billing.adapter.ts` — `createCheckoutSession()`, `createBillingPortalSession()`, `constructWebhookEvent()` (gracefully surfaces `BILLING_NOT_CONFIGURED` if `STRIPE_SECRET_KEY` is missing in local dev — zero crashes).
    - Create `app/api/dealer/subscription/route.ts`, `app/api/dealer/subscription/checkout/route.ts`, `app/api/dealer/subscription/portal/route.ts`, `app/api/dealer/billing/invoices/route.ts`, `app/api/admin/subscriptions/route.ts` (FR-AD-05).
    - Create `hooks/useDealerBilling.ts` and wire `components/dealer/DealerSubscriptionView.tsx` & `components/dealer/DealerBillingView.tsx`.
  - **SRS / Rules:** FR-DL-03, FR-DL-11, FR-AD-05, SRS §7.7.
  - **Exit Gate:** `DEALER_ADMIN` launches Stripe Test Checkout from `/dealer/subscription` and views real persisted invoices & quota usage on `/dealer/billing`.

- [ ] **`Prompt B7.2` — Idempotent Stripe Webhooks & Hard Subscription Bid Gating**
  - **Build From → To:** Seeded static dealer subscriptions → full webhook-driven lifecycle (activation, renewal quota reset, `PAST_DUE` dunning & HTTP 402 bid blocking).
  - **Files to Create/Modify:**
    - `app/api/webhooks/stripe/route.ts` — Raw body HMAC signature verification (`stripe.webhooks.constructEvent`), atomic deduplication via `stripe_webhook_events(event_id PRIMARY KEY)`, handles `checkout.session.completed`, `invoice.paid` (sets `ACTIVE`, updates period, resets `bids_used = 0`, inserts `payments`), `invoice.payment_failed` (sets `PAST_DUE`, triggers dunning alert), `customer.subscription.deleted` (sets `EXPIRED`).
    - Verify `submit_dealer_bid` RPC and `bidding.service.ts` strictly reject bids with **HTTP 402 `SUBSCRIPTION_PAST_DUE` / `QUOTA_EXCEEDED`** when inactive.
  - **SRS / Rules:** FR-DL-03, BR-06, H9, AC-03.
  - **Exit Gate:** Replaying the same Stripe webhook event twice (via Stripe CLI / test harness) is 100% idempotent; a `PAST_DUE` dealer receives HTTP 402 when attempting to bid.

- [ ] **`Prompt B7.3` — Persistent Notification Center & Multi-Channel CASL Fan-Out**
  - **Build From → To:** Hardcoded notification arrays → persistent `notifications` table with live Realtime bell + crash-proof Email (SendGrid/Resend) & SMS (Twilio) adapter with CASL unsubscribe compliance.
  - **Files to Create/Modify:**
    - `lib/server/adapters/notification.adapter.ts` — Persists `notifications` row first (always succeeds), checks `user_consents` / CASL preferences, dispatches Email/SMS when keys are present or records `SANDBOX_LOGGED` in `notification_deliveries` when absent; includes `List-Unsubscribe` header and EN/FR template hook (`locale`).
    - Create `app/api/notifications/route.ts` (`GET`, `PATCH` mark-read) and `app/api/notifications/unsubscribe/route.ts` (signed 1-click CASL unsubscribe token).
    - Wire fan-out triggers into: (1) listing approval → PostGIS radius query notifying all eligible subscribed dealerships (FR-DL-05 / AC-06), (2) auction close → notify seller, (3) match created → notify seller + winning dealer + non-selected dealers, (4) acceptance expiry.
    - Wire `components/seller/SellerNotificationDropdown.tsx` & `SellerNotificationFeed.tsx` (+ Realtime subscription).
  - **SRS / Rules:** FR-DL-05, FR-X-01, H10, AC-06, CASL compliance.
  - **Exit Gate:** Approving a listing creates real in-app notifications + delivery logs for every verified subscribed dealership within radius; bell badge updates live via Realtime.

---

## PART III — SECURITY HARDENING, TESTS, SENIOR HANDOFF & BILINGUAL TRACK (Phases B8–B10)

### Phase B8 — Security Hardening, TOTP MFA, Rate Limiting & Privacy Compliance

- [ ] **`Prompt B8.1` — Mandatory TOTP MFA for `ADMIN` & `DEALER_ADMIN` (NFR-06)**
  - **Build From → To:** Password-only login for privileged roles → native Supabase TOTP MFA (`supabase.auth.mfa`) enrollment, QR setup, verification challenge, and server-side AAL2 enforcement.
  - **Files to Create/Modify:**
    - `lib/server/auth.ts` — Add `requireAal2ForPrivilegedRoles()` enforcing verified MFA (`aal2`) for `ADMIN` and `DEALER_ADMIN` on sensitive routes (with clear `MFA_REQUIRED` error code & enrollment flow).
    - Create `app/api/auth/mfa/{enroll,verify,factors}/route.ts` and wire TOTP QR enrollment + challenge dialog in `/settings/security` and `/login`.
  - **SRS / Rules:** NFR-06, H7.
  - **Exit Gate:** `ADMIN` and `DEALER_ADMIN` can enroll an authenticator app (TOTP), pass challenge at login, and are blocked from privileged mutations if MFA is unverified.

- [ ] **`Prompt B8.2` — Rate Limiting, Security Headers & Supabase Advisor Audit**
  - **Build From → To:** Unthrottled API routes → rate-limited auth/OTP/VIN/bid endpoints, hardened security headers, and zero critical warnings from Supabase Security & Performance Advisors.
  - **Files to Create/Modify:**
    - `lib/server/rate-limit.ts` — Sliding-window rate limiter supporting Upstash Redis in production with automatic safe in-memory fallback in dev (`auth/login`: 10/15m, `auth/verify`: 5/15m, `dealer/bid`: 30/min, `vin/decode`: 20/min — returns `429 RATE_LIMITED` + `Retry-After`).
    - `next.config.ts` — Add OWASP security headers (`Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, scoped `Content-Security-Policy`).
    - Run Supabase MCP `get_advisors(type="security")` and `get_advisors(type="performance")` → create `supabase/migrations/0011_security_and_perf_hardening.sql` resolving every warning (e.g., `search_path`, unindexed FKs, overly broad policies).
  - **SRS / Rules:** NFR-07, OWASP Top 10.
  - **Exit Gate:** Rapid-firing `/api/auth/login` triggers `429`; Supabase security & performance advisors report zero ERROR/CRITICAL issues.

- [ ] **`Prompt B8.3` — PIPEDA / Quebec Law 25 Privacy APIs & Optional AWS S3 Drop-In**
  - **Build From → To:** Consent storage only → full PIPEDA/Law 25 right-of-access JSON export, 30-day deletion workflow, and drop-in AWS S3 `ca-central-1` storage adapter for Senior production promotion.
  - **Files to Create/Modify:**
    - Create `app/api/settings/privacy/export/route.ts` (authenticated downloadable JSON bundle of user profile, consents, vehicles, listings, bids, matches — never exposing competitor bids!) and `app/api/settings/privacy/delete/route.ts` (creates erasure request, anonymizes/schedules 30-day cascade deletion while preserving statutory 7-year anonymized audit records).
    - Wire PIPEDA data portability & deletion buttons in `components/settings/ProfileSettingsView.tsx`.
    - Add `S3StorageAdapter` class inside `lib/server/adapters/storage.adapter.ts` (activated via `STORAGE_DRIVER=s3` env flag; uses AWS S3 `ca-central-1` presigned PUT URLs with zero route changes).
  - **SRS / Rules:** NFR-08, NFR-09, NFR-11, PIPEDA & Quebec Law 25.
  - **Exit Gate:** Seller downloads complete personal JSON export from `/settings/profile`; switching `STORAGE_DRIVER` compiles cleanly with typed config validation.

---

### Phase B9 — Automated Test Suite, CI Gate & Senior Engineer Handoff

- [ ] **`Prompt B9.1` — Vitest Setup, ≥70% Unit Tests & Automated Sealed-Bid RLS Leak Tests**
  - **Build From → To:** Manual QA only → automated Vitest test suite covering auction engine, bidding concurrency rules, integer-cents math, Stripe webhook idempotency, and real Postgres RLS isolation tests.
  - **Files to Create/Modify:**
    - Install `vitest` (`package.json`, `vitest.config.ts`, `"test": "vitest run"`, `"test:coverage": "vitest run --coverage"`).
    - `tests/unit/currency.test.ts` — Integer CAD cents invariants (zero float drift).
    - `tests/unit/bidding.service.test.ts` — Upward-only rules, seat-role blocks, HTTP 402 `PAST_DUE` gating, error mapping.
    - `tests/unit/listing-secrecy.test.ts` — Proves `ACTIVE` listing serializer strips all bid amounts/dealer identities (AC-04).
    - `tests/unit/stripe-webhook.test.ts` — Signature validation & duplicate-event idempotency.
    - `tests/integration/rls-sealed-bids.test.ts` — Authenticates as Seller, Dealer A, and Dealer B against Supabase and proves Seller gets 0 rows from `bids` while `ACTIVE` and Dealer B cannot read Dealer A's bids.
  - **SRS / Rules:** NFR-16 (≥70% unit-test coverage on auction engine & billing), H12, AC-01..AC-06.
  - **Exit Gate:** `npm run test:coverage` passes 100% with ≥70% coverage on `lib/server/services/*` & billing logic.

- [ ] **`Prompt B9.2` — GitHub Actions CI & Senior Engineer Handoff Package**
  - **Build From → To:** Local checks only → automated GitHub Actions PR CI gate + complete architecture & production-promotion handoff manual for your Senior Backend Engineer.
  - **Files to Create/Modify:**
    - `.github/workflows/ci.yml` — Runs `npm ci`, `npx tsc --noEmit`, `npm run lint`, `npm run test`, `npm run build` on every push/PR to `feat/supabase-backend` & `main`.
    - `docs/backend-handoff.md` — Comprehensive handoff guide: final ERD summary, migration order (`0001`–`0011`), RLS policy matrix, every env var, list of all `TODO(senior-review)` markers, and production go-live checklist (enable Supabase Pro + PITR for NFR-10 1h RPO, configure AWS S3 `ca-central-1` Object Lock 7-year `audit_logs` archival for NFR-11, Upstash QStash exact-second timers alongside `pg_cron`, live Stripe/SendGrid/Twilio/Persona keys).
  - **SRS / Rules:** NFR-10, NFR-11, NFR-16.
  - **Exit Gate:** CI workflow YAML valid; `npx tsc --noEmit`, `npm run lint`, `npm run test`, `npm run build` all pass with 0 errors; Vercel Preview full-stack smoke test 100% green and ready for Senior PR review.

---

### Phase B10 (Separate Track) — Bilingual EN/FR Parity (`next-intl`, Quebec Law 25)

- [ ] **`Prompt B10.1` — `next-intl` Setup, `[locale]` Routing & Preference Sync**
  - **Build From → To:** English-only routing → `next-intl` configured with `/en` and `/fr` routes, `messages/en.json` & `messages/fr.json` scaffolding, and locale switcher synced with `profiles.language_pref`.
  - **Exit Gate:** `/en` and `/fr` load cleanly with zero hydration mismatch and preserve authenticated sessions across `proxy.ts`.

- [ ] **`Prompt B10.2` — Full Portal, Legal & Server-Side Bilingual Parity**
  - **Build From → To:** Scaffolded dictionaries → 100% English/French string coverage across marketing, auth, seller, dealer, admin, legal pages, API error codes, and notification/email templates.
  - **SRS / Rules:** FR-X-04, NFR-13, Quebec Law 25.
  - **Exit Gate:** Zero missing translation keys in EN/FR across all 26 routes and bilingual notification payloads verified.

---

## Agent Directives & Production Invariants

1. **Strict Sealed-Bid Invariant (H1 / BR-04):** The backend and UI must NEVER expose live bid CAD amounts or bidder identities to sellers or competing dealers while an auction is `ACTIVE`. Enforced in **both** Postgres RLS and `lib/server/services/listing.service.ts`. Only `bidCount` is returned.
2. **Strict Integer CAD Cents (NFR-14):** Never use floating-point arithmetic for currency. Store (`BIGINT`), calculate, and pass all dollar values as whole integer cents (e.g., `$35,000.00` = `3500000`). Format to decimals only in the final UI presentation layer.
3. **4-Layer Backend Boundary & Zero Crash Policy:** All mutations run via TanStack `useMutation` through `lib/api-client.ts` → `app/api/**` (wrapped in `handleApiRoute`) → `lib/server/services/*` → typed Supabase/RPCs & crash-proof `lib/server/adapters/*`. React components never query Supabase Postgres directly.
4. **Migration Discipline:** Every SQL schema, RLS, index, RPC, and `pg_cron` change MUST live in `supabase/migrations/00XX_*.sql`. Zero untracked dashboard edits.
5. **Living Component Imprinting & Tracking:** Update `progress-tracker.md` (check off completed `Prompt B#.#` & advance `Next Prompt`) after every verified prompt, and run `/imprint` after any new UI component.
6. **No Hardcoded Hex Colors:** Use designated design tokens (`bg-primary`, `bg-secondary`, `bg-portal-surface`, `text-portal-text`, `border-portal-border`, Autumn Editorial `#8C383E` Wine & `#E59344` Amber, `#10B981` Emerald checkmarks).