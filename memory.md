# Memory — AutoNexa Web App Polish, Extension Hydration Guard & Dashboard RBAC Blueprint

Last updated: 2026-10-16 15:06:00

## What was built

1. **Dual Route-Aware Scrollbars (`app/globals.css`, `components/layout/AppShell.tsx`):**
   - Public landing page (`/`) preserves Autumn Editorial Terracotta Wine thumb (`#8C383E`) with cream track (`#F8ECDB`).
   - Portals and auth views (`/seller/*`, `/dealer/*`, `/admin/*`, `/login`, etc.) use theme-adaptive Nordic Pine Teal thumb (`#008C87`) with light/dark glass track styling.
   - Dynamically toggled in `AppShell.tsx` via `data-app-theme="webapp"` vs `data-app-theme="landing"`.

2. **In-Rail Sidebar Navigation Toggle (`components/layout/Sidebar.tsx`):**
   - Removed external protruding arrow button (`absolute -right-3`).
   - Integrated a clean double-bar toggle (`=`) centered inside the 72px rail stream above the Home icon.
   - Preserved user's removal of collapsed-mode section dividers.

3. **Refined Theme Mode Toggle (`components/theme/ThemeToggle.tsx`):**
   - Removed distracting pulsing teal indicator dot.
   - Restyled segmented control into a refined pill with subtle borders (`border-white/[0.08]` in dark mode, `border-gray-200` in light mode), crisp typography, and smooth micro-press transitions.

4. **Marketing Funnel & Auth Polish:**
   - Removed mobile visual banner container from `components/auth/AuthShell.tsx` to surface input fields above the fold.
   - Redirected `/sell` to `/login` in `app/(auth)/sell/page.tsx` and updated landing page valuation CTAs.
   - Fixed `ComparisonMatrix.tsx` highlight card overlap that previously cut through the bottom CTA button.

5. **React 19 & Next.js 16 Pre-Hydration Extension Guard (`app/layout.tsx`):**
   - Replaced raw `<script>` tag with `<Script id="autonexa-theme-init" strategy="beforeInteractive">`.
   - Added pre-hydration guard intercepting `Element.prototype.setAttribute` for browser extension-injected attributes (`bis_skin_checked`, `bis_register`), eliminating React 19 hydration mismatch errors caused by extensions like Bitdefender TrafficLight.

6. **Dashboard & RBAC Blueprint:**
   - Formulated senior-engineered blueprint for multi-tenant portal architecture (Seller Portal, Dealer Terminal, Admin Moderation Desk).

## Decisions made

- **Explicit Route Prefix Segmentation:** Standardize routes under role prefixes (`/seller/dashboard`, `/dealer/inventory`, `/admin/moderation`) rather than unqualified `/dashboard`, turning `/dashboard` into an automatic role-based redirect router.
- **Multi-Tier Defense-in-Depth RBAC:** Combine Edge proxy (`proxy.ts`), layout role guards (`<RequireRole />`), and UI role-adaptive navigation in `Sidebar.tsx`.
- **Sealed Bid Invariant:** The UI strictly hides bid CAD amounts from sellers and competing dealers while an auction is `ACTIVE`, displaying only real-time `current_bid_count`.
- **Integer CAD Cents:** All financial values throughout listings, bids, and dashboards are calculated, stored, and sent as whole integer cents.

## Problems solved

- **Next.js 16 / React 19 `<script>` Warning:** Switched theme init script to `next/script` with `strategy="beforeInteractive"`.
- **Bitdefender / Extension `bis_skin_checked` Hydration Error:** Fixed attribute mismatch by intercepting DOM attribute mutations in the pre-hydration layout script.
- **Comparison Table Highlight Card Overlap:** Scoped the AutoNexa highlight card within the table wrapper, preventing it from clipping the bottom CTA button.
- **Sidebar Rail Layout Collision:** Embedded the toggle button directly inside the rail stream to eliminate viewport overlap.

## Current state

- Landing page and auth flows fully responsive and polished.
- Development server running with zero TypeScript errors (`npx tsc --noEmit` exit code 0).
- Blueprint for Dashboard & RBAC suite agreed upon and ready for execution.

## Next session starts with

1. **Execute Phase 1 of Dashboard & RBAC:**
   - Update `lib/auth-routing.ts` with role-to-route maps and permission matrices.
   - Implement `components/auth/RequireRole.tsx` client role guard.
   - Scaffold route directories:
     - `app/(seller)/seller/dashboard/page.tsx`
     - `app/(dealer)/dealer/inventory/page.tsx`
     - `app/(admin)/admin/moderation/page.tsx`
   - Transform `app/(seller)/dashboard/page.tsx` into a smart role router.
   - Update `proxy.ts` Edge middleware matcher to guard `/seller/:path*`, `/dealer/:path*`, and `/admin/:path*`.
2. **Execute Phase 2 (Seller Portal Dashboard):**
   - Upgrade `SellerDashboard.tsx` with active vehicle cards, sealed-bid count telemetry, and direct link to the 5-step Listing Wizard.

## Open questions

- None. Architecture, tokens, and build steps are locked.
