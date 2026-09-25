# Build Plan: AutoNexa & CAMP Platform

## Core Principle

Full page UI built with mock data first — verified visually before any logic is written. Then functionality is wired to the UI step by step. Every feature must be visible and testable before moving to the next. No invisible backend phases.

---

## Phase 1 — Foundation & Architecture

### 01 Next.js 15 Scaffold & Route Groups
**Logic:**
- Initialize Next.js 15 App Router with TypeScript strict mode.
- Configure localized routing structure using `next-intl` (`app/[locale]`).
- Scaffold role-based route groups: `(marketing)`, `(auth)`, `(seller)`, `(dealer)`, `(admin)`.

### 02 Tailwind v4 & Autumn Editorial Design Tokens
**UI:**
- Inject the Autumn Editorial design tokens (`@theme`) and typography definitions (`Epilogue`, `Plus Jakarta Sans`, `JetBrains Mono`) into `app/globals.css`.
- Configure base design primitives (Buttons, Cards, Badges, Inputs) in `components/ui`.

### 03 next-intl Bilingual Setup
**Logic:**
- Configure `next-intl` middleware to handle `/en` and `/fr` routing for Quebec Law 25 parity.
- Create `messages/en.json` and `messages/fr.json` dictionary files.

### 04 TanStack Query & Zustand Initialization
**Logic:**
- Set up `QueryClientProvider` in root layout.
- Create `src/lib/query-keys.ts` for strictly typed cache keys.

### 05 JWT Auth Wrapper & Middleware
**Logic:**
- Implement Next.js Middleware to protect routes based on JWT `role` claims (`SELLER`, `DEALER_ADMIN`, `DEALER_AGENT`, `ADMIN`).
- Unauthenticated users attempting to access portals redirect to `/login`.

---

## Phase 2 — AutoNexa Landing Page & Public Funnel

The AutoNexa landing page is built sequentially in `components/marketing/` following the Autumn Editorial design system and mapped directly to assets in `public/`.

### 06-A Navbar (`Navbar.tsx`)
**UI:**
- Brand logo (`/logo.png`) with clean height and responsive alignment.
- Navigation links (`About`, `Discover`, `How It Works`, `Features`, `FAQs`).
- Quick actions: "Dealer Sign In" (secondary wine outline) + "Get Cash Offer" (primary terracotta wine fill).
- Responsive mobile drawer navigation with smooth slide-over.

### 06-B Hero Section & As-Seen-On Ticker (`HeroSection.tsx`)
**UI:**
- Large editorial headline in `Epilogue` (`text-4xl md:text-6xl font-bold tracking-tight text-on-surface`).
- High-intent value proposition copy in `Plus Jakarta Sans`.
- Floating Instant VIN / Valuation Appraisal Input Card (`bg-surface-container-lowest border border-border-card shadow-ambient-warm rounded-xl`).
- Hero imagery / backdrop using `/hero-bg.jfif` or featured car showcase.
- **Micro-Section — As-Seen-On Media Ticker:**
  - Continuous marquee or horizontal press ribbon displaying logos from `public/brands-logo/` (`globe-and-mail-logo.webp`, `tronto-star-logo.webp`, `auto-remarketing-logo.png`, `news-radio-logo.png`, `yahoo.png`).

### 06-C What is AutoNexa (`WhatIsAutoNexa.tsx`)
**UI:**
- Narrative editorial spread explaining the 24h dealer bidding disruption vs. lowball trade-ins.
- Key statistical highlights (e.g., "$2,800+ average savings", "100% verified Canadian dealers", "24h turnaround").
- Tonal background shift to `bg-surface-container-low` (`#FEF2E1`) with subtle border framing.

### 06-D Discover Inventory & Makes (`DiscoverSection.tsx`)
**UI:**
- Category tabs (All, SUVs, Sedans, Trucks, Electric, Luxury).
- Vehicle Make brand emblem ribbon using `public/car-company-logos/` (logos 09 through 16).
- Curated car showcase grid with cards from `public/showcase-cars-with-bg/` and `public/plain-cars-images/`.
- Interactive card preview with mock specifications (Year, Make, Model, Mileage, Provincial Location).

### 06-E How It Works (`HowItWorks.tsx`)
**UI:**
- 3-step numbered journey using illustrations from `public/illustrations/`:
  1. **Instant Valuation & Upload:** `get-estimate.jpg` — enter VIN, mileage, and photos.
  2. **24h Sealed Dealer Bidding:** `start-bid.png` — licensed dealers compete simultaneously.
  3. **Guaranteed Payment:** `get-paid.jpg` — select the winning bid, meet at the dealership, get paid.
