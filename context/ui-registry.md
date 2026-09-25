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
| Background       | `bg-transparent` (top, floating directly over hero image) / `bg-[#201B11]/90 backdrop-blur-md` (scrolled) |
| Border           | None (top) / `border-b border-white/10` (scrolled) |
| Border radius    | `rounded-sm` (buttons), `rounded-full` (national badge) |
| Text — primary   | `font-body text-sm font-medium text-white/90 hover:text-white` |
| Text — secondary | `text-white/80 text-xs` |
| Spacing          | `fixed top-0 left-0 right-0 z-50 py-5 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` |
| Hover state      | Active indicator `border-b-2 border-secondary` |
| Shadow           | `shadow-lg` when scrolled |
| Accent usage     | `text-secondary`, `bg-primary hover:bg-primary-hover text-white` |

**Pattern notes:**
Floating transparent header positioned directly on top of the hero image starry sky without any solid background blocks. Transitions to subtle glassmorphic backdrop on scroll.

---

### `HeroSection`

File: `components/marketing/HeroSection.tsx`  
Last updated: 2026-09-25

| Property         | Class |
| ---------------- | ----- |
| Background       | Raw `public/hero-bg.jfif` full-bleed cover (zero filters, zero texture overlays) with subtle bottom-edge fade to surface |
| Border           | `border border-white/20` (tickers and badges) |
| Border radius    | `rounded-2xl` (widget container), `rounded-full` (pills and tickers) |
| Text — primary   | `font-headline text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.85)]` |
| Text — secondary | `font-body text-lg sm:text-xl text-white/95 drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]` |
| Spacing          | `pt-28 sm:pt-36 lg:pt-40 pb-16 px-4 sm:px-6 lg:px-8` |
| Hover state      | Interactive transitions on valuation triggers |
| Shadow           | Deep drop shadows on headline for legibility over raw photographic twilight |
| Accent usage     | `italic font-serif text-secondary underline decoration-secondary/60 underline-offset-8` |

**Pattern notes:**
Clean, unfiltered hero section. Background image extends continuously under the floating transparent navbar from the top of the viewport. Features keyword emphasis on *"Best"*, live 24h auction countdown pill, embedded `MarketValuationWidget`, and connects directly to `BrandCarousel`.

---

### `MarketValuationWidget`

File: `components/marketing/MarketValuationWidget.tsx`  
Last updated: 2026-09-25

| Property         | Class |
| ---------------- | ----- |
| Background       | Translucent glassmorphism `bg-white/[0.07] backdrop-blur-2xl` |
| Border           | `border border-white/20` (container), `border-white/10` (dividers) |
| Border radius    | `rounded-2xl sm:rounded-3xl` (container), `rounded-xl` (inputs & tabs) |
| Text — primary   | `font-body text-sm font-medium text-white placeholder:text-white/45` |
| Text — secondary | `text-white/70 text-xs` |
| Spacing          | `p-4 sm:p-6 lg:p-7 gap-3` |
| Interactive state| Tabs: floating text navigation with active `text-white font-bold border-b-2 border-primary` and inactive `text-white/60 hover:text-white border-b-2 border-transparent`; Inputs: `focus:bg-white/[0.14] focus:border-white/45 focus:ring-1 focus:ring-white/30` |
| Shadow           | `shadow-[0_20px_50px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.15)]` |
| Accent usage     | `border-primary` active tab indicator, `bg-primary/90 hover:bg-primary text-white border border-white/20 backdrop-blur-md shadow-[0_4px_20px_rgba(142,34,44,0.45)]` CTA button |

**Pattern notes:**
Pure glassmorphism card floating over the twilight fleet hero image. Minimalist floating text category tabs with brand red active underline (`border-primary`). Zero button backgrounds or pill borders on tabs. Clean translucent frosted glass surfaces, white highlights, crisp typography, and luminous depth.

---

### `BodyTypeSelector`

File: `components/marketing/BodyTypeSelector.tsx`  
Last updated: 2026-09-25

| Property         | Class |
| ---------------- | ----- |
| Background       | `bg-transparent` (no card container background) |
| Border           | `border-0` (no borders around vehicles) |
| Border radius    | None |
| Text — primary   | `font-body text-[11px] font-medium text-white/70 group-hover:text-white` (active: `font-bold text-secondary`) |
| Spacing          | `grid grid-cols-4 sm:grid-cols-8 gap-3 sm:gap-4` |
| Hover state      | `group-hover:scale-105 group-hover:opacity-100 group-hover:text-white` |
| Shadow           | Vehicle cutouts with `drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)]` (active: `drop-shadow-[0_6px_14px_rgba(0,0,0,0.6)]`) |
| Accent usage     | `text-secondary font-bold` with glowing dot `bg-secondary shadow-[0_0_8px_rgba(217,143,76,0.8)]` |

**Pattern notes:**
Cardless 8-vehicle cutout selector (`SUVs`, `Trucks`, `Sedans`, `Coupes`, `Minivans`, `Hatchbacks`, `Convertibles`, `Station Wagons`) seamlessly integrated directly on top of the translucent glassmorphism widget canvas.

