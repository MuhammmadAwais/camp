# UI Tokens: Car Auction Marketplace Platform (CAMP)

Design tokens engineered for a high-velocity Canadian wholesale vehicle exchange. 
Use these exact values throughout the codebase. Never hardcode hex values or use raw Tailwind color classes (e.g., `bg-blue-500`) in components.

---

## How to Use (Tailwind CSS v4)

All design tokens are defined using the `@theme` directive in `app/globals.css`. 
Tailwind v4 automatically generates utility classes from these variables:
- `--color-brand-primary` → `bg-brand-primary`, `text-brand-primary`, `border-brand-primary`
- `--font-mono` → `font-mono`

```tsx
// Correct — uses generated utility classes
className="bg-surface-light text-text-main border-border-hairline font-mono"

// Never — hardcoded hex values or generic Tailwind classes
className="bg-[#FAFBFC] text-gray-800 font-sans"
```

---

## globals.css — Complete Token Definition

```css
@import "tailwindcss";

@theme {
  /* Fonts */
  --font-display: "Plus Jakarta Sans", sans-serif;
  --font-body: "Inter", sans-serif;
  --font-mono: "JetBrains Mono", monospace;

  /* Surfaces & Canvas */
  --color-canvas-light: #FAFBFC; /* Porcelain: Light mode seller app */
  --color-canvas-dark: #080C14;  /* Obsidian: Dark mode dealer trading floor */
  --color-surface-light: #FFFFFF;
  --color-surface-dark: #111827;
  --color-track-light: #F1F5F9;  /* Icy Silver: Utility tracks & containers */
  --color-track-dark: #1E293B;   /* Carbon Slate */

  /* Borders */
  --color-border-hairline: #E2E8F0;
  --color-border-dark: #1E293B;

  /* Core Brand Colors */
  --color-brand-primary: #0B2545;       /* Deep Cobalt Navy: Institutional authority */
  --color-brand-electric: #3B82F6;      /* Electric Cobalt: Dark mode focus/accent */
  --color-brand-crimson: #E63946;       /* Canadian Crimson: Sub-15m countdown urgency */
  --color-brand-neon-crimson: #FF4D4D;  /* Dark mode urgency pulse */
  --color-brand-mint: #10B981;          /* Confirmation, Success, Verification */

  /* Text & Typography */
  --color-text-main: #0F172A;
  --color-text-muted: #64748B;
  --color-text-dark-main: #F8FAFC;
  --color-text-dark-muted: #94A3B8;

  /* Canadian Regulatory Badges */
  --color-badge-omvic: #3B82F6; /* Ontario */
  --color-badge-amvic: #64748B; /* Alberta */
  --color-badge-vsa: #10B981;   /* British Columbia */

  /* Border Radius (Strict Level 1 Soft) */
  --radius-xs: 2px;
  --radius-sm: 4px;   /* Interactive controls, fields, chips */
  --radius-md: 8px;   /* Auction lane cards, containers */
  --radius-lg: 12px;  /* Modals, drawers */
  --radius-full: 9999px; /* Status rings, pulse dots */
}
```

---

## Color & Surface Usage Guide

The platform uses a strict **Dual-Mode Architecture**:
- **Light Mode (Seller Portal):** Porcelain canvas (`#FAFBFC`) with white cards and Deep Cobalt Navy accents.
- **Dark Mode (Dealer Terminal):** Obsidian canvas (`#080C14`) with carbon slate cards and Electric Cobalt luminous accents.

| Element | Light Mode Token | Dark Mode Token |
| :--- | :--- | :--- |
| Page Canvas | `bg-canvas-light` | `bg-canvas-dark` |
| Cards & Modules | `bg-surface-light` | `bg-surface-dark` |
| Inputs & Utility Tracks | `bg-track-light` | `bg-track-dark` |
| Primary Action Button | `bg-brand-primary text-white` | `bg-brand-electric text-white` |
| Urgent Action (Buyout) | `bg-brand-crimson text-white` | `bg-brand-neon-crimson text-white` |
| 1px Grid Borders | `border-border-hairline` | `border-border-dark` |
| Primary Text | `text-text-main` | `text-text-dark-main` |
| Muted/Secondary Text | `text-text-muted` | `text-text-dark-muted` |

