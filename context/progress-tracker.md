# Progress Tracker: AutoNexa & CAMP Platform

Update this file after every completed feature. Any AI agent reading this should immediately know what is done, what is in progress, and what is next.

---

## Current Status

**Phase:** 3 — Seller Portal (onboarding funnel done, listing wizard next)
**Last completed:** 08 Seller onboarding funnel — VIN-first `/sell` → `/register` → `/verify` (email + SMS OTP) → `/verify-kyc` → `/dashboard` with KYC gate, wired to the landing page and running against mock API routes
**Next:** 09–13 Listing Wizard (VIN prefilled from `useSellIntentStore`), then 07 Legal Pages (the register form already links to `/legal/terms` and `/legal/privacy`)

---

## Progress

### Phase 1 — Foundation & Architecture
- [~] 01 Next.js 16 Scaffold & Route Groups — `(auth)` and `(seller)` exist; `(dealer)`, `(admin)` and the `[locale]` wrapper are still to come
- [x] 02 Tailwind v4 & Autumn Editorial Design Tokens (`globals.css` @theme config)
- [ ] 03 `next-intl` Bilingual Setup (EN/FR for Quebec Law 25)
- [x] 04 TanStack Query & Zustand Store Initialization (`app/providers.tsx`, `lib/query-keys.ts`, `store/`)
- [~] 05 JWT Auth Wrapper & Proxy — seller session done (in-memory access token + HttpOnly refresh cookie, `proxy.ts` optimistic redirect, `RequireSession` guard); role-based segregation for dealer/admin pending

### Phase 2 — AutoNexa Landing Page & Public Funnel
- [x] 06-A Navbar (`Navbar.tsx` with logo, navigation links, and portal action buttons)
- [x] 06-B Hero Section (`HeroSection.tsx` with Epilogue display title, instant appraisal card)
- [x] 06-B.1 Micro-Section: As-Seen-On Media Ticker (`brands-logo` ribbon)
- [x] 06-C What is AutoNexa (`WhatIsAutoNexa.tsx` narrative value proposition & geometric showcase cards)
- [x] 06-D Discover Inventory & Makes (`DiscoverSection.tsx` with top comparison micro-section & car showcase cards)
- [x] 06-E How It Works (`HowItWorks.tsx` with 3-step illustrated workflow)
- [x] 06-F Key Features & Guarantees (`FeaturesSection.tsx` with central logo core & editorial features)
- [x] 06-F.1 Dual Comparison Engine (`ComparisonCards.tsx` 2-card challenge/solution duel & `ComparisonMatrix.tsx` continuous full-height column audit)
- [x] 06-G Testimonials & Social Proof (`TestimonialsSection.tsx` with avatar cards)
- [x] 06-H FAQs Accordion (`FaqSection.tsx` interactive collapsible FAQ)
- [x] 06-I Final Conversion CTA Banner (`CtaBanner.tsx` pre-footer appraisal CTA)
- [x] 06-J Footer (`Footer.tsx` brand links, OMVIC/AMVIC badges, and legal disclosures)
- [ ] 07 Legal Pages (`/legal/privacy` and `/legal/terms` PIPEDA & Law 25 compliant)

### Phase 3 — Seller Portal (Mobile-First / Light Mode)
- [x] 08-A VIN-first entry `/sell` (ISO 3779 check digit + NHTSA vPIC decode, manual fallback) — hero widget routes here
- [x] 08-B Registration `/register` (FR-EU-01 fields, CASL opt-in, PIPEDA consent, 18+/owner attestation, postal→province suggest)
- [x] 08-C Email + SMS OTP verification `/verify` (attempt limit, resend cooldown, session issued on completion)
- [x] 08-D Login, forgot password, reset password (`/login`, `/forgot-password`, `/reset-password`)
- [x] 08-E KYC flow `/verify-kyc` (consent → ID front/back → selfie → review → PENDING → VERIFIED; provider stubbed)
- [x] 08-F Seller dashboard shell `/dashboard` with KYC gate banner and listing-start card (FR-EU-11 empty states)
- [ ] 08-G Swap mock API for Express (set `NEXT_PUBLIC_API_URL`); Google OAuth start/callback; real KYC provider SDK (liveness)
- [ ] 09 Listing Wizard: VIN Auto-decode via NHTSA VPIC
- [ ] 10 Listing Wizard: Details & Specs (Mileage, Trans, History)
- [ ] 11 Listing Wizard: Interactive SVG Damage Hotspot Mapper
- [ ] 12 Listing Wizard: Direct-to-S3 Image Upload (Client compressed, EXIF stripped)
- [ ] 13 Listing Wizard: Price Review & Submission