---

### `BrandCarousel`

File: `components/marketing/BrandCarousel.tsx`  
Last updated: 2026-09-25

| Property         | Class |
| ---------------- | ----- |
| Background       | `bg-surface` with subtle stone texture (`public/textures/stone-background-1400.jpg`) |
| Border           | `border-y border-border-card` |
| Border radius    | None (full-width continuous carousel) |
| Text — primary   | `font-body text-xs font-bold uppercase tracking-widest text-on-surface-variant` |
| Spacing          | `py-8 w-full gap-12 sm:gap-20` |
| Hover state      | `grayscale hover:grayscale-0 opacity-70 hover:opacity-100 hover:scale-105` |
| Shadow           | None |
| Accent usage     | Gradient edge masks via `.mask-radial-fade` |

**Pattern notes:**
Smooth, continuous infinite marquee of 8 automotive manufacturer logos (`public/car-company-logos/`) on warm Autumn Editorial surface with horizontal gradient edge masks. Pauses on hover.

---

### `WhatIsAutoNexa`

File: `components/marketing/WhatIsAutoNexa.tsx`  
Last updated: 2026-09-25

| Property         | Class |
| ---------------- | ----- |
| Background       | Deep obsidian `bg-[#120F0D]` with tactile dark marble layer (`public/textures/dark-marble.webp` at `opacity-15 mix-blend-luminosity`) |
| Border           | `border-b border-white/10` (divider), `border border-white/15 hover:border-white/30` (cards) |
| Border radius    | Chamfered geometry `[clip-path:polygon(0_0,calc(100%-28px)_0,100%_28px,100%_100%,28px_100%,0_calc(100%-28px))]` |
| Text — primary   | `font-headline text-5xl sm:text-7xl font-extrabold text-secondary` (`01.`), `text-white font-bold` |
| Text — secondary | `font-body text-lg sm:text-2xl text-white/70 leading-relaxed` with `underline decoration-secondary decoration-2` and `underline decoration-primary decoration-2` |
| Spacing          | `py-20 sm:py-28 lg:py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto` |
| Hover state      | Image zoom `group-hover:scale-105`, tags `hover:border-secondary/50`, buttons `hover:bg-primary` |
| Shadow           | `shadow-[0_12px_40px_rgba(0,0,0,0.6)]` (cards), `shadow-[0_8px_32px_rgba(0,0,0,0.5)]` (glass banners) |
| Accent usage     | `text-secondary` (`01.` numeral & pumpkin underlines), `bg-secondary` & `bg-primary` solid geometric corner triangles |

**Pattern notes:**
Editorial narrative and dual showcase cards with tactile dark marble backdrop. Features bold pumpkin `01.` index, interactive Canadian compliance tags, multi-weight lead paragraph with brand red/pumpkin keyword underlines, and non-standard chamfered geometric action cards.

---

### `DiscoverSection`

File: `components/marketing/DiscoverSection.tsx`  
Last updated: 2026-09-25

| Property         | Class |
| ---------------- | ----- |
| Background       | Section canvas: `bg-surface` (`#FDF9F3`); Inventory cards: `bg-white`; Photo canvas: `bg-surface-container/60` |
| Border           | Floating category tabs: `border-b-2 border-primary` (active indicator); Horizontal dividers: `border-t border-border-card/50` & `border-t border-border-card/60`; No harsh card perimeter borders |
| Border radius    | Inventory card: `rounded-tl-[32px] rounded-tr-[32px] rounded-bl-[32px] rounded-br-none`; Photo container: `rounded-[24px]`; Docked notch: `rounded-tl-[26px]`; Action button: `rounded-[18px]`; Watchlist button: `rounded-full` |
| Text — primary   | Headline: `font-headline text-3xl sm:text-4xl font-bold tracking-tight text-on-surface`; Vehicle title: `font-headline text-lg sm:text-[19px] font-bold text-on-surface leading-snug`; Wholesale price: `font-headline text-xl sm:text-2xl font-black text-on-surface` |
| Text — secondary | Category tabs: `font-body text-xs sm:text-sm`; Description: `font-body text-xs text-on-surface-variant`; Specs: `font-body text-xs text-on-surface font-semibold`; Dealer: `text-[11px] font-medium text-on-surface-variant`; Retail price: `line-through text-xs font-body text-on-surface-variant/60` |
| Spacing          | Grid container: `max-w-[1080px] mx-auto gap-8`; Card padding: `p-4 sm:p-5`; Specs row: `space-y-1.5` |
| Hover state      | Card: `hover:shadow-[-6px_8px_32px_rgba(32,27,17,0.08),0_-4px_16px_rgba(32,27,17,0.05)]`; Image: `group-hover:scale-105`; Title: `group-hover:text-primary`; Docked button: `hover:bg-primary hover:text-white group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5`; Heart: `hover:scale-115` |
| Shadow           | Card shadow layer: `shadow-[0_8px_30px_rgba(32,27,17,0.06)]` with polygon clip-path completely excising the bottom-right 85×85px corner (zero shadow bleed); Docked button: `shadow-[0_4px_14px_rgba(32,27,17,0.12)]`; Heart icon: `drop-shadow-[0_2px_6px_rgba(0,0,0,0.45)]` |
| Accent usage     | `bg-primary text-white` (action button hover & "New" badge), `bg-secondary text-white` ("Popular" badge), `bg-emerald-600 text-white` ("Trending" badge), `text-emerald-700 bg-emerald-50 border-emerald-200` (discount pill), `text-[#E63946]` (heart fill) |

