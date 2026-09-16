# UI Rules: Car Auction Marketplace Platform (CAMP)

Concise, strict rules for building the CAMP user interface. This platform marries institutional FinTech data density with high-stakes automotive auction telemetry. These rules prevent layout drift and ensure the dual-mode architecture (Seller Light Mode vs. Dealer Dark Mode) remains perfectly consistent.

---

## The Font Trinity

Always import and apply our three specific font engines via `next/font/google` in the root layout. Never use generic system fallbacks as primary fonts.

1. **Plus Jakarta Sans (`--font-display`):** Headings, Display text, Vehicle Titles.
2. **Inter (`--font-body`):** Paragraphs, Forms, Legal Text, Disclosures.
3. **JetBrains Mono (`--font-mono`):** Real-time data, Currency (CAD), Countdowns, VINs, Bid Counts.

```typescript
import { Plus_Jakarta_Sans, Inter, JetBrains_Mono } from 'next/font/google';

const display = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-display' });
const body = Inter({ subsets: ['latin'], variable: '--font-body' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });
```

Apply these variables to the `<html>` or `<body>` tag. Standard text defaults to `font-body`.

---

## Layout & Grid System

The UI adapts drastically based on the user's role and device:

- **Desktop (Dealers / >=1280px):** 12-column grid. Max-width expands to 1680px to accommodate side-by-side auction monitoring and wide data tables.
- **Tablet (768px - 1279px):** 8-column grid. Uses sliding contextual drawers for active bids/inspections.
- **Mobile (Sellers / <=767px):** 4-column compact flow. Edge-to-edge photo reels. Sticky bottom action bars for immediate listing actions.
- **Section Gaps:** Use `gap-6` (24px) for related modules, `gap-8` (32px) for major page sections.

---

## Surface Enclosures (Cards)

Never use diffuse consumer drop-shadows. Depth is established through 1px hairlines and background contrasts.

### Light Mode (Sellers):
- **Background:** `bg-surface-light`
- **Border:** `border border-border-hairline`
- **Border Radius:** `rounded-md` (8px)
- **Padding:** `p-4` or `p-6`

### Dark Mode (Dealers):
- **Background:** `bg-surface-dark`
- **Border:** `border border-border-dark`
- **Border Radius:** `rounded-md` (8px)
- **Padding:** `p-4` or `p-6`

---

## Interactive Elements

### Buttons
All buttons use strict geometric rounding (`rounded-sm` / 4px) and monospaced text to feel like precision instruments.

- **Primary:** `bg-brand-primary text-white rounded-sm px-4 py-2 font-mono text-sm font-bold` (Dark mode uses `bg-brand-electric`).
- **Urgent / Buyout:** `bg-brand-crimson text-white hover:bg-brand-neon-crimson`.
- **Bid Increment Chips:** `border border-border-hairline bg-transparent font-mono rounded-sm hover:border-brand-primary`.

### CAD Financial Inputs
- Must use `font-mono`.
- Absolute positioned prefix: `CAD $` in `text-text-muted`.
- Focus state must be a sharp 1px ring without pixel shifting: `focus:outline-none focus:ring-1 focus:ring-brand-primary` (Light) or `focus:ring-brand-electric` (Dark).

---

## Telemetry & Timers (CRITICAL)

All live data (countdown timers, bid counts, odometer readings) MUST use `font-mono`. If you use proportional fonts (like Inter), the UI will jitter horizontally every second.

### The 24h Countdown Clock
- **Standard State:** Enclosed in a small structural track: `bg-track-light` (Light) or `bg-track-dark` (Dark), `rounded-sm px-2 py-1`.
- **Urgency State (Sub-15 minutes):**
  - Text shifts to `text-brand-crimson` (Light) or `text-brand-neon-crimson` (Dark).
  - The parent auction card emits the Urgency Glow: `shadow-[0_0_16px_0_rgba(230,57,70,0.25)] ring-1 ring-brand-crimson`.

### Sealed Bid Counter
- Must only display the count of bids (e.g., `14 BIDS`), never the CAD amount during an active auction.
- **Formatting:** `font-mono text-sm font-bold`.

---

## Regulatory Compliance Badges

Used to verify dealer provincial licenses. Must look like official stamps.

- **Base classes:** `rounded-sm px-2 py-0.5 font-mono text-xs font-bold uppercase border`
- **OMVIC:** `border-badge-omvic text-badge-omvic`
- **AMVIC:** `border-badge-amvic text-badge-amvic`
- **VSA:** `border-badge-vsa text-badge-vsa`

---

## Empty States & Fallbacks

Keep empty states stark and structural.

- **Background:** `bg-canvas-light` or `bg-canvas-dark`.
- **Text:** `text-text-muted` or `text-text-dark-muted`.
- **Iconography:** Monoline SVG, strictly geometric (no playful illustrations).
- **CTA:** Include one clear Primary action button if applicable (e.g., "Add First Listing").

---

## Do Nots (Hard Constraints)

- **NEVER** use Tailwind's built-in color classes (`bg-blue-500`, `text-gray-600`). Use project tokens mapped in `@theme` only.
- **NEVER** define colors in inline styles or JS logic.
- **NEVER** stack more than two levels of border radius (e.g., a `rounded-sm` button inside a `rounded-md` card is the max depth).
- **NEVER** use soft pill shapes (`rounded-full`) for structural layout elements; reserve `rounded-full` strictly for status dots and profile avatars.
- **NEVER** display live bid CAD amounts in the UI while an auction is `ACTIVE`.
- **NEVER** use proportional fonts (`font-body` or `font-display`) for numbers that change in real-time.
