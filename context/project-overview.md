# **Project Overview**

# **About the Project**

Car Auction Marketplace Platform (CAMP) is a Canadian reverse-auction vehicle marketplace connecting KYC-verified private car owners with licensed, subscribed automotive dealerships. Private sellers list their vehicles through a mobile-first appraisal workflow featuring automated VIN decoding, client-compressed photo uploads, and an interactive damage schematic. Once approved by administrators, listings enter a rigid 24-hour sealed-bid auction window where regional dealerships place blind, upward-revisable bids.

&nbsp;

When the 24-hour window expires, all bids unseal for the seller. The seller chooses their preferred dealer (by highest price or closest proximity), initiating an exact 24-hour acceptance window to physically visit the dealership, conduct an on-site condition verification, and conclude the vehicle transaction offline.

# **The Problem It Solves**

Private vehicle sales in Canada are plagued by security risks, unreliable buyers, lowball trade-in valuations, and fragmented negotiations. Dealerships struggle with acquiring profitable consumer pre-owned inventory directly without auction house premiums.

&nbsp;

CAMP eliminates these friction points:

&nbsp;

* Sellers obtain genuine institutional wholesale competition for their vehicle within 24 hours without exposing their phone numbers or home addresses to the public.  
* Dealerships access a steady feed of local, pre-screened private vehicles with verifiable damage declarations, directly acquiring inventory without physical auction overhead.

# **Canadian Regulatory & Legal Context**

The application operates within Canadian jurisdiction and enforces strict regulatory compliance:

&nbsp;

* **PIPEDA Compliance:** Strict personal data handling, mandatory user consent, data residency in AWS `ca-central-1` (Central Canada), and automated EXIF stripping from uploaded photos to prevent location leakage.  
* **Quebec Law 25 & Language Parity:** Complete bilingual English/French parity across all public pages, listing flows, legal disclaimers, and notifications. Localized routing (`/en/...`, `/fr/...`) handled natively via `next-intl`.  
* **Provincial Dealer Licensing:** Dealerships must be verified against provincial regulatory bodies prior to active bidding: OMVIC (Ontario), AMVIC (Alberta), and VSA (British Columbia).  
* **CASL Compliance:** Explicit opt-in consent and one-click unsubscribe headers for all commercial electronic communications (SendGrid transactional emails, Twilio SMS, and Firebase Web Push).

# **User Classes & RBAC Matrix**

The system enforces three distinct actor classes:

&nbsp;

| Role | Access Scope | Usage Pattern | Key Capabilities |
| :---- | :---- | :---- | :---- |
| **End User (Seller)** | Public pages, Seller Portal (/(seller)) | Occasional (single active listing) | Identity KYC verification, listing creation with VIN decode, photo uploads, damage mapping, live bid count tracking, dealer selection. |
| **Dealership (`DEALER_ADMIN`)** | Dealer Portal (/(dealer)) | High-frequency daily trading floor | Manage Stripe subscription, staff accounts (`DEALER_AGENT`), regional radius filters, place/revise sealed bids, log offline transaction outcomes. |
| **Dealership (`DEALER_AGENT`)** | Dealer Portal (/(dealer)) | High-frequency daily trading floor | Filter inventory feed, review vehicle condition reports, place and revise sealed bids. No billing or staff management access. |
| **Administrator** | Admin Backoffice (/(admin)) | Daily operational oversight | Listing moderation queue, dealer license validation, manual auction overrides, dispute handling, platform metrics. |

# **Pages & Routing Architecture (Next.js App Router)**

The project uses route groups to isolate layouts, security middleware, and styling modes:app/

&nbsp;

├── \[locale\]/                                   → Bilingual wrapper (en / fr)

&nbsp;

│   ├── (marketing)/                            → Light mode public funnel

&nbsp;

│   │   ├── page.tsx                            → High-converting landing page \+ VIN Hero

&nbsp;

│   │   ├── how-it-works/page.tsx               → Process transparency for sellers & dealers

&nbsp;

│   │   ├── for-dealers/page.tsx                → Dealer subscription tiers & onboarding pitch

&nbsp;

│   │   ├── privacy/page.tsx                    → PIPEDA & Quebec Law 25 compliance notice

&nbsp;

│   │   └── terms/page.tsx                      → Platform terms of service

&nbsp;

│   ├── (auth)/

&nbsp;

│   │   ├── login/page.tsx                      → Unified login (JWT email/password)

&nbsp;

│   │   ├── register/page.tsx                   → Seller account registration

&nbsp;

│   │   ├── dealer-register/page.tsx            → Dealership onboarding & license intake

&nbsp;

│   │   └── verify-kyc/page.tsx                 → Automated KYC flow (Trulioo/Persona)

&nbsp;

