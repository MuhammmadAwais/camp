# UI Rules: AutoNexa & CAMP Platform

Strict, production-grade rules for building user interfaces across AutoNexa.
This system merges two distinct visual experiences:
1. **The Public Marketing Experience (AutoNexa Landing Page):** Governed by the **Autumn Editorial** design language ([DESIGN (3).md](file:///c:/Users/Prime/OneDrive/Documents/Office/Office%20Projects/camp/DESIGN%20%283%29.md)) — tactile warmth, editorial restraint, warm ivory canvas, and curated typography.
2. **The High-Velocity Auction Portals (Seller / Dealer):** FinTech data density, dual-mode (Porcelain / Obsidian), and sealed-bid telemetry.

---

## 1. The Typographic Hierarchy

Always configure and apply three specific font engines via `next/font/google` in the root layout:

1. **Epilogue (`font-headline` / `--font-headline`):**  
   - Purpose: Display headlines, hero titles, section titles, card headers.  
   - Characteristics: Editorial, literary impact, tight letter-spacing (`-0.02em` on large scales).
2. **Plus Jakarta Sans (`font-body` / `--font-body`):**  
   - Purpose: Body copy, feature narratives, button labels, navigation links, form fields.  
   - Characteristics: Friendly geometry, open counters, zero eye fatigue over warm ivory backgrounds.
3. **JetBrains Mono (`font-mono` / `--font-mono`):**  
   - Purpose: **Real-time telemetry only.** 24h countdown tickers (`23:59:42`), 17-character VINs, CAD Currency (`$42,850`), Bid Counts.  
   - Characteristics: Tabular numbers prevent layout jitter when digits update.

```typescript
import { Epilogue, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';

const headline = Epilogue({ subsets: ['latin'], variable: '--font-headline', weight: ['600', '700'] });
const body = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-body', weight: ['400', '500', '600', '700'] });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', weight: ['400', '600', '700'] });
```

---

## 2. Layout, Grid & Spacing Rules

The AutoNexa landing page employs a responsive 12-column grid with generous editorial breathing room:

- **Desktop (>= 1024px):** 12-column grid. Max-width `max-w-7xl` (1280px) or `max-w-6xl` (1152px) centered. Outer margins `px-8` to `px-12` (48px). Column gutters `gap-6` (24px).
- **Tablet (768px - 1023px):** 8-column grid. Outer margins `px-6` to `px-8` (32px). Column gutters `gap-5` (20px).
- **Mobile (< 768px):** 4-column compact flow. Outer margins `px-4` to `px-5` (20px). Column gutters `gap-4` (16px).
- **Section Pacing:** Major sections use generous vertical cushions: `py-16 md:py-24 lg:py-28`. Never compress sections into cramped blocks.

---

## 3. Elevation & Tonal Stepping

Depth is achieved primarily through **tonal stepping** and **warm ambient shadows**, not harsh desaturated black drop-shadows:

- **Base Canvas:** `bg-surface` (`#FFF8F2`). Eliminates harsh monitor glare.
- **Card Surfaces:** `bg-surface-container-lowest` (`#FFFFFF`) with 1px border `border-border-card` (`#EADDCB`).
- **Paced Contrast Shifts:** Alternate sections shift to `bg-surface-container` (`#F8ECDB`) or `bg-surface-container-low` (`#FEF2E1`) to delineate content boundaries without jarring lines.
- **Warm Ambient Shadows:** Cards and floating modules utilize `--shadow-ambient-card` (`0 4px 20px -2px rgba(56, 20, 24, 0.05)`) and `--shadow-ambient-warm` (`0 16px 32px -4px rgba(56, 20, 24, 0.08)`).

---

## 4. Components & Interactive Elements

### Buttons
All buttons maintain crisp, deliberate geometry (`rounded-sm` / 8px) and semi-bold typography (`font-body font-semibold`):

- **Primary Button (Action / Submit):**  
  `bg-primary text-white hover:bg-primary-hover rounded-sm px-6 py-3 font-body font-semibold transition-all shadow-sm active:scale-[0.99]`
- **Secondary Button (Outlined / Exploratory):**  
  `border-1.5 border-primary text-primary hover:bg-primary/5 rounded-sm px-6 py-3 font-body font-semibold transition-all`
- **Accent Button (High-Energy Valuation CTA):**  
  `bg-secondary text-on-surface hover:bg-secondary/90 rounded-sm px-6 py-3 font-body font-semibold transition-all shadow-sm`

### Chips & Pill Badges
- **Shape:** Full capsule (`rounded-full`).
- **Padding:** `px-3.5 py-1`.
- **Style:** Subtle amber or terracotta tint with high-contrast text:  
  `bg-secondary/15 text-secondary text-xs font-body font-bold uppercase tracking-wider`

### Cards
- **Container:** `bg-surface-container-lowest border border-border-card rounded-lg p-6 md:p-8 shadow-ambient-card`
- **Headers:** Set in `font-headline font-bold text-on-surface`.
- **Micro-copy:** Set in `font-body text-sm text-on-surface-variant`.

### Input Fields (e.g. Instant VIN Valuation)
- Filled container style with `bg-surface-container-lowest border border-outline-variant/40 rounded-sm px-4 py-3.5 text-on-surface`.
- Focus state: `focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary`.
- VIN format: Always set in `font-mono tracking-widest uppercase`.

---

## 5. Do Nots (Strict Guardrails)

- **NEVER** use Tailwind's default color classes (e.g., `bg-blue-600`, `text-gray-500`, `bg-neutral-100`). Always use defined tokens (`bg-primary`, `bg-surface`, `text-on-surface-variant`).
- **NEVER** use harsh drop shadows with black tinting (`rgba(0,0,0,0.2)`). Use warm ambient shadows tinted with burgundy-umber (`rgba(56, 20, 24, 0.08)`).
- **NEVER** hardcode hex values in JSX or component style attributes.
- **NEVER** use proportional fonts for countdown tickers, VIN characters, or currency cents — always use `font-mono`.
- **NEVER** display live bid CAD amounts while an auction is `ACTIVE` (Sealed Bid Invariant).
- **NEVER** clutter editorial sections with harsh divider lines; rely on tonal stepping (`bg-surface` to `bg-surface-container`).

---

## 6. Portal & Auth UI Rules (FinTech Precision)

1. **Auth Backdrop & Vignette:**  
   The authentication screen must render `public/illustrations/why-us.webp` with a subtle dark gradient veil (`from-black/85 via-black/50 to-black/85`) so automotive contours peek through without compromising WCAG AAA text contrast.
2. **Glassmorphic Constraints:**  
   Auth cards must use `backdrop-blur-2xl`, translucent charcoal fill (`bg-glass-card-bg`), and a delicate 1px white border (`border-glass-card-border`). Never use opaque solid gray modals for auth.
3. **Primary Action Contrast:**  
   The primary submit button on the Auth Card must be solid crisp white (`bg-white text-slate-950 font-semibold`) for immediate visual hierarchy, paired with an interactive scale-down micro-interaction (`active:scale-[0.99]`).
4. **Input Focus Accents:**  
   Form inputs must illuminate with a subtle Racing Emerald glow ring (`focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20`) to signal active engagement.
5. **Theme Segregation:**  
   Landing page components use Autumn Editorial tokens; portal dashboards use `--color-portal-*` and `--color-emerald-*` tokens. Dealers default to dark mode (`.dark`), while sellers default to light porcelain.

