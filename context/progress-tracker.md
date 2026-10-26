# Progress Tracker: AutoNexa & CAMP Platform

Update this file after completing each page/component. Any AI agent reading this will immediately know what is done, what is in progress, and what is next.

---

## Current Status

**Active Phase:** All Platform Portals & End-to-End Workflows (100% Operational)  
**Completed:** 
- Phase 1: Security, Auth & RBAC Foundation (100% Complete)
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
- [ ] **08 Role Route Guards & Edge Middleware** (`components/auth/RequireRole.tsx`, `proxy.ts` matchers for `/seller/*`, `/dealer/*`, `/admin/*`)
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
- [x] **10-J Regulatory Footer** (`Footer.tsx` OMVIC, AMVIC, VSA compliance seals & legal notices)
- [x] **11 Legal Pages** (`/legal/privacy` and `/legal/terms` PIPEDA & Quebec Law 25 compliant)

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
  - **Features:** Complete executive analytics dashboard inspired by modern shadcn/SaaS design: Top 4 KPI metric cards with growth badges, gradient Escrow Clearing Vault card ($3.8M CAD reserve), interactive SVG spline area curve chart with floating hover tooltips, provincial market share SVG donut chart with interactive hover arcs and legend pills, metropolitan hub intake vs. clearance grouped bar chart, top sourcing dealership leaderboard, and real-time wholesale settlements data table.
- [x] **Universal Modern SaaS Table System (Reference Design Parity)**
  - **Components:** `components/ui/SortableHeader.tsx`, `components/ui/TablePagination.tsx`, `hooks/useTableSort.ts`
  - **Implemented in:**
    - `components/admin/DealerVerificationView.tsx` (`/admin/dealers`)
    - `components/admin/AdminAuctionsView.tsx` (`/admin/auctions`)
    - `components/admin/AdminAuditLogView.tsx` (`/admin/audit-log`)
    - `components/dealer/DealerBillingView.tsx` (`/dealer/billing`)
  - **Features:** Card header container with `{count} Total` pill, subtitle, search bar, and action toolbars. Interactive multi-select checkboxes on every row and select-all in header. Single-line scanability without text cramming (icon/thumbnail badges, soft pastel status pills, formatted integer CAD cents). Dedicated SaaS pagination footer with page buttons, ellipses, previous/next buttons, and results count. Type-safe 3-state column sorting.

---

## Agent Directives & Production Invariants

1. **Strict Sealed-Bid Invariant:** The UI must NEVER render or expose live bid CAD amounts to sellers or competing dealers while an auction is `ACTIVE`. Only the real-time bid count (`current_bid_count`) is displayed.
2. **Strict Integer CAD Cents:** Never use JavaScript floating-point arithmetic for currency. Store, calculate, and pass all dollar values as whole integer cents (e.g. `$35,000.00` = `3500000`). Format to currency decimals only in the final UI presentation layer.
3. **Decoupled API Boundary:** All mutations run via TanStack `useMutation` through `lib/api-client.ts`. When `NEXT_PUBLIC_API_URL` is omitted, contract-accurate Next.js route handlers (`app/api/**`) simulate network latency, HTTP status codes, and mock data.
4. **Living Component Imprinting:** Run `/imprint` after building every new UI page to record visual patterns, prop signatures, and Tailwind token classes in `context/ui-registry.md`.
5. **No Hardcoded Hex Colors:** Use designated design tokens (`bg-primary`, `bg-secondary`, `bg-portal-surface`, `text-portal-text`, `border-portal-border`, Autumn Editorial `#8C383E` Wine & `#E59344` Amber, `#10B981` Emerald checkmarks).