│   ├── (seller)/                               → Mobile-first light mode UI (\#FAFBFC)

&nbsp;

│   │   ├── dashboard/page.tsx                  → Active listing cards & bid counter telemetry

&nbsp;

│   │   ├── list-car/

&nbsp;

│   │   │   ├── step-1-vin/page.tsx             → VIN decode & core vehicle specs

&nbsp;

│   │   │   ├── step-2-details/page.tsx         → Mileage, trim, transmission, options

&nbsp;

│   │   │   ├── step-3-condition/page.tsx       → Interactive 2D vehicle damage mapper

&nbsp;

│   │   │   ├── step-4-media/page.tsx           → 8–30 photo direct S3 uploader

&nbsp;

│   │   │   └── step-5-review/page.tsx          → Asking price declaration & submission

&nbsp;

│   │   ├── listings/\[id\]/page.tsx              → Live auction status & countdown clock

&nbsp;

│   │   └── listings/\[id\]/select-dealer/page.tsx→ Post-auction dealer selection portal

&nbsp;

│   ├── (dealer)/                               → High-density dark mode trading UI (\#080C14)

&nbsp;

│   │   ├── inventory/page.tsx                  → Multi-lane live auction feed with radius filter

&nbsp;

│   │   ├── auctions/\[id\]/page.tsx              → Vehicle inspection sheet \+ sealed bid slip

&nbsp;

│   │   ├── active-bids/page.tsx                → Managed active bids & revision history

&nbsp;

│   │   ├── won-matches/page.tsx                → Appointments, directions & sale logger

&nbsp;

│   │   └── settings/

&nbsp;

│   │       ├── billing/page.tsx                → Stripe customer portal (DEALER\_ADMIN)

&nbsp;

│   │       └── team/page.tsx                   → Staff agent management (DEALER\_ADMIN)

&nbsp;

│   └── (admin)/                                → Clean backoffice operational console

&nbsp;

│       ├── moderation/page.tsx                 → Pending vehicle listing approval queue

&nbsp;

│       ├── dealers/page.tsx                    → Provincial license verification portal

&nbsp;

│       ├── disputes/page.tsx                   → Inspection discrepancy resolution desk

&nbsp;

│       └── metrics/page.tsx                    → Auction throughput & subscription revenue

# **Navigation**

Context-aware header navigation tailored per user role:

&nbsp;

* **Sellers:** Clean light-mode header with Dashboard, Create Listing, and Profile controls.  
* **Dealers:** High-density dark-mode trading navbar with Live Inventory, Active Bids, Won Matches, and Portal Settings.  
* **Admins:** Operational backoffice bar with Moderation Queue, Dealer Approvals, and System Telemetry.

# **Core User Flows**

## **1\. Seller Listing Creation Flow**

1. Seller registers, verifies email/phone via Twilio OTP, and completes automated identity KYC.  
2. Inputs 17-character VIN; frontend hits NHTSA VPIC API to auto-fill Year, Make, Model, Body Class, and Engine specs.  
3. Seller confirms details, enters exact odometer reading (in km), and declares vehicle ownership status.  
4. Seller uses the interactive 2D damage mapper to plot damage pins on vehicle panels (Front, Rear, Sides, Glass, Interior), selecting severity (`Minor`, `Moderate`, `Severe`) and uploading damage-specific close-up photos.  
5. Seller selects 8 to 30 vehicle photos. The browser strips EXIF metadata, compresses images to 1920x1080 WebP, requests batch presigned URLs from the API, and `PUT`s files directly to AWS S3 (`ca-central-1`).  
6. Seller sets an asking price (CAD), reviews the submission, and submits. Listing status transitions to `PENDING_REVIEW`.

## **2\. Admin Moderation & Auction Launch**

1. Admin reviews photos, declared condition, and VIN record in the admin queue.  
2. Admin approves the listing. Backend sets `status = 'ACTIVE'`, computes `auction_ends_at = NOW() + 24 HOURS`, and dispatches BullMQ background jobs.  
3. Push notifications (FCM) and transactional emails (SendGrid) trigger instantly to all active, verified dealerships within the listing's operational radius.

## **3\. The 24-Hour Sealed Bidding Window**

1. Dealerships view vehicle specifications, Carfax links, and damage schematics on their trading screen.  
2. Bids are strictly **sealed**:  
   * Competing dealerships cannot view other dealers' bid values or identities.  
   * The seller sees the **total count of bids received** (e.g., *"8 Offers Received"*), but dollar figures and dealership names remain completely obscured.  
3. Dealerships can submit and revise bids, but **revisions must be equal to or greater than their previous bid** (upward-only revisions).  
4. The client timer is strictly synchronized to the server's `auction_ends_at` timestamp using monospace rendering with sub-15-minute urgency states.

## **4\. Auction Close & Dealer Selection**

1. At exactly T+24 hours, the BullMQ scheduled worker transitions the listing to `PENDING_SELECTION`.  
2. Bids unseal exclusively for the seller. The seller views an unsealed breakdown showing:  
   * Dealer Bid Amount (CAD)  
   * Dealership Name & Verification Badge (OMVIC / AMVIC / VSA)  
   * Distance from Seller's location (km)  
   * Dealership Google / Platform Rating  
3. The seller selects their winning dealership (e.g., highest price or nearest location).  
4. Selection locks the listing to `MATCHED` and starts an exact 24-hour **Acceptance Window**.

## **5\. In-Person Acceptance & Offline Deal Logging**

1. The selected dealership and seller receive matching confirmation sheets containing contact details, address, and an authorization QR code/PIN.  
2. The seller physically presents the vehicle at the dealership within 24 hours.  
3. The dealer conducts an on-site physical appraisal to verify the car matches the declared online condition.  
4. Dealership staff records the appointment outcome in the dealer portal:  
   * `COMPLETED`: Final sale confirmed (dealer inputs actual sale price in CAD).  
   * `DECLINED_AFTER_INSPECTION`: Material undisclosed defect found (requires reason/photos).  
   * `NO_SHOW`: Seller failed to arrive within the 24-hour window.  
5. The platform logs the transaction outcome. **No vehicle transaction payments flow through the platform**.

# **Core Business & State Invariants**

Rules the AI agent, API routes, and frontend state machines must never violate:

&nbsp;

1. **Sealed-Bid Secrecy:** Bid amounts and bidder IDs are strictly redacted from seller API payloads during `status = 'ACTIVE'`. Only the integer `bidCount` may be returned. Competitor dealers never see each other's bids at any time.  
2. **Upward-Only Bidding:** A dealership cannot submit a revised bid lower than their existing active bid for that listing.  
3. **Immutable Timers:** The 24-hour auction window and 24-hour acceptance window are rigid. The frontend must compute remaining time from server timestamps, never relying on client device system clocks.  
4. **Zero Float Currency:** All monetary values are handled as integer cents in CAD (e.g., `$15,400.00` \= `1540000`). Floating-point math is strictly forbidden.  
5. **No Direct Vehicle Transactions:** The platform handles SaaS dealership subscription checkout via Stripe only. The platform must never provide payment fields, escrow accounts, or checkout workflows for vehicle purchase funds.  
6. **Direct Media Ingestion:** Images are never sent through the Node.js API server. The browser must upload directly to AWS S3 using presigned URLs.

# **Features In Scope (MVP v1.0)**

* High-converting marketing landing page with hero VIN lookup preview.  
* Bilingual UI (English & French) with zero-flicker routing (`next-intl`).  
* End user authentication & automated KYC identity verification (Trulioo/Persona).  
* 5-step vehicle listing wizard with NHTSA VPIC VIN auto-decode.  
* Interactive 2D SVG vehicle damage mapping with severity tags.  
* Client-side image compression (WebP) and direct-to-S3 presigned upload.  
* Dealership portal with live inventory feed, distance calculations, and sealed bidding slip.  
* Stripe subscription billing integration for dealerships (Basic, Pro, Enterprise tiers).  
* 24-hour synchronized auction countdown clocks with sub-15m urgency styling.  
* Seller dealer selection portal comparing price, distance, and provincial regulatory badges.  
* Offline appointment confirmation logging (`COMPLETED`, `DECLINED`, `NO_SHOW`).  
* Admin backoffice for listing moderation, dealer verification, and audit logs.  
* FCM Web Push, Twilio SMS, and SendGrid email notifications.

# **Features Out of Scope (Explicitly Deferred)**

* In-app vehicle checkout, escrow processing, or down payment handling.  
* Vehicle transport, logistics, flatbed booking, or shipping coordination.  
* Consumer financing calculators, loan pre-approvals, or trade-in calculators.  
* Consumer-to-consumer (P2P) bidding or direct private buyer messaging.  
* Native iOS/Android app stores (PWA installable with Web Push only for MVP).  
* Automated provincial dealer registry API scraping (manual document upload verified by Admin in MVP).

# **Success Criteria**

* **Performance:** Sub-second First Contentful Paint (\<1.0s) on landing and listing pages across mobile and desktop networks.  
* **Integrity:** Zero sealed-bid leaks in network payloads prior to auction closing.  
* **Listing Velocity:** A private seller can complete a listing submission with 15+ photos in under 4 minutes on mobile.  
* **Bilingual Parity:** 100% feature and legal parity between English and French views without missing translation keys.  
* **Design Consistency:** Strict adherence to design tokens across light and dark viewports.

&nbsp;