**Pattern notes:**
- **Portrait Aspect Ratio (Height > Width):** Constrained grid to `max-w-[1080px]` with expanded `h-60 sm:h-64` photo canvas, achieving a slender 1:1.6 portrait proportion identical to the reference card.
- **Standalone Heart Icon:** Rendered directly in its authentic heart silhouette (`w-6 h-6`) on the top-right of the photo canvas with a crisp drop shadow (`drop-shadow-[0_2px_6px_rgba(0,0,0,0.45)]`), eliminating circular white container badges.
- **Zero Bottom-Right Shadow Bleed:** The card's box-shadow is rendered via an absolute clipped layer (`clip-path: polygon(...)`) that physically excises the bottom-right 85×85px corner, completely eliminating shadow lines around the notch.
- **Decluttered Multi-Line Specs:** Separated inline specs (`km • Transmission • Fuel`) and Dealer Location onto two dedicated, stacked lines (`space-y-1.5`), eliminating horizontal collision in portrait card widths.
- **Active Concave SVG Fillets (`fill-surface`):** The top and left fillet curves are filled with `fill-surface` (`#FFF8F2`), actively carving smooth concave arcs into the white card from both the right wall and bottom wall into the notch.
- **Docked Action Element:** `w-[52px] h-[52px] rounded-[18px]` floating squircle button nestled inside the notch with `ArrowUpRight` Phosphor icon.
- **Elevated Watchlist Heart:** Floating circular white button (`w-9 h-9 rounded-full bg-white/95 shadow-sm`) anchored in the top-right corner of the vehicle photo canvas opposite the status badge.
- **Sealed Bid Invariant Compliance:** Real live bids remain confidential; inventory cards present the pre-inspected *Wholesale Reserve Est.* alongside retail market values and verified discount spreads (`10% OFF`), with Carfax & dealer licensing attributes.

---

### `HowItWorks`

File: `components/marketing/HowItWorks.tsx`  
Last updated: 2026-09-25

| Property         | Class |
| ---------------- | ----- |
| Background       | Canvas: `bg-surface` (`#FFF8F2`); Image canvas: `bg-surface-container/60` |
| Border           | Section top: `border-t border-border-card/60`; Step divider: `border-t border-border-card/70`; Badge: `border border-primary/20`; No card borders |
| Border radius    | Image container: `rounded-2xl`; Badge: `rounded-full`; CTA Button: `rounded-xl` |
| Text — primary   | Headline: `font-headline text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-on-surface`; Step title: `font-headline text-xl sm:text-2xl font-bold text-on-surface`; Step numeral: `font-headline text-3xl sm:text-4xl font-black` |
| Text — secondary | Subtitle: `font-body text-xs font-semibold text-primary`; Step tag: `font-body text-xs font-bold uppercase tracking-widest text-on-surface-variant/80`; Bullet text: `font-body text-xs sm:text-sm text-on-surface leading-relaxed` |
| Spacing          | Section: `py-20 sm:py-28 lg:py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto`; Step grid: `gap-10 lg:gap-12`; Image height: `h-60 sm:h-64` |
| Hover state      | Image zoom: `group-hover:scale-105`; CTA button: `hover:bg-primary-hover active:scale-[0.98]` |
| Shadow           | Image: `shadow-xs group-hover:shadow-md`; CTA button: `shadow-md hover:shadow-lg` |
| Accent usage     | `text-secondary` (`01.` & `03.` bold pumpkin numerals), `text-primary` (`02.` bold wine numeral), `text-secondary` (directional flow dashed paths), `text-success` (check bullets) |

**Pattern notes:**
- **Cardless Minimalism:** Strictly borderless and unboxed presentation with stylish, rounded illustration frames (`get-estimate.jpg`, `start-bid.png`, `get-paid.jpg`) floating cleanly on the canvas without card rectangles or drop shadows.
- **Bold Color Numerals (About AutoNexa DNA):** Prominent bold numerals (`01.`, `02.`, `03.`) rendered in `font-headline font-black` matching the visual identity established in `WhatIsAutoNexa.tsx`.
- **Directional Flow Connectors:** Arching dashed SVG flow arrows with arrowheads positioned between steps (`Step 1 → Step 2 → Step 3`) along with a sweeping dashed curved trail guiding the user toward the bottom conversion CTA.
- **Conversion Trigger:** Centered "Start Your Free Appraisal" CTA button linking to `#valuation` with Canadian seller assurance tags.