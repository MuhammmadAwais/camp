# UI Registry: AutoNexa & CAMP Platform

This is a **Living Document**. It serves as the single source of truth for all built UI components to prevent design drift across chat sessions, agent skills (`/imprint`, `/review`, `/recover`), and API boundaries.

---

## Agent Instructions: How to Use This Registry

**BEFORE building any new component:**
1. Check this registry. Does a component for this exact purpose already exist?
2. If YES: Import it. Match its exact props and CSS classes. Do not invent a variation.
3. If NO: Build the component strictly following `ui-tokens.md` and `ui-rules.md`.

**AFTER building any new reusable component:**
1. You MUST update this file by appending the component's documentation (or running `/imprint`).
2. Use the exact formatting template provided below.
3. Explicitly state the design system mode (Autumn Editorial for Landing Page vs. Porcelain/Obsidian for Auction Portals).

---

## Registered Component Patterns (Autumn Editorial — AutoNexa Landing)

### `PrimaryButton`
- **Path:** `components/ui/Button.tsx` (variant="primary")
- **Design System:** Autumn Editorial
- **Description:** Main action trigger for appraisals, valuations, and primary marketing calls to action.
- **Props:** `{ children: ReactNode, onClick?: () => void, className?: string, disabled?: boolean, isLoading?: boolean }`
- **Base Classes:** `inline-flex items-center justify-center rounded-sm bg-primary px-5 py-2.5 font-body font-semibold text-white shadow-sm transition-all hover:bg-primary-hover active:scale-[0.99] disabled:opacity-50`

### `SecondaryButton`
- **Path:** `components/ui/Button.tsx` (variant="secondary")
- **Design System:** Autumn Editorial
- **Description:** Outlined button for exploratory actions (e.g. "Discover Makes", "Learn More", "Dealer Sign In").
- **Props:** `{ children: ReactNode, onClick?: () => void, className?: string }`
- **Base Classes:** `inline-flex items-center justify-center rounded-sm border border-primary text-primary px-5 py-2.5 font-body font-semibold transition-all hover:bg-primary/5 active:scale-[0.99]`

### `AccentButton`
- **Path:** `components/ui/Button.tsx` (variant="accent")
- **Design System:** Autumn Editorial
- **Description:** High-energy honey amber button for conversion triggers and instant valuation banners.
- **Props:** `{ children: ReactNode, onClick?: () => void, className?: string }`
- **Base Classes:** `inline-flex items-center justify-center rounded-sm bg-secondary px-5 py-2.5 font-body font-semibold text-on-surface shadow-sm transition-all hover:bg-secondary/90 active:scale-[0.99]`

### `Badge`
- **Path:** `components/ui/Badge.tsx`
- **Design System:** Autumn Editorial
- **Description:** Pill tags for national certification, categories, and live indicators.
- **Props:** `{ children: ReactNode, variant?: 'primary' | 'secondary' | 'outline' | 'surface' | 'success', className?: string }`
- **Base Classes:** `inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-body text-xs font-semibold tracking-wide uppercase transition-colors`

### `VinAppraisalInput`
- **Path:** `components/marketing/VinAppraisalInput.tsx`
- **Last updated:** 2026-09-25

| Property         | Class |
| ---------------- | ----- |
| Background       | `bg-surface-container-lowest/95 backdrop-blur-sm` |
| Border           | `border border-border-card` (container) / `border border-outline-variant/60` (input) |
| Border radius    | `rounded-2xl` (card) / `rounded-sm` (input & button) |
| Text — primary   | `font-mono text-on-surface uppercase tracking-wider` |
| Text — secondary | `font-body text-xs text-on-surface-variant` |
| Spacing          | `p-4 sm:p-6 gap-2.5` |
| Interactive state| `focus:border-primary focus:ring-1 focus:ring-primary` |
| Shadow           | `--shadow-ambient-warm` |
| Accent usage     | `text-secondary`, `bg-success` |

**Pattern notes:**
Input is strictly monospaced for 17-character VINs with automatic uppercase sanitization and live counter (`X/17`). Features sample Canadian vehicle test pills.

---

### `Navbar`

File: `components/marketing/Navbar.tsx`  
Last updated: 2026-09-25

| Property         | Class |
| ---------------- | ----- |
| Background       | `bg-surface/95 backdrop-blur-md` (scrolled) / `bg-surface/80` (top) |
| Border           | `border-b border-border-card` |
| Border radius    | `rounded-sm` (buttons), `rounded-full` (national badge) |
| Text — primary   | `font-body text-sm font-medium text-on-surface-variant hover:text-primary` |
| Text — secondary | `text-on-surface-variant text-xs` |
| Spacing          | `h-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` |
| Hover state      | `after:w-full after:bg-primary` animated underline transition |
| Shadow           | `shadow-[0_4px_20px_-4px_rgba(56,20,24,0.06)]` |
| Accent usage     | `text-secondary`, `bg-secondary/10` |

**Pattern notes:**
Sticky desktop/mobile responsive header with smooth scroll backdrop blur and dual CTA hierarchy (Outlined Dealer Sign In vs. Solid Terracotta Valuation Offer).

---

### `HeroSection`

File: `components/marketing/HeroSection.tsx`  
Last updated: 2026-09-25

| Property         | Class |
| ---------------- | ----- |
| Background       | `bg-surface` with ambient warm radial gradients (`bg-secondary/10`, `bg-primary/5`) |
| Border           | `border border-border-card` (telemetry cards) |
| Border radius    | `rounded-2xl` (showcase card), `rounded-lg` (value cards), `rounded-full` (pills) |
| Text — primary   | `font-headline text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-on-surface` |
| Text — secondary | `font-body text-base sm:text-lg text-on-surface-variant` |
| Spacing          | `pt-8 sm:pt-14 pb-0`, `grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12` |
| Hover state      | `hover:-translate-y-1 duration-300` on telemetry card |
| Shadow           | `--shadow-ambient-warm` |
| Accent usage     | `text-primary underline decoration-secondary/40 decoration-wavy` |

**Pattern notes:**
Editorial high-conversion hero layout. Incorporates real Canadian trust pillars, embedded `VinAppraisalInput`, real-time simulated 24h countdown clock, and connects directly to `MediaTicker`.

---

### `MediaTicker`

File: `components/marketing/MediaTicker.tsx`  
Last updated: 2026-09-25

| Property         | Class |
| ---------------- | ----- |
| Background       | `bg-surface-container/70` |
| Border           | `border-y border-border-card/80` |
| Border radius    | None (full-width continuous ribbon) |
| Text — primary   | `font-body text-xs font-bold uppercase tracking-widest text-on-surface-variant` |
| Spacing          | `py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 gap-6` |
| Hover state      | `grayscale hover:grayscale-0 contrast-125 opacity-75 hover:opacity-100 hover:scale-105` |
| Shadow           | None |
| Accent usage     | `bg-secondary` dot indicator |

**Pattern notes:**
Full-width media credibility bar displaying real Canadian press logos (`Globe and Mail`, `Toronto Star`, `Auto Remarketing`, `Yahoo`, `News Radio 680`).