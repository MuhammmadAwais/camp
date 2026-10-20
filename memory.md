# Memory — AutoNexa End-to-End Portals, Role Authentication & Simplified Sidebar Navigation

Last updated: 2026-10-20 17:28:00

## What was built

1. **Role-Based Authentication & Demo Accounts (`lib/mock/seed.ts`, `lib/mock/db.ts`, `features/auth/services/authService.ts`):**
   - Configured standardized demo login credentials for all 3 platform roles:
     - **Seller:** `seller@autonexa.ca`
     - **Dealer:** `dealer@autonexa.ca`
     - **Admin:** `admin@autonexa.ca`
   - All accounts pre-seeded with verified status and standard password.
   - Connected form submission in `components/auth/LoginForm.tsx` to `login.mutateAsync`, session application, and automatic role routing via `getPostAuthRoute` without altering the Login page UI/UX.

2. **Streamlined, Simplified Sidebar Navigation (`components/layout/Sidebar.tsx`):**
   - Replaced verbose and spec-jargon names with clean, intuitive 1–2 word navigations across all roles:
     - **Seller:** `Dashboard` (Overview, Sell a Car), `Auctions` (Live Auction, Dealer Offers, Inspection Voucher), `Account` (ID Verification, Privacy, Terms).
     - **Dealer:** `Live Inventory` (Wholesale Floor, Vehicle Inspection), `My Bids` (Active Bids, Won Matches), `Dealership` (Subscription Plan, Invoices & Billing, Team Members), `Legal & Trust` (Dealer License, Terms, Privacy).
     - **Admin:** `Approvals` (Vehicle Queue, Dealer Licenses), `Marketplace` (Live Auctions, Disputes), `Analytics & Logs` (Market Analytics, Audit Trail).
   - Eliminated all dead/speculative links (404s) — mapped exclusively to the 26 live, operational routes.

3. **Default Full List View for First 2 Sidebar Sections (`components/layout/Sidebar.tsx`, `lib/store/useSidebarStore.ts`):**
   - The first 2 navigation sections for each role are automatically expanded into a full list view by default (`isDefaultOpen = sectionIdx < 2`), displaying all sub-items immediately on load.
   - Interactive chevron buttons still permit manual collapse and expansion on demand.

4. **Appearance & Theme Mode Relocation (`components/layout/Sidebar.tsx`, `components/layout/AppShell.tsx`):**
   - Relocated the segmented Light/Dark mode selector from the floating top-right viewport down into the sidebar footer, cleanly pinned directly above the profile divider bar (`UserProfileCard`).
   - In collapsed rail mode, the selector smoothly transitions into a compact circular toggle icon.

5. **Console & Hydration Guard Fixes (`app/layout.tsx`, `components/auth/AuthShell.tsx`, `components/auth/AuthVisualPanel.tsx`):**
   - Resolved Next.js `<Script>` error in `<head>` by using an inline `<script>` with `dangerouslySetInnerHTML`.
   - Added `suppressHydrationWarning` on outer containers to prevent React hydration mismatch errors caused by browser extensions injecting DOM attributes (`bis_skin_checked`, `data-ai-detector-processed`).
   - Updated `components/layout/AppShell.tsx` to use `overflow-x-clip`, preventing horizontal layout blowout on mobile screens while preserving vertical sticky headers.

## Decisions made

- **Role Routing Invariant:** All post-auth destinations are managed by `getPostAuthRoute(user, next)`, routing Sellers to `/seller/dashboard`, Dealers to `/dealer/inventory`, and Admins to `/admin/moderation`.
- **Default Open List View:** The first 2 primary sections in the sidebar remain expanded by default so primary workflows (selling, bidding, approvals) are instantly accessible without requiring accordion exploration.
- **Strict Integer CAD Cents:** Monetary figures across all platforms (inventory, bids, GMV, settlements) are strictly processed as integer cents.
- **Sealed Bid Secrecy:** Real-time bid amounts remain strictly sealed until auction closure; only bid count telemetry is exposed to sellers and competing dealers.

## Problems solved

- **Login Bypassed Mutation:** Fixed `LoginForm.tsx` where an exploratory `handleSignIn` stub bypassed React Hook Form and TanStack mutations.
- **Empty Sidebar Blank Screen:** Fixed `Sidebar.tsx` where a hardcoded section filter array (`['PORTAL', 'TRANSACTIONS', ...]`) had filtered out all role-specific navigation groups. Replaced with dynamic unique section extraction (`Array.from(new Set(NAV_ITEMS.map(...)))`).
- **Dev Hot-Reload Seed Loss:** Added auto-synchronization in `lib/mock/db.ts` (`getOrCreateDb`) so demo credentials persist reliably across hot reloads.
- **Hydration Mismatches:** Protected SSR markup against third-party extension mutations (`bis_skin_checked="1"`).

## Current state

- All 26 platform routes passing HTTP 200 OK.
- TypeScript compiler passes with 0 errors (`npx tsc --noEmit` exit code 0).
- Login form functions for all 3 demo roles.
- Sidebar reflects clean, simple titles with the first 2 sections open in full list view.
- Theme toggle lives above the profile card in the sidebar.

## Next session starts with

- Expand interactive mock data scenarios or integrate production backend API endpoints with TanStack Query hooks.
- Validate end-to-end multi-role auction flow in live browser: Seller lists car &rarr; Admin approves &rarr; Dealer places sealed bid &rarr; Auction closes &rarr; Seller accepts &rarr; Inspection voucher generated.

## Open questions

- None. Architecture, RBAC matrix, design tokens, and routing are locked and functional.