### Phase 4 — Dealer Terminal (Desktop / Dark Mode)
- [ ] 14 Dealer Dashboard & Subscription Gate UI (Stripe integration)
- [ ] 15 Live Inventory Feed (Regional radius filtered)
- [ ] 16 Vehicle Detail View (Carfax, Specs, Damage report)

### Phase 5 — The Bidding Engine (Real-Time)
- [ ] 17 Server-Synced 24h Countdown Timer UI
- [ ] 18 Dealer UI: Sealed Bid Submission & Upward Revision
- [ ] 19 Seller UI: Live Bid Count Telemetry (Bid amounts strictly hidden)

### Phase 6 — Resolution & Fulfillment
- [ ] 20 Seller UI: Post-Auction Unsealed Ledger & Dealer Selection
- [ ] 21 24h Acceptance Window Timer UI
- [ ] 22 Dealer UI: Offline Appointment Logger (Complete / No-Show / Decline)

### Phase 7 — Admin Backoffice
- [ ] 23 Listing Moderation Queue
- [ ] 24 Dealer License Verification Table (OMVIC / AMVIC / VSA)

---

## Agent Directives
*   **UI Imprinting:** Run `/imprint` after completing each landing page component in Phase 2 to register its exact props and Tailwind token classes in `ui-registry.md`.
*   **Design Compliance:** Every landing page component must adhere strictly to `DESIGN (3).md` and `ui-tokens.md` (terracotta wine `#8C383E`, honey amber `#E59344`, cream ivory canvas `#FFF8F2`, Epilogue display headers, Plus Jakarta Sans body).
*   **State Verification:** Run `/review` before finalizing the landing page or portal transitions.

---

## Decisions Made During Build

- **2026-09-25 (Architecture):** Adopted AutoNexa as the public-facing brand and product identity. Configured the Autumn Editorial design system from `DESIGN (3).md` for the entire marketing funnel while maintaining auction portal telemetry invariants.
- **2026-10-03 (Hero & Carousel Micro-Interactions):** Implemented interactive 3D perspective mouse hover tilt with specular glare highlight on `MarketValuationWidget.tsx`. Fixed `image_14.png` (Ford badge) in `BrandCarousel.tsx` with a transparent background cutout, eliminating the solid white oval fill under contrast filters.
- **2026-10-03 (Seller Marketplace Realignment):** Realigned `DiscoverSection.tsx` product cards from retail buyer inventory to verified recent dealer sales. Preserved 100% of card geometry while showing actual seller payouts, dealer bid counts, and surplus above trade-in offers.
- **2026-10-09 (Web App Design System & Dual-Theme Architecture):** Established dedicated Web App & Portal Design Tokens (Porcelain `#F8FAFC`, Obsidian `#080C14`, Racing Emerald scale `#16A34A` / `#10B981`) in `DESIGN (3).md`, `context/ui-tokens.md`, and `app/globals.css`. Configured glassmorphism utilities (`.glass-card`, `.glass-input`, `.glow-emerald`) over `public/illustrations/why-us.webp` for the upcoming Auth Suite.

- **2026-10-10 (Seller Onboarding Funnel):** Chose a VIN-first funnel — the hero widget hands off to `/sell`, the decoded VIN carries through registration in `useSellIntentStore` (VIN + postal only; specs stay in TanStack). Contact verification is email first, then SMS; a session is only issued once both pass (FR-EU-01). Built against Next.js route-handler mocks in `app/api/**` that mirror the planned Express contract (`{ data }` / `{ error: { code, message, fields, details } }`); mocks answer only in development or with `ENABLE_MOCK_API=true`. i18n (next-intl) deliberately deferred — new form strings are English-only and will need extracting in step 03.
- **2026-10-10 (Auth UI token note):** The registry's auth pattern called for `bg-white text-slate-950` / `text-neutral-400`; implemented with tokens instead (`text-portal-text`, `text-white/60`) to honour the no-raw-colour rule. Error text on the dark glass uses `text-primary-fixed-dim` because `text-error` fails contrast there.

- **2026-10-10 (Onboarding Light Theme, revised):** After review, the interim royal-blue theme was replaced with the brand's Autumn Editorial palette (wine `primary`, honey `secondary`, ivory `surface`) and a split layout with step-specific photography (`AuthVisualPanel`). Inputs and buttons now use 8px `rounded-sm`; the 24px `rounded-xl` read as pills. The temporary `trust-blue`/`portal-input-border`/`portal-text-secondary`/`portal-text-subtle` tokens were removed again.

---

## Notes

- Assets in `public/` are mapped directly to their respective sections (`brands-logo/`, `car-company-logos/`, `illustrations/`, `showcase-cars-with-bg/`, `textures/`, `logo.png`).