# Progress Tracker: AutoNexa & CAMP Platform

Update this file after every completed feature. Any AI agent reading this should immediately know what is done, what is in progress, and what is next.

---

## Current Status

**Phase:** 2 — AutoNexa Landing Page & Public Funnel
**Last completed:** 06-D Discover Inventory & Makes (`DiscoverSection.tsx` with concave notch product cards & docked action buttons)
**Next:** 06-E How It Works (`HowItWorks.tsx` with 3-step illustrated workflow)

---

## Progress

### Phase 1 — Foundation & Architecture
- [ ] 01 Next.js 15 Scaffold & Route Groups (`/marketing`, `/seller`, `/dealer`, `/admin`)
- [x] 02 Tailwind v4 & Autumn Editorial Design Tokens (`globals.css` @theme config)
- [ ] 03 `next-intl` Bilingual Setup (EN/FR for Quebec Law 25)
- [ ] 04 TanStack Query & Zustand Store Initialization
- [ ] 05 JWT Auth Wrapper & Middleware (Role segregation)

### Phase 2 — AutoNexa Landing Page & Public Funnel
- [x] 06-A Navbar (`Navbar.tsx` with logo, navigation links, and portal action buttons)
- [x] 06-B Hero Section (`HeroSection.tsx` with Epilogue display title, instant appraisal card)
- [x] 06-B.1 Micro-Section: As-Seen-On Media Ticker (`brands-logo` ribbon)
- [x] 06-C What is AutoNexa (`WhatIsAutoNexa.tsx` narrative value proposition & geometric showcase cards)
- [x] 06-D Discover Inventory & Makes (`DiscoverSection.tsx` with top comparison micro-section & car showcase cards)
- [ ] 06-E How It Works (`HowItWorks.tsx` with 3-step illustrated workflow)
- [ ] 06-F Key Features & Guarantees (`FeaturesSection.tsx` with sealed bid & compliance cards)
- [ ] 06-G Testimonials & Social Proof (`TestimonialsSection.tsx` with avatar cards)
- [ ] 06-H FAQs Accordion (`FaqSection.tsx` interactive collapsible FAQ)
- [ ] 06-I Final Conversion CTA Banner (`CtaBanner.tsx` pre-footer appraisal CTA)
- [ ] 06-J Footer (`Footer.tsx` brand links, OMVIC/AMVIC badges, and legal disclosures)
- [ ] 07 Legal Pages (`/legal/privacy` and `/legal/terms` PIPEDA & Law 25 compliant)

### Phase 3 — Seller Portal (Mobile-First / Light Mode)
- [ ] 08 Seller Dashboard UI & KYC Verification Gate
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
- **2026-09-25 (Section Architecture):** Established 10 sequential sections for the landing page with dedicated micro-sections (As-Seen-On press ticker, brand emblem carousel, and pre-footer CTA banner).

---

## Notes

- Assets in `public/` are mapped directly to their respective sections (`brands-logo/`, `car-company-logos/`, `illustrations/`, `showcase-cars-with-bg/`, `textures/`, `logo.png`).