---

## Typography Hierarchy

We use three highly specialized fonts to separate brand stature, narrative density, and live telemetry data.

| Font Engine | Tailwind Class | Usage Rules |
| :--- | :--- | :--- |
| Plus Jakarta Sans | `font-display` | Primary headings, Vehicle Year/Make/Model, Dealer Lane Headers. Conveys trust and precision. |
| Inter | `font-body` | Condition reports, legal disclaimers, forms, checklists. Used for all high-density textual reading. |
| JetBrains Mono | `font-mono` | **CRITICAL: Real-time data only.** 24h countdown tickers (`23:59:42`), 17-character VINs, CAD Currency (`$42,850`), Bid Counts. Prevents layout jitter when digits change. |

---

## Component Elevation (Shadows & Glows)

Never use diffuse consumer drop shadows. Depth is established through 1px hairlines and calibrated luminosity.

| Tier | Light Mode | Dark Mode | Usage |
| :--- | :--- | :--- | :--- |
| Layer 1 | None (Use `border-border-hairline`) | None (Use `border-border-dark`) | Standard Auction Cards |
| Layer 2 (Hover) | `shadow-[0_4px_16px_-2px_rgba(11,37,69,0.08)] ring-1 ring-brand-primary` | `shadow-[0_4px_20px_-2px_rgba(0,0,0,0.8)] ring-1 ring-brand-electric` | Active/Hovered Auction Lanes |
| Urgency Glow | `shadow-[0_0_16px_0_rgba(230,57,70,0.25)] ring-1 ring-brand-crimson` | `shadow-[0_0_16px_0_rgba(255,77,77,0.25)] ring-1 ring-brand-neon-crimson` | Sub-15m Final Countdown Window |

---

## Core Component Specifications

### 1. Primary Bidding Triggers & Buttons
- **Shape:** `rounded-sm` (4px).
- **Typography:** `font-mono text-sm font-bold`.
- **Quick-Bid Chips:** Transparent background, 1px solid hairline border, hover shifts to solid primary brand color.

### 2. Live 24h Countdown Clock
- **Container:** `bg-track-light` (light) or `bg-track-dark` (dark), `rounded-sm`, `px-2 py-1`.
- **Readout:** Fixed-width `font-mono`.
- **Urgency State:** When the countdown hits `< 15:00`, the foreground text shifts to `text-brand-crimson` (light) or `text-brand-neon-crimson` (dark) and triggers the Urgency Glow (Layer 2).

### 3. Sealed Bid Telemetry Bar
- **CRITICAL INVARIANT:** This is a sealed-bid auction. The telemetry bar must **NEVER** display "Current High Bid" or "Live Spread Ladders".
- **Seller View:** Displays Time Remaining and Total Bids Placed (e.g., `14 BIDS`).
- **Dealer View:** Displays Time Remaining, Total Bids Placed, and Your Current Bid (if placed).

### 4. Regulatory Compliance Badges
Used to verify dealer licenses and reassure private sellers.
- **Shape:** `rounded-sm`, `px-2 py-0.5`.
- **Typography:** `font-mono text-xs font-semibold`.
- **OMVIC (Ontario):** `border border-badge-omvic text-badge-omvic`
- **AMVIC (Alberta):** `border border-badge-amvic text-badge-amvic`
- **VSA (BC):** `border border-badge-vsa text-badge-vsa`

### 5. CAD Currency Inputs
- **Prefix:** Permanent `CAD $` locked in `font-mono text-sm text-text-muted` positioned absolute left.
- **Field:** `font-mono` to allow instant manual audit against physical records.
- **Focus:** Sharp `ring-1 ring-brand-electric` (no outline/pixel jump).
