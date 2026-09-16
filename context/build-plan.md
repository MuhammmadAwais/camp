# Build Plan: Car Auction Marketplace Platform (CAMP)

## Core Principle

Full page UI built with mock data first — verified visually before any logic is written. Then functionality is wired to the UI step by step[cite: 19]. Every feature must be visible and testable before moving to the next[cite: 19]. No invisible backend phases[cite: 19].

---

## Phase 1 — Foundation & Architecture

### 01 Next.js 15 Scaffold & Route Groups
**Logic:**
- Initialize Next.js 15 App Router with TypeScript strict mode.
- Create localized routing structure using `next-intl` (`app/[locale]`).
- Scaffold role-based route groups: `(marketing)`, `(auth)`, `(seller)`, `(dealer)`, `(admin)`.

### 02 Tailwind v4 & Shadcn UI Tokens
**UI:**
- Inject the dual-mode design tokens (Porcelain Light for Sellers, Obsidian Dark for Dealers) into `app/globals.css` via `@theme`.
- Initialize base Shadcn UI components (Buttons, Inputs, Cards).

### 03 next-intl Bilingual Setup
**Logic:**
- Configure `next-intl` middleware to handle `/en` and `/fr` routing for Quebec Law 25 parity.
- Create `messages/en.json` and `messages/fr.json` dictionary files.

### 04 TanStack Query & Zustand Initialization
**Logic:**
- Set up `QueryClientProvider` in the root layout.
- Create `src/lib/query-keys.ts` for strictly typed cache keys.

### 05 JWT Auth Wrapper & Middleware
**Logic:**
- Implement Next.js Middleware to protect routes based on JWT `role` claims (`SELLER`, `DEALER_ADMIN`, `DEALER_AGENT`, `ADMIN`).
- Unauthenticated users attempting to access portals redirect to `/login`.

---

## Phase 2 — Marketing & Public Funnel

### 06 Landing Page
**UI:**
- Hero section with Headline, Trust Badges (OMVIC, AMVIC, VSA), and VIN input field.
- "How it Works" section detailing the 24h reverse-auction.
**Logic:**
- VIN input on the landing page pushes the user to `/register/seller` with the VIN preserved in the URL/Zustand store.

### 07 Legal Pages
**UI:**
- `/legal/privacy` and `/legal/terms` static text pages.
**Logic:**
- Must render cleanly in both EN/FR to satisfy PIPEDA and Quebec Law 25.

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

## Feature Count

| Phase | Features |
| :--- | :--- |
| Phase 1 — Foundation | 5 |
| Phase 2 — Marketing | 2 |
| Phase 3 — Seller Portal | 6 |
| Phase 4 — Dealer Terminal | 3 |
| Phase 5 — Bidding Engine | 3 |
| Phase 6 — Resolution | 3 |
| Phase 7 — Admin Backoffice | 2 |
| **Total** | **24** |