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

## Component Documentation Template

Use this format when logging new components:

### `ComponentName`
- **Path:** `src/components/...`
- **Design System:** Autumn Editorial (Marketing) / Portal Dual-Mode
- **Description:** Brief purpose of the component.
- **Props:** `{ propName: type, ... }`
- **Base Classes:** The exact core Tailwind classes used.
- **Visual Behavior:** 
  - *Default:* e.g., `bg-surface-container-lowest border border-border-card text-on-surface`
  - *Hover / Active:* e.g., `hover:shadow-ambient-warm`

---

## Registered Component Patterns (Autumn Editorial — AutoNexa Landing)

### `PrimaryButton`
- **Path:** `src/components/ui/Button.tsx` (variant="primary")
- **Design System:** Autumn Editorial
- **Description:** Main action trigger for appraisals, valuations, and primary marketing calls to action.
- **Props:** `{ children: ReactNode, onClick?: () => void, className?: string, disabled?: boolean }`
- **Base Classes:** `inline-flex items-center justify-center rounded-sm bg-primary px-6 py-3 font-body font-semibold text-white shadow-sm transition-all hover:bg-primary-hover active:scale-[0.99] disabled:opacity-50`

### `SecondaryButton`
- **Path:** `src/components/ui/Button.tsx` (variant="secondary")
- **Design System:** Autumn Editorial
- **Description:** Outlined button for exploratory actions (e.g. "Discover Makes", "Learn More", "Dealer Sign In").
- **Props:** `{ children: ReactNode, onClick?: () => void, className?: string }`
- **Base Classes:** `inline-flex items-center justify-center rounded-sm border border-primary text-primary px-6 py-3 font-body font-semibold transition-all hover:bg-primary/5 active:scale-[0.99]`

### `AccentButton`
- **Path:** `src/components/ui/Button.tsx` (variant="accent")
- **Design System:** Autumn Editorial
- **Description:** High-energy honey amber button for conversion triggers and instant valuation banners.
- **Props:** `{ children: ReactNode, onClick?: () => void, className?: string }`
- **Base Classes:** `inline-flex items-center justify-center rounded-sm bg-secondary px-6 py-3 font-body font-semibold text-on-surface shadow-sm transition-all hover:bg-secondary/90 active:scale-[0.99]`

### `EditorialCard`
- **Path:** `src/components/ui/Card.tsx`
- **Design System:** Autumn Editorial
- **Description:** Base surface enclosure for features, vehicle showcases, and step narratives.
- **Props:** `{ children: ReactNode, className?: string, isInteractive?: boolean }`
- **Base Classes:** `rounded-lg bg-surface-container-lowest border border-border-card p-6 md:p-8 shadow-ambient-card transition-all`
- **Visual Behavior:**
  - *Interactive (`isInteractive`):* `hover:-translate-y-1 hover:shadow-ambient-warm hover:border-primary/20 cursor-pointer`

### `SectionHeader`
- **Path:** `src/components/marketing/SectionHeader.tsx`
- **Design System:** Autumn Editorial
- **Description:** Unified section intro lockup with eyebrow tag, display headline in Epilogue, and descriptive narrative.
- **Props:** `{ eyebrow: string, title: string, description?: string, align?: 'left' | 'center' }`
- **Base Classes:**
  - *Eyebrow:* `font-body text-xs font-bold uppercase tracking-widest text-secondary mb-3`
  - *Title:* `font-headline text-3xl md:text-5xl font-bold tracking-tight text-on-surface mb-4`
  - *Description:* `font-body text-base md:text-lg text-on-surface-variant max-w-2xl leading-relaxed`

### `VinAppraisalInput`
- **Path:** `src/components/marketing/VinAppraisalInput.tsx`
- **Design System:** Autumn Editorial
- **Description:** High-intent 17-character VIN entry module with quick vehicle evaluation trigger.
- **Props:** `{ onSubmitVin: (vin: string) => void, initialVin?: string }`
- **Base Classes:**
  - *Container:* `flex flex-col sm:flex-row gap-3 p-2 bg-surface-container-lowest border border-border-card rounded-xl shadow-ambient-card`
  - *Input:* `w-full bg-transparent px-4 py-3 font-mono text-base font-semibold uppercase tracking-wider text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none`
  - *Button:* `PrimaryButton with instant valuation label`