- Step cards with warm editorial borders and subtle hover lift.

### 06-F Features & Canadian Guarantees (`FeaturesSection.tsx`)
**UI:**
- 4-column feature matrix highlighting platform guarantees:
  - **Zero Haggling:** Direct wholesale dealer pricing.
  - **Sealed Bid Secrecy:** Dealers bid blind without snipe wars.
  - **Provincial Compliance:** Official OMVIC, AMVIC, and VSA licensed dealer badges.
  - **Direct S3 Privacy:** Vehicle photos stripped of EXIF coordinates.
- Warm ambient card styling with soft amber accents.

### 06-G Testimonials & Social Proof (`TestimonialsSection.tsx`)
**UI:**
- Customer and dealer review cards with 5-star rating indicators.
- Real user avatars from `public/illustrations/` (`avatar-1.avif`, `avatar-2.avif`, `avatar-3.avif`).
- Verified Canadian city stamps (Toronto ON, Calgary AB, Vancouver BC, Montreal QC).

### 06-H FAQs Accordion (`FaqSection.tsx`)
**UI:**
- Interactive smooth-expanding accordion component.
- High-intent Q&A addressing seller fees (free for sellers), dealer licensing requirements, 24h auction rules, and vehicle inspection protocol.

### 06-I Final Conversion CTA Banner (`CtaBanner.tsx`)
**UI:**
- High-energy conversion section prior to the footer.
- Warm honey amber (`bg-secondary`) or deep terracotta wine container with subtle texture overlay (`public/textures/marble-texture-3-1.jpg`).
- Primary call to action button ("Start Your Free Valuation") triggering the VIN appraisal modal/input.

### 06-J Footer (`Footer.tsx`)
**UI:**
- AutoNexa logo and brand positioning statement.
- Links to portals (Seller Portal, Dealer Terminal, Dealership Registration).
- Canadian Regulatory and Compliance badges (OMVIC, AMVIC, VSA).
- Bilingual language switcher placeholder (`EN` / `FR`) and legal copyright.

### 07 Legal Pages
**UI:**
- `/legal/privacy` (PIPEDA compliant) and `/legal/terms` static editorial text pages.
**Logic:**
- Rendered in both EN/FR to satisfy Quebec Law 25 and Canadian privacy standards.

---

## Phase 3 — Seller Portal (Mobile-First / Light Mode)

### 08 Seller Dashboard UI & KYC Gate
**UI:**
- Active listing summary cards.
- Banner requiring Identity Verification if KYC is incomplete.
**Logic:**
- Mock KYC flow (Trulioo/Persona stub). Block access to `/list-car` if unverified.

### 09 Listing Wizard: VIN Auto-decode
**UI:**
- Step 1: 17-character VIN input with format masking.
**Logic:**
- Wire to `decodeVinClient()` (NHTSA VPIC API). Save decoded Make/Model/Year to `useListingWizardStore`.

### 10 Listing Wizard: Details & Specs
**UI:**
- Step 2: Form for Mileage (km), Transmission, Engine, and Title History.
**Logic:**
- Controlled inputs via React Hook Form. Save to Zustand store.

### 11 Listing Wizard: Interactive Damage Hotspot Mapper
**UI:**
- Step 3: Interactive SVG vehicle schematic (Top/Side/Front/Rear views).
- Tap zones to mark severity (Minor/Moderate/Severe) and add descriptions.
**Logic:**
- Array of `DamageHotspot` objects maintained in Zustand store.

### 12 Listing Wizard: Direct-to-S3 Image Upload
**UI:**
- Step 4: Multi-image uploader (8-30 photos). Grid preview with drag-to-reorder.
**Logic:**
- Use `browser-image-compression` to downscale to 1920px and strip EXIF (Privacy).
- Fetch presigned URLs from API -> Execute parallel PUT requests to AWS S3. Store resulting keys in Zustand.

### 13 Listing Wizard: Price Review & Submission
**UI:**
- Step 5: Asking Price input (formatted CAD). Legal declaration checkbox.
**Logic:**
- Validate CAD input, transform to integer cents via Zod.
- Submit massive unified payload (VIN, specs, damage, S3 keys, cents) to backend API.
- Clear Zustand store on success.

---

## Phase 4 — Dealer Terminal (Desktop / Dark Mode)

### 14 Dealer Dashboard & Subscription Gate
**UI:**
- High-density dark mode dashboard.
- Subscription status banner (Basic/Pro/Enterprise).
**Logic:**
- Fetch Stripe subscription status. Block bidding if `PAST_DUE` or quota exceeded.

### 15 Live Inventory Feed
**UI:**
- Tabular matrix / Card grid of `ACTIVE` listings within the dealer's radius.
- Visual countdown timers on each card.
**Logic:**
- Wire to TanStack Query (`useAuctions`). Implement radius filtering state.

### 16 Vehicle Detail View
**UI:**
- Comprehensive inspection pane: Carfax summary, mapped damage hotspots, full S3 photo gallery.
- Sealed bid submission slip (sidebar or modal).

---

## Phase 5 — The Bidding Engine (Real-Time)

### 17 Server-Synced 24h Countdown Timer
**UI:**
- Monospaced digital clock (`23:59:42`).
- Sub-15-minute urgency state (shifts to Canadian Crimson `#e63946`).
**Logic:**
- Hook up `useAuctionSSE`. Calculate countdown based strictly on `serverTime` vs `auctionEndsAt`. Never use `Date.now()`.

### 18 Dealer UI: Sealed Bid Submission
**UI:**
- Input for CAD amount. Quick-increment chips (+$250, +$500).
- "Submit Binding Bid" button with loading state.
**Logic:**
- Zod validates integer cents.
- TanStack `useMutation` to submit. Must enforce "Upward Revision Only" (new bid > previous bid).

### 19 Seller UI: Live Bid Count Telemetry
**UI:**
- High-visibility counter on the Seller Dashboard: "X Bids Received".
**Logic:**
- Stream count from `useAuctionSSE`. 
- **CRITICAL:** Ensure the UI physically cannot render bid amounts or dealer names while the auction is `ACTIVE`.

---

## Phase 6 — Resolution & Fulfillment

### 20 Seller UI: Post-Auction Unsealed Ledger
**UI:**
- Unsealed comparison table visible only after status shifts to `AUCTION_CLOSED`.
- Columns: Dealership Name, Distance (km), Bid Amount (CAD).
- Sort toggles: Highest Net Payout vs. Nearest Location.
**Logic:**
- Render "Accept Offer" button. Triggers mutation to transition status to `MATCHED`.

### 21 24h Acceptance Window Timer
**UI:**
- "Match Packet" view for both Seller and Dealer: Contact info, dealership address, and a new 24-hour countdown timer.
**Logic:**
- Standard SSE or polling timer for the physical visitation window.

### 22 Dealer UI: Offline Appointment Logger
**UI:**
- Disposition buttons on the matched vehicle view: `Complete Sale`, `Decline (Failed Inspection)`, `No-Show`.
**Logic:**
- Triggers final state mutations. If `Complete Sale`, captures final agreed CAD price.

---

## Phase 7 — Admin Backoffice

### 23 Listing Moderation Queue
**UI:**
- Table of `PENDING_REVIEW` vehicles. Approve/Reject buttons.
**Logic:**
- Approve mutation triggers the backend BullMQ job that starts the 24-hour auction.

### 24 Dealer License Verification
**UI:**
- Queue of pending dealership registrations with uploaded OMVIC/AMVIC/VSA credentials.
**Logic:**
- Approve toggle grants the `DEALER_ADMIN` role required to place bids.

---

## Feature Summary

| Phase | Description | Components / Deliverables |
| :--- | :--- | :--- |
| **Phase 1** | Foundation & Architecture | Scaffold, Autumn Editorial @theme tokens, next-intl, TanStack Query |
| **Phase 2** | AutoNexa Landing Page | Navbar, Hero + As-Seen-On Ticker, What is AutoNexa, Discover, How It Works, Features, Testimonials, FAQs, CTA Banner, Footer |
| **Phase 3** | Seller Portal (Mobile-First) | Dashboard, KYC Gate, 5-Step Listing Wizard (VIN, Specs, Damage, S3, Price) |
| **Phase 4** | Dealer Terminal (Dark Mode) | Dashboard, Subscription Gate, Radius Inventory Feed, Vehicle Detail View |
| **Phase 5** | Bidding Engine (Real-Time) | Synced 24h Countdown, Dealer Sealed Bid Slip, Seller Bid Telemetry |
| **Phase 6** | Resolution & Fulfillment | Unsealed Ledger, Acceptance Window, Offline Appointment Logger |
| **Phase 7** | Admin Backoffice | Moderation Queue, Dealer Licensing Table |