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
Last updated: 2026-09-29

| Property         | Class |
| ---------------- | ----- |
| Background       | Pill container: `bg-[#201B11]/90 backdrop-blur-xl` (resting) / `bg-[#201B11]/95 backdrop-blur-2xl` (scrolled); Emblem badge: `bg-surface border border-border-card/40`; Glider: `bg-white/[0.08]`; CTA pill: `bg-surface border border-border-card/40` |
| Border           | Pill outline: `border border-white/10` (scrolled: `border-white/15`); Glider: `border border-white/15` |
| Border radius    | Pill capsule: `rounded-full`; Emblem badge: `rounded-full`; Nav items / Glider: `rounded-full`; CTA action: `rounded-full` |
| Text — primary   | Nav links: `font-body text-xs sm:text-sm font-semibold text-surface/85` (resting); CTA button: `font-body text-xs sm:text-sm font-bold text-on-surface` |
| Text — secondary | Nav hover: `text-secondary font-bold`; CTA hover: `text-primary font-extrabold` |
| Spacing          | Floating pill: `fixed top-4 sm:top-6 left-0 right-0 z-50 flex justify-center px-4`; Pill padding: `p-1.5 sm:p-2 gap-2 sm:gap-3.5`; Links: `px-3.5 sm:px-4 py-2`; CTA: `px-4 sm:px-5 py-2 sm:py-2.5` |
| Hover state      | GSAP 3D kinetic rolling cylinder text flip (`rotateX(90deg)` / `rotateX(0deg)`), matte sliding glider, emblem 360° tumbling spin (`rotationY: +=360`, `scale: 1.15`), and CTA arrow tilt (`rotation: 45`) |
| Shadow           | Pill container: `shadow-[0_8px_24px_rgba(0,0,0,0.45)]` (scrolled: `shadow-[0_12px_32px_rgba(0,0,0,0.6)]`); Emblem: `shadow-xs`; CTA: `shadow-xs`; Zero colored glow drop-shadows |
| Accent usage     | `text-secondary` (honey amber 3D hover text roll), `text-primary` (brand wine red arrow and CTA hover flip) |

**Pattern notes:**
- **Official AutoNexa Logo:** The left circular button embeds the authentic gold metallic AutoNexa infinity car emblem (`/logo-mark.webp`), which tumbles 360° in 3D on hover.
- **Strict Autumn Editorial Color Palette:** Features `#201B11` espresso plum dark pill background, `#FFF8F2` warm oat buttons, `#E59344` honey amber link hovers, and `#8C383E` burgundy wine red accent transitions.
- **Institutional Matte Professionalism:** All artificial colored glows, neon shadows, and fuzzy halos have been eliminated in favor of clean, crisp, bank-grade matte shadows.

---

### `HeroSection`

File: `components/marketing/HeroSection.tsx`  
Last updated: 2026-09-29

| Property         | Class |
| ---------------- | ----- |
| Background       | Canvas: `bg-[#120F0D]` with full-bleed `public/hero-bg.webp` twilight fleet cover; Dark transition: `bg-gradient-to-t from-[#120F0D] via-[#120F0D]/85 to-transparent` (zero white fog) |
| Border           | `border border-white/20` (tickers and badges) |
| Border radius    | `rounded-2xl` (widget container), `rounded-full` (pills and tickers) |
| Text — primary   | `font-headline text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)]` |
| Text — secondary | `font-body text-lg sm:text-xl text-white/90 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]` |
| Spacing          | `pt-32 sm:pt-36 lg:pt-42 pb-16 px-4 sm:px-6 lg:px-8` |
| Hover state      | Interactive transitions on valuation triggers |
| Shadow           | Deep drop shadows on headline for legibility over raw photographic twilight |
| Accent usage     | `text-secondary underline decoration-secondary/60 underline-offset-8` |

**Pattern notes:**
- **Dark Atmospheric Transition:** Bottom edge features a deep `#120F0D` gradient fade rather than white fog, ensuring a cinematic dark-to-dark transition connecting the hero visual directly into `BrandCarousel` and `WhatIsAutoNexa`.

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
Last updated: 2026-10-02

| Property         | Class |
| ---------------- | ----- |
| Background       | Deep obsidian `bg-[#120F0D]` with tactile dark marble layer (`public/textures/dark-marble.webp` at `opacity-15 mix-blend-luminosity`) |
| Border           | `border-y border-white/10` |
| Border radius    | None (full-width continuous carousel) |
| Text — primary   | `font-body text-xs font-bold uppercase tracking-widest text-white/60` |
| Spacing          | `py-8 w-full gap-12 sm:gap-20` |
| Hover state      | Container: `hover:animation-play-state: paused`; Logos: `opacity-70 hover:opacity-100 hover:scale-110 transition-all duration-300` |
| Shadow           | None |
| Accent usage     | `brightness-0 invert` (normalizes black and dark emblems into crisp silver-white luxury badges) |

**Pattern notes:**
- **Luminance Inversion Normalization:** Resolves the issue where black/dark automaker marks (Cadillac, Polestar, Jeep) were lost against the dark background. Every emblem across the 8 brands now displays with consistent, elegant silver-white brilliance.
- **Continuous 60fps CSS Marquee:** Runs with smooth hardware-accelerated translation across duplicated tracks with horizontal gradient edge masks (`.mask-radial-fade`).

---

### `LandingAnimationProvider`

File: `components/marketing/LandingAnimationProvider.tsx`  
Last updated: 2026-10-02

| Property         | Class / Setting |
| ---------------- | --------------- |
| Animation Engine | GSAP 3 (`gsap` + `ScrollTrigger`) |
| Scope            | Scoped via `gsap.context()` for clean unmount teardown with zero memory leaks |
| Selectors        | `[data-reveal="header"]`, `[data-reveal="stagger-group"]`, `[data-reveal="card"]`, `[data-reveal="fade-up"]`, `[data-reveal="matrix-table"]`, `[data-reveal="matrix-row"]` |
| Timing & Easing  | Section Headers: `y: 32 -> 0, duration: 0.85s, ease: power3.out`; Card Clusters: `y: 36 -> 0, stagger: 0.1s, duration: 0.8s, ease: power2.out`; Matrix Rows: `y: 16 -> 0, stagger: 0.04s, duration: 0.6s` |
| Accessibility    | Bypasses tweens automatically when `(prefers-reduced-motion: reduce)` is detected |

**Pattern notes:**
- **Zero-Overhead Orchestrator:** Manages landing page choreography from a single client provider wrapping `app/page.tsx`, avoiding duplicate hooks in individual components.
- **Portal Boundary Safety:** Disposes of all ScrollTrigger watchers on unmount via `ctx.revert()`, preventing animation overhead on high-velocity auction portal routes (`/seller`, `/dealer`).

---

### `WhatIsAutoNexa`

File: `components/marketing/WhatIsAutoNexa.tsx`  
Last updated: 2026-10-10

| Property         | Class |
| ---------------- | ----- |
| Background       | Deep obsidian `bg-[#120F0D]` with tactile dark marble layer (`public/textures/dark-marble.webp` at `opacity-15 mix-blend-luminosity`) |
| Border           | `border-b border-white/10` (divider), `border border-white/15 hover:border-white/30` (cards) |
| Border radius    | Chamfered geometry `[clip-path:polygon(0_0,calc(100%-28px)_0,100%_28px,100%_100%,28px_100%,0_calc(100%-28px))]` |
| Text — primary   | `font-headline text-5xl sm:text-7xl font-extrabold text-secondary` (`01.`), `text-white font-bold` |
| Text — secondary | Lead: `font-body text-xl sm:text-2xl md:text-[28px] font-light text-white/75 leading-snug`; Supporting: `font-body text-base sm:text-lg text-white/60 leading-relaxed max-w-2xl`; single emphasis style `underline decoration-secondary decoration-2 underline-offset-6` |
| Stats row        | `<dl>` 3-col: value `font-headline text-3xl sm:text-4xl font-bold text-white`, label `font-mono text-[11px] uppercase tracking-widest text-white/50`, `pt-8 border-t border-white/10` |
| Spacing          | `py-20 sm:py-28 lg:py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto` |
| Hover state      | Image zoom `group-hover:scale-105`, buttons `hover:bg-primary` |
| Shadow           | `shadow-[0_12px_40px_rgba(0,0,0,0.6)]` (cards), `shadow-[0_8px_32px_rgba(0,0,0,0.5)]` (glass banners) |
| Accent usage     | `text-secondary` (`01.` numeral & pumpkin underlines), `bg-secondary` & `bg-primary` solid geometric corner triangles |

**Pattern notes:**
Editorial narrative and dual showcase cards with tactile dark marble backdrop. Features bold pumpkin `01.` index, static (non-interactive `<ul>`) trust tags, a key-figures `<dl>` anchored to the column bottom, a lead + supporting copy split with ONE emphasis style (max two highlights), an in-page `ArrowRight` CTA (reserve `ArrowUpRight` for external links), and chamfered geometric action cards.

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

---

### `FeaturesSection`

File: `components/marketing/FeaturesSection.tsx`  
Last updated: 2026-09-25

| Property         | Class |
| ---------------- | ----- |
| Background       | Canvas: Deep Obsidian `#120F0D` with tactile `dark-marble.webp` texture overlay (`mix-blend-luminosity opacity-15`); Center Core: `bg-[#16120F]/90 border border-white/20 backdrop-blur-2xl`; Bottom guarantee: `bg-white/[0.02] border border-white/10 rounded-3xl` |
| Border           | Horizontal dividers: `border-t border-white/10`; Orbital ring: `border border-dashed border-white/15`; Center core: `border border-white/20`; Badges: `border border-white/10` |
| Border radius    | Central pedestal: `rounded-full`; Orbital ring: `rounded-full`; Feature icons: `rounded-lg`; Badges: `rounded-full` & `rounded-xl`; Bottom container: `rounded-3xl` |
| Text — primary   | Headline: `font-headline text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white`; Feature titles: `font-headline text-xl sm:text-2xl font-bold text-white`; Numerals: `font-headline text-5xl sm:text-6xl font-black text-secondary` & `text-primary` |
| Text — secondary | Tagline badge: `font-body text-xs font-bold uppercase tracking-widest text-secondary`; Feature copy: `font-body text-sm text-white/70 leading-relaxed font-normal`; Micro telemetry: `font-mono text-xs text-white/60` |
| Spacing          | Section: `py-24 sm:py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto`; Wing columns: `space-y-12`; Indented copy: `pl-0 sm:pl-[72px]` |
| Hover state      | Feature titles: `group-hover:text-secondary` / `group-hover:text-primary`; Arrow links: `group-hover:translate-x-1 duration-200`; CTA button: `hover:bg-secondary/90 active:scale-95` |
| Shadow           | Center core: `shadow-[0_16px_40px_rgba(0,0,0,0.7)]`; Orbital node glows: `shadow-[0_0_10px_rgba(229,147,68,0.8)]` |
| Accent usage     | `text-secondary` (`01.`, `03.`, `05.` bold pumpkin numerals & badges), `text-primary` (`02.`, `04.` bold wine numerals & badges), `text-emerald-400` (live ping, Carfax verified, 100% free seller badge) |

**Pattern notes:**
- **Non-Grid Architectural Central Hub Layout:** Completely eliminated boxed bento card containers. Replaced with an open, fluid layout anchored by the official AutoNexa brand logo in a central orbital pedestal.
- **Bold Numerals (About AutoNexa DNA):** Features are labeled with massive, bold numerals (`01.`, `02.`, `03.`, `04.`, `05.`) in `font-headline font-black` alternating in `text-secondary` (honey amber) and `text-primary` (wine red), identical to the typographic hierarchy established in `WhatIsAutoNexa.tsx`.
- **Professional Minimalist Icons & Typography:** Uses sleek Phosphor icons (`LockKey`, `ChartLineUp`, `CheckCircle`, `ShieldCheck`) housed in minimalist frosted badges with uppercase category tracking tags.
- **Divider Lines & Directional Flow Connectors:** Subtle divider lines and arrow indicators (`ArrowRight`) that guide the eye between exchange protocols, valuation intelligence, condition verification, and provincial licensing.
- **Horizontal Grounding Anchor (Feature 05):** Full-width bottom guarantee band highlighting the 100% free seller direct payout (Interac e-Transfer and certified bank draft) with expedited 48-hour release.

---

### `WhyUsSection` (Problems & Solutions)

File: `components/marketing/WhyUsSection.tsx`  
Last updated: 2026-09-25

| Property         | Class |
| ---------------- | ----- |
| Background       | Canvas: Cinematic dark photography `/illustrations/why-us.webp` with top/bottom edge vignettes; Cards: Translucent frosted glass `bg-white/[0.03]` with `backdrop-blur-xl` (car body & reflections clearly visible through cards) |
| Border           | Cards: `border border-white/10 hover:border-white/20`; Square bullets: `w-2 h-2 rounded-[1px]` |
| Border radius    | Glassmorphic cards: `rounded-3xl`; Bullets: square |
| Text — primary   | Headline: `font-headline text-4xl sm:text-5xl xl:text-6xl font-black tracking-tight text-white whitespace-nowrap leading-none`; Sub-headline: `font-headline text-xl sm:text-2xl xl:text-3xl font-bold tracking-tight text-secondary`; Card text: `font-body text-base xl:text-[18px] text-white/95` |
| Text — secondary | Card subheaders: `text-xs font-mono tracking-widest uppercase font-semibold text-white/50` (Problems) & `text-secondary` (Solutions) |
| Spacing          | Section: `py-20 lg:py-0 px-4 sm:px-8 lg:px-14 xl:px-20 max-w-[1800px] mx-auto min-h-[900px] lg:min-h-[960px] xl:min-h-[1000px]`; Desktop stage: `h-[840px] xl:h-[880px]`; Card padding: `p-9 xl:p-11`; List gap: `space-y-5` |
| Hover state      | Cards: `hover:border-white/20` / `hover:border-secondary/30` |
| Shadow           | Problems Card: `shadow-[0_12px_40px_rgba(0,0,0,0.6)]`; Solutions Card: `shadow-[0_16px_50px_rgba(0,0,0,0.75)]`; Key: `drop-shadow-[0_16px_30px_rgba(0,0,0,0.9)]` |
| Accent usage     | `text-secondary` (`Problems & Solutions` subhead, `SOLUTIONS` label, accent bar, and solution square bullets) |

**Pattern notes:**
- **Exact Reference Layout:** Matches the reference placement with the photographic car silhouette background (`/illustrations/why-us.webp`).
- **Single-Line Top-Right Header:** `Why AutoNexa` displays on a single line with `whitespace-nowrap font-black` in the top-right corner of the canvas (`top-8 sm:top-10 xl:top-12 right-0 sm:right-2 xl:right-4`), with `Problems & Solutions` cleanly nested below it.
- **Translucent Frosted Glassmorphism:** Cards use authentic translucent glass (`bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl`), allowing the car silhouette, curves, and metallic reflections to be seen through the cards.
- **Top-Right Key Placement:** `/illustrations/why-us-top-key.png` rests on the top-right edge of the `SOLUTIONS` card (`absolute -top-16 -right-6 xl:-top-20 xl:-right-8 w-36 xl:w-44 -rotate-12`), tilted naturally over the card edge as a connecting bridge.
- **Spatial Alignment:** Card 1 (`PROBLEMS`) sits at `top-36 xl:top-40 left-0 w-[470px] xl:w-[520px]`, Card 2 (`SOLUTIONS`) sits lower at `top-[410px] xl:top-[440px] left-[230px] xl:left-[290px] w-[490px] xl:w-[540px]`, and the header sits far to the right in open dark negative space.

---

### `TestimonialsSection`

File: `components/marketing/TestimonialsSection.tsx`  
Last updated: 2026-09-28

| Property         | Class |
| ---------------- | ----- |
| Background       | Section: `bg-surface` (warm oat canvas `#FFF8F2`); Cards: `bg-white`; Avatar holder: `bg-surface-container` |
| Border           | Cards: `border border-border-card/60`; Divider line: `border-b border-border-card/60`; Avatar circle: `border border-border-card/80` |
| Border radius    | Cards: `rounded-2xl sm:rounded-[22px]`; Avatar: `rounded-full`; Divider pill: `rounded-full` |
| Text — primary   | Section title: `font-headline text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-on-surface`; Reviewer name: `font-headline font-bold text-sm text-on-surface`; Quote text: `font-body text-sm sm:text-[15px] text-on-surface/90 leading-relaxed font-normal` |
| Text — secondary | Subtitle: `font-body text-base sm:text-lg text-on-surface-variant`; Reviewer meta: `font-body text-xs text-on-surface-variant`; Trust ticker: `font-mono text-xs text-on-surface-variant/80` |
| Spacing          | Section: `py-24 sm:py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto`; Header margin: `mb-16 sm:mb-20`; Card padding: `p-6 sm:p-7`; Grid track: `h-[680px] sm:h-[740px] lg:h-[800px] gap-6 sm:gap-7` |
| Hover state      | Cards: `hover:shadow-[0_12px_32px_-4px_rgba(32,27,17,0.12)]`; Quote icon: `group-hover:text-primary/30`; Marquee tracks: `hover:animation-play-state: paused` |
| Shadow           | Cards: `shadow-[0_4px_20px_-2px_rgba(32,27,17,0.06)] hover:shadow-[0_12px_32px_-4px_rgba(32,27,17,0.12)]` |
| Accent usage     | `text-secondary` (5-star ratings & center header underline), `text-primary/15` (vintage quote glyphs), `text-success` (verified Canadian seller badge), `bg-success` (pulsing status dot) |

**Pattern notes:**
- **3-Column Infinite Counter-Marquee:** Three vertical columns running staggered infinite CSS translations (`animate-marquee-vertical-up` 42s and `animate-marquee-vertical-down` 42s). Responsive breakdown: 3 columns on `lg`, 2 columns on `md`, 1 column on mobile.
- **Seamless 60fps Loop Mathematics:** Arrays are duplicated (`[...testimonials, ...testimonials]`) with exact `translateY(-50%)` to `translateY(0%)` loops to guarantee zero jump or hitching during continuous scrolling.
- **Double Soft-Edge Vignette Fade:** Combining CSS `[mask-image:linear-gradient(to_bottom,transparent_0%,black_12%,black_88%,transparent_100%)]` with absolute top and bottom overlay gradients (`bg-gradient-to-b from-surface via-surface/90 to-transparent`) creates a soft, cinematic boundary as cards scroll into view.
- **Hover Play-State Pausing:** All marquee movement automatically pauses when the cursor hovers anywhere over the track or cards (`animate-marquee-vertical-*:hover { animation-play-state: paused; }`), allowing users to comfortably read quotes at their own pace.
- **Card Interior Architecture:** Clean internal layout with star ratings & Phosphor quote watermark on top, direct quote copy, a subtle horizontal divider line, and reviewer avatar + verified Canadian seller checkmark at the bottom.
- **Strict Autumn Editorial Tokens:** Fully respects the light warm oat canvas (`bg-surface`), honey amber accents (`text-secondary`), and earthy sage indicators (`text-success`).

---

### `FaqSection`

File: `components/marketing/FaqSection.tsx`  
Last updated: 2026-09-28

| Property         | Class |
| ---------------- | ----- |
| Background       | Canvas: `bg-surface` (app warm oat `#FFF8F2`); Support card: `bg-white`; Toggle active: `bg-primary/10`; Active card item: `bg-surface-container-low/40` |
| Border           | Accordion dividers: `border-t border-border-card` & `border-b border-border-card`; Toggle button: `border border-border-card` (inactive) / `border-primary/40` (active); Tag pill: `border border-primary/20` |
| Border radius    | Support card: `rounded-2xl`; Toggle icon circle: `rounded-full`; Tag pill: `rounded-full` |
| Text — primary   | Section title: `font-headline text-3xl sm:text-5xl font-bold tracking-tight text-on-surface`; Title highlight: `text-primary underline decoration-primary/40`; Question title: `font-headline font-semibold text-base sm:text-lg text-on-surface` (active: `text-primary font-bold`) |
| Text — secondary | Section subtitle: `font-body text-base sm:text-lg text-on-surface-variant`; Answer body: `font-body text-sm sm:text-base text-on-surface-variant leading-relaxed`; Support copy: `text-xs sm:text-sm text-on-surface-variant` |
| Spacing          | Section: `py-20 sm:py-28 lg:py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto`; Grid gap: `gap-12 lg:gap-14 xl:gap-20`; Accordion trigger: `py-5 sm:py-6`; Answer padding: `pr-4 sm:pr-8 mb-6` |
| Hover state      | Question: `group-hover:text-primary`; Toggle button: `group-hover:border-primary/40 group-hover:text-primary`; Support link: `hover:text-primary-hover` |
| Shadow           | Support card: `shadow-[0_4px_24px_-2px_rgba(32,27,17,0.06)]` |
| Accent usage     | `text-primary` (brand maroon wine `#8C383E` active questions, chevron toggle, category tag, decorative underline), `bg-primary` (top card accent line) |

**Pattern notes:**
- **Asymmetric Split Editorial Layout:** Removed the image cutout completely. The left column (`lg:col-span-5`) hosts the sticky editorial header, a maroon seller knowledge base badge, and a dedicated Canadian marketplace support card.
- **Maroon Wine Accents:** Infused with the signature Autumn Editorial brand maroon (`#8C383E` / `var(--color-primary)`) for active question highlights, circular toggle rings, category pills, and card accent lines.
- **Horizontal Line-Divided Geometry:** Built cleanly with warm horizontal divider lines (`border-border-card`) matching the modern minimalist reference geometry.
- **App Decided Oat Canvas:** Seamlessly integrated into the warm oat canvas (`bg-surface` `#FFF8F2`), completely eliminating dark brown textures for a cohesive, professional feel.

---

### `CtaBanner`

File: `components/marketing/CtaBanner.tsx`  
Last updated: 2026-09-28

| Property         | Class |
| ---------------- | ----- |
| Background       | Section: `bg-surface` (warm oat `#FFF8F2`); Card: `bg-[#201B11]`; Grid overlay: linear-gradient 52px opacity-20 |
| Border           | Container outline: `border border-secondary/30` |
| Border radius    | Card container: `rounded-3xl sm:rounded-[36px]` |
| Text — primary   | Headline line 1: `font-headline text-3xl sm:text-5xl lg:text-[44px] xl:text-[56px] font-bold tracking-tight text-white`; Line 2: `text-secondary` |
| Text — secondary | Paragraph: `font-body text-base sm:text-lg text-white/75 max-w-lg leading-relaxed` |
| Spacing          | Section: `py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto`; Card: `min-h-[360px] sm:min-h-[400px] lg:min-h-[420px]`; Text padding: `p-8 sm:p-12 lg:p-16 xl:pl-20` |
| Hover state      | Ambient static editorial banner (no glow) |
| Shadow           | Card: `shadow-[0_20px_50px_rgba(32,27,17,0.18)]`; Portrait: `drop-shadow-[0_20px_40px_rgba(0,0,0,0.8)]` |
| Accent usage     | `text-secondary` (`car & rides?` headline accent) |

**Pattern notes:**
- **App Decided Oat Canvas:** Sits on the app's signature light oat canvas (`bg-surface` `#FFF8F2`), completely eliminating muddy brown backgrounds and harsh glow orbs.
- **Unbroken 2-Line Typographic Lockup:** `Ready to elevate your` displays cleanly on line 1 without awkward single-word wrapping, followed immediately by `car & rides?` in honey amber on line 2.
- **Full-Bleed Vertical Portrait:** Anchors the isolated cutout portrait of the smiling woman holding her phone (`/avatars/happy-woman-in-a-green-sweater-holding-a-phone-and-1.webp`) so her head reaches close to the top border, filling the right side proportionally.

---

### `Footer` & `AutoNexaPhysicsCanvas`

File: `components/marketing/Footer.tsx`, `components/marketing/AutoNexaPhysicsCanvas.tsx`  
Last updated: 2026-09-28

| Property         | Class |
| ---------------- | ----- |
| Background       | Footer canvas: `bg-surface` (app warm oat `#FFF8F2`); CTA button: `bg-primary` (brand accent wine red `#8C383E`) |
| Border           | Top border: `border-t border-border-card/60`; Directory divider: `border-b border-border-card/80`; Canvas container: `border-t border-border-card/60`; Footnote: `border-t border-border-card/60` |
| Border radius    | CTA pill button: `rounded-full` |
| Text — primary   | Prompt title: `font-headline text-5xl sm:text-7xl md:text-8xl lg:text-[104px] font-black tracking-tight text-on-surface leading-none`; Link titles: `font-body text-sm text-on-surface/85`; CTA button: `text-white` |
| Text — secondary | Column headers: `font-mono text-xs font-bold uppercase tracking-widest text-on-surface-variant`; Copyright: `font-body text-xs text-on-surface-variant` |
| Spacing          | Section: `pt-20 sm:pt-28 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto`; Columns: `gap-10 lg:gap-14 pb-16 sm:pb-20` |
| Hover state      | CTA button: `hover:bg-primary-hover hover:scale-105 active:scale-95`; Links: `hover:text-primary` |
| Shadow           | CTA button: `shadow-md hover:shadow-lg` (clean, zero glow aura) |
| Accent usage     | `bg-primary` (brand accent red appraisal CTA button: "Get Your Free Appraisal"), `text-primary` (hover states), `text-success` (Law 25 compliance check) |

**Pattern notes:**
- **App Decided Oat Canvas:** Uses the authentic Autumn Editorial oat background (`bg-surface` `#FFF8F2`) and deep espresso plum text (`text-on-surface` `#201B11`), without brown tones or background glow halos.
- **Dual-Theme Physics Engine (`AutoNexaPhysicsCanvas`):** The word `AUTONEXA` or custom taglines are rendered using thousands of interactive beads. In Light Mode: primary wine red `rgba(140, 56, 62, 0.65)` when resting, dispersing into vibrant crimson `rgba(186, 26, 26, 0.95)` when repelled by the cursor. In Dark Mode: crisp white beads `rgba(255, 255, 255, 0.82)` on obsidian canvas, dispersing into radiant warm Honey Amber `rgba(229, 147, 68, 1)` when repelled by the amber cursor ring. Zero teal/green.
- **Performance Optimization:** Includes `IntersectionObserver` to halt the `requestAnimationFrame` loop when the footer is offscreen, eliminating background CPU/GPU load. Adaptive density on resize and full touch-drag support for mobile devices.

---

### `ComparisonCards`

File: `components/marketing/ComparisonCards.tsx`  
Last updated: 2026-10-02  

| Property         | Class |
| ---------------- | ----- |
| Background       | Section: `bg-surface` (`#FFF8F2`); Card 1 (Traditional): `bg-surface-container-low`; Card 2 (AutoNexa): `bg-surface-container-lowest` (`#FFFFFF`); Unified Header Bar: `bg-surface-container` (left) & `bg-primary text-white` (right) |
| Border           | Card 1: `border border-border-card/90`; Card 2: `border-2 border-primary/25`; Header Bar: `border border-border-card` |
| Border radius    | Cards: `rounded-3xl`; Shared Header Bar: `rounded-2xl`; Valuation CTA: `rounded-full` |
| Text — primary   | Headline: `font-headline text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-black tracking-tight text-on-surface`; Item title: `font-headline font-bold text-sm sm:text-[15px] text-on-surface leading-tight` |
| Text — secondary | Eyebrows: `font-mono text-[11px] font-bold uppercase tracking-widest text-on-surface-variant/75` & `text-primary`; Item descriptions: `font-body text-xs sm:text-[13px] text-on-surface-variant leading-relaxed` |
| Spacing          | Section: `py-20 sm:py-28 lg:py-32 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto`; Cards: `p-7 sm:p-9 lg:p-10 gap-8 lg:gap-10`; Items: `gap-3.5 space-y-6` |
| Hover state      | Both Cards: Symmetrical inward 3D tilt at rest (`rotateY: +3°` left vs `rotateY: -3°` right) with interactive cursor-tracking 3D tilt (`rotateX`, `rotateY`, `scale-102`) and dynamic glare sheens on hover; Container: `radial-gradient` spotlight |
| Shadow           | Card 1: `shadow-xs`; Card 2: `shadow-[0_16px_40px_-10px_rgba(140,56,62,0.08)]` |
| Accent usage     | `text-primary` (brand wine red headline & solution eyebrow), `text-error` (Phosphor `XCircle` fill for traditional challenges), `text-success` (Phosphor `CheckCircle` fill for AutoNexa solutions) |

**Pattern notes:**
- **Single Rectangular Shared Header Bar:** Features a continuous 50/50 split rectangular bar spanning both columns (`bg-surface-container` on the left and `bg-primary text-white` on the right).
- **Symmetrical 3D Perspective Stage:** Both cards are housed within a unified `[perspective:1200px]` coordinate stage. On default resting state, Card 1 pitches back 2° and yaws inward +3°, while Card 2 pitches back 2° and yaws inward symmetrically -3°, creating an architecturally balanced, gallery-style 3D presentation.
- **Interactive Cursor Tilt on Both Cards:** Hovering over either card smoothly tracks mouse movements in 3D (`rotateX`, `rotateY`, `scale-102`) accompanied by an ambient surface glare reflection, returning fluidly to symmetrical rest on mouse leave.
- **Human-Crafted, Non-Generic Automotive Copy:** Preserves authentic Canadian market economics (dealership margins, unscreened driveway test drives, counterfeit certified drafts vs. 1,400+ sealed-bidding dealers and certified dealer drafts).

---

### `ComparisonMatrix`

File: `components/marketing/ComparisonMatrix.tsx`  
Last updated: 2026-10-02  

| Property         | Class |
| ---------------- | ----- |
| Background       | Section: `bg-surface` (`#FFF8F2`); AutoNexa Column Card: `bg-surface-container-lowest` (`#FFFFFF`); Row hover: `hover:bg-surface-container-low/30` |
| Border           | Container divider: `border-t border-border-card/60`; AutoNexa Column Card: `border-2 border-primary/25`; Row lines: `border-b border-border-card/40` |
| Border radius    | AutoNexa Continuous Column Card: `rounded-3xl`; Mobile cards: `rounded-2xl` & `rounded-xl`; Bottom CTA: `rounded-full` |
| Text — primary   | Headline: `font-headline text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-black tracking-tight text-on-surface`; AutoNexa cells: `font-body text-sm font-bold text-primary` & `font-headline text-base font-black text-primary` |
| Text — secondary | Criteria labels: `font-body text-sm font-semibold text-on-surface`; Competitor text: `font-body text-xs sm:text-sm text-on-surface-variant` |
| Spacing          | Section: `py-20 sm:py-28 lg:py-32 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto`; Table container: `max-w-5xl mx-auto px-4 sm:px-6`; Row padding: `py-4.5` |
| Hover state      | Interactive cursor-reactive spotlight: `radial-gradient(650px circle at ${mousePos.x}px ${mousePos.y}px, rgba(140, 56, 62, 0.07), transparent 70%)` |
| Shadow           | AutoNexa Continuous Column Card: `shadow-[0_20px_50px_-12px_rgba(140,56,62,0.12)]` |
| Accent usage     | `text-primary` (brand wine red typography & CTA button), `text-success` (Phosphor `Check` bold checkmarks), `text-error` (Phosphor `X` bold crosses) |

**Pattern notes:**
- **Continuous Full-Height Column Card (Reference Image 5 / CodeAxe):** The AutoNexa column is a single, uninterrupted vertical card spanning from the header (with `/logo-mark.webp` and "AutoNexa | Sealed Dealer Exchange") down through all 10 feature rows to the conversion action button.
- **Zero Individual Pill Boxes:** Checkmarks and text sit directly on the clean white surface of the AutoNexa card without individual rounded pill borders or row chip backgrounds.
- **Grounded Canadian Regulatory Dimensions:** Evaluates OMVIC/AMVIC/VSA compliance, sealed blind auction mechanics, 24-hour binding timelines, certified dealer draft payments, and the average +$2,850 CAD net seller advantage.
- **Responsive Sub-Grid Mobile Presentation:** Responsive transformation for screens < 768px with individual criteria cards and clean AutoNexa highlights.

---

### `CustomScrollbar`

File: `app/globals.css`  
Last updated: 2026-10-02  

| Property         | Class / CSS Rule |
| ---------------- | ---------------- |
| Background       | Track: `var(--color-surface-container)` (`#F8ECDB`); Thumb: `var(--color-primary)` (`#8C383E`) |
| Border           | Thumb padding offset: `border: 3px solid transparent; background-clip: padding-box` |
| Border radius    | Track & Thumb: `border-radius: var(--radius-full)` (`9999px` pill geometry) |
| Text — primary   | N/A |
| Text — secondary | N/A |
| Spacing          | Ergonomic target dimensions: `width: 12px; height: 12px` |
| Hover state      | Thumb hover: `background-color: var(--color-secondary)` (`#E59344` honey amber); Active: `var(--color-primary-hover)` (`#752B30`) |
| Shadow           | Ambient track inset clipping |
| Accent usage     | Terracotta wine red resting thumb (`#8C383E`) transitioning to warm honey amber (`#E59344`) on hover |

**Pattern notes:**
- **Ergonomic Gripping Target:** Expanded scrollbar width to `12px` for comfortable mouse targeting and click-drag convenience without crowding content margins.
- **Floating Inset Thumb:** Employs `border: 3px solid transparent` with `background-clip: padding-box` to create a 3px cushion around the pill thumb so it floats gracefully inside the track.
- **Autumn Editorial Color Alignment:** Fully synced with design tokens — warm oat track (`#F8ECDB`), terracotta wine resting thumb (`#8C383E`), and high-energy honey amber hover glow (`#E59344`).
- **Cross-Browser Parity:** Firefox fallback via `scrollbar-width: auto; scrollbar-color: var(--color-primary) var(--color-surface-container)`.

---

## Registered Component Patterns (Portal & Auth System — Racing Emerald & Obsidian)

### `AuthShell` + `AuthVisualPanel` + `AuthCard` (Seller Onboarding Foundation)

File: `components/auth/AuthShell.tsx`, `components/auth/AuthVisualPanel.tsx`, `components/auth/AuthCard.tsx`  
Last updated: 2026-10-10 (Autumn Editorial split layout)  
Mode: Seller onboarding — light Autumn Editorial

| Property         | Class / CSS Rule |
| ---------------- | ---------------- |
| Background       | Page `bg-surface`; panel `bg-on-surface` + step photo + `bg-gradient-to-t from-on-surface via-on-surface/55 to-on-surface/10` (compact banner: `bg-gradient-to-r from-on-surface/90 via-on-surface/50`) |
| Border           | none on the form column; footer divider `border-t border-border-card` |
| Border radius    | Panel `rounded-lg` |
| Text — primary   | Form title `font-headline text-3xl sm:text-[36px] font-bold tracking-tight text-on-surface`; panel headline `font-headline text-3xl xl:text-[40px] text-white` |
| Text — secondary | Description `font-body text-base text-on-surface-variant`; panel eyebrow `text-xs font-bold uppercase tracking-widest text-secondary` |
| Spacing          | Grid `lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]`; panel `sticky top-0 h-screen p-4 pr-0`, inner `p-10 xl:p-12`; form `max-w-lg`, eyebrow `mb-10`, body `mt-8` |
| Hover state      | Footer links `hover:text-primary` |
| Shadow           | none |
| Accent usage     | Panel check bullets `bg-secondary/20 ring-1 ring-secondary/50 text-secondary`; header trust dot `bg-success` |

**Pattern notes:**
<<<<<<< HEAD
- **Atmospheric Depth:** Designed to float gracefully above `public/illustrations/why-us.webp` with a dark radial vignette gradient overlay.
- **Micro-Glow Focus Rings:** Text inputs use `.glass-input` with Racing Emerald border and glow ring upon focus.
- **Segmented Pill Controls:** Sub-headers and Sign In / Sign Up toggles use pill pills (`rounded-full`) with `bg-white/10 text-white` for the active tab.
- **High-Contrast White CTA:** Primary action button utilizes pure solid white with deep slate text and subtle luminescence (`glow-white-sm`).

---

### `SolidAuthCard` (5:4 Minimalist Dual-Mode Pattern)

File: `features/auth/components/AuthCard.tsx`  
Last updated: 2026-10-09  

| Property         | Class |
| ---------------- | ----- |
| Background       | Dark: `bg-[#131215]` on canvas `bg-[#000000]` / Light: `bg-[#F3F4F6]` on canvas `bg-[#FFFFFF]` |
| Border           | Dark: `border border-white/10` / Light: `border border-neutral-200` |
| Border radius    | `rounded-3xl` |
| Text — primary   | Dark: `text-white font-headline font-bold` / Light: `text-black font-headline font-bold` |
| Text — secondary | Dark: `text-neutral-400 font-body text-xs` / Light: `text-neutral-600 font-body text-xs` |
| Spacing          | `p-6 sm:p-8 max-w-[530px] w-full mx-auto sm:aspect-[5/4] sm:min-h-[490px]` |
| Hover state      | Inputs: `focus:border-[#8C383E] focus:ring-2 focus:ring-[#8C383E]/25 outline-none`; Buttons: `hover:bg-[#752B30]` (Light) / `hover:bg-[#D9822F]` (Dark) |
| Shadow           | Dark: `shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)]` / Light: `shadow-[0_20px_45px_-15px_rgba(56,20,24,0.08)]` |
| Accent usage     | Autumn Editorial Dual-Theme: Primary CTA (`bg-[#8C383E] hover:bg-[#752B30]` Light / `bg-[#E59344] hover:bg-[#D9822F]` Dark), role selector (`bg-[#8C383E]/15 text-[#8C383E]` Light / `bg-[#E59344]/20 text-[#E59344]` Dark), and input focus ring (`focus:border-[#8C383E]`) |

**Pattern notes:**
- **Solid Minimalist Geometry:** Pure solid canvas (`#0C0A09` in dark mode, `#FFF8F2` in light mode).
- **5:4 Proportions:** Card maintains a 5:4 aspect ratio (`sm:aspect-[5/4] sm:min-h-[490px]`) in sign-in mode for a balanced and focused geometric presence, expanding gracefully for multi-field dealer registration.
- **Autumn Editorial Palette:** Unified brand palette `#8C383E` (Terracotta Wine) and `#E59344` (Honey Amber) provides high-end editorial authority with zero green accents.
- **Dual Theme Support:** Seamless instant toggle between Dark Mode (`#0C0A09` / `#131215` / `#FFFFFF` with Amber `#E59344`) and Light Mode (`#FFF8F2` / `#FFFFFF` / `#201B11` with Wine `#8C383E`).
- **Edge-Safe Autofill:** Custom input CSS prevents bright browser autofill rectangles in dark mode while preserving native browser credentials.

---

### `AuthFrostedGlass & Progressive Registration System`

File: `features/auth/components/Auth3DBackground.tsx` / `features/auth/components/AuthCard.tsx` / `app/login/page.tsx` / `app/register/page.tsx`  
Last updated: 2026-10-13  

| Property         | Class / Specification |
| ---------------- | --------------------- |
| Canvas           | Deep atmospheric dark canvas `bg-[#000000]` with subtle Emerald / Pine Teal radial ambient lighting (no floating 3D clutter) |
| Top-Left Brand   | Optically balanced AutoNexa gold emblem (`/logo-mark-tight.webp`, cropped to content bbox 734x390) beside `Auto<span className="text-[#E59344]">Nexa</span>` in `font-headline font-bold text-xl sm:text-2xl text-white`, no blurry drop shadows |
| Form Inputs      | Unified `font-body text-sm` (`Plus Jakarta Sans`) across all inputs and placeholders. Strictly one full-width input per row (`w-full`), never two inputs side-by-side |
| Input Icons      | Standardized 16px left icons (`User`, `Mail`, `Lock`, `Building`, `FileText`, `Phone`, `MapPin`) in `text-neutral-400` |
| Primary CTA      | Autumn Editorial: Terracotta Wine `#8C383E` (`hover:bg-[#752B30]`) in Light Mode / Honey Amber `#E59344` (`hover:bg-[#D9822F]`) in Dark Mode with clean subtle `shadow-sm` |
| Progressive Flow | Step 1 (Credentials & Role) &rarr; Step 2 (Phone & Postal Code / Dealership Verification), maintaining compact card height |
| Frosted Card     | Translucent frosted glass `bg-[#131215]/65 backdrop-blur-2xl border border-white/20 rounded-3xl p-7 sm:p-9 max-w-[440px] w-full shadow-2xl` |
| Social Login     | Google only (`Continue with Google`), clean matte border `border-white/15` |

---

### `PortalAppShell & Zentris-Replica Sidebar System`

File: `components/layout/AppShell.tsx` / `components/layout/Sidebar.tsx` / `components/layout/SidebarFlyout.tsx` / `components/layout/UserProfileCard.tsx` / `lib/store/useSidebarStore.ts`  
Last updated: 2026-10-13  

| Property         | Class / Specification |
| ---------------- | --------------------- |
| Shell Background | Dual-theme adaptive canvas: Light Mode soft warm ivory `bg-[#FFF8F2]`; Dark Mode obsidian espresso `bg-[#0C0A09]` |
| Navbar Policy    | **Zero Top Navbar** — maximum screen real-estate dedicated to auction telemetry and inventory grids without distraction |
| Desktop Sidebar  | `fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-white/95 dark:bg-[#131215]/95 backdrop-blur-2xl border-r border-gray-200 dark:border-white/10 transition-all duration-300 ease-in-out` |
| Rail Dimensions  | Expanded: `w-[260px]` / Collapsed icon rail: `w-[72px]` |
| Viewport Padding | Dynamic left padding on main content wrapper: `isCollapsed ? "lg:pl-[72px]" : "lg:pl-[260px]"` |
| Brand Lockup     | Expanded: `/logo-mark-tight.webp` (`w-8 h-[18px]`) beside `Auto<span className="text-[#8C383E] dark:text-[#E59344]">Nexa</span>` (`text-lg font-bold`) / Collapsed: centered emblem (`w-9 h-5`) |
| Toggle Controls  | Desktop: Integrated header button (`SidebarSimple`) + border notch button (`CaretRight`); Mobile: Floating glass trigger (`lg:hidden`) |
| Nav Items Active | `bg-[#8C383E]/10 text-[#8C383E] dark:bg-[#E59344]/15 dark:text-[#E59344] border border-[#8C383E]/25 dark:border-[#E59344]/30 shadow-xs` with active glow indicator bead `size-1 rounded-full bg-[#8C383E] dark:bg-[#E59344]` |
| Expanded Tree    | Branch guide lines `border-l border-white/[0.08]` with horizontal connector notch `w-2.5 h-[1px] bg-white/[0.08]` |
| Collapsed Flyout | Hover popover `absolute left-full top-0 ml-2.5 min-w-[210px] rounded-2xl bg-[#131215]/95 backdrop-blur-2xl border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.9)]` |
| Profile Menu     | Bottom user avatar trigger opening popover with Profile Settings, Portal Mode Switcher (`SELLER` vs `DEALER_ADMIN`), and Sign Out |

---

### Auth Split Suite — `AuthShell`, `AuthVisualPanel`, `AuthCard`, `AuthField`, `PasswordField`, `AuthSelect`, `AuthCheckbox`, `AuthButton`

File: `components/auth/*.tsx`  
Last updated: 2026-10-13  
Mode: Asymmetric Editorial Split (Solara & Truet Reference)

| Property         | Class / CSS Rule |
| ---------------- | ---------------- |
| Layout           | Split 12-col grid: Left 5-col Form Canvas (`bg-white`), Right 7-col Photography (`sticky top-0 h-screen`) |
| Right Banner Radius | Signature bottom-left curve: `rounded-bl-[80px] xl:rounded-bl-[100px] overflow-hidden` |
| Visual Assets    | `/auth/deal-making.jfif` (Sign In / Recovery), `/auth/keys-giving.jpg` (Registration / Sell / Verify) |
| Visual Overlay   | Multi-stop dark gradient: `bg-gradient-to-t from-black/95 via-black/60 to-black/30` |
| Input Fields     | Stacked single-row: `w-full rounded-lg border border-[#E5E7EB] bg-white px-3.5 py-2.5 font-body text-sm text-[#111827] focus:border-[#8C383E] focus:ring-1 focus:ring-[#8C383E]` |
| Primary Action   | Solid Terracotta Wine: `bg-[#8C383E] hover:bg-[#752B30] text-white font-semibold py-3 rounded-lg shadow-sm active:scale-[0.99]` (Zero diffuse glows) |
| Secondary Action | Crisp neutral: `bg-white border border-[#E5E7EB] text-[#111827] hover:bg-[#F9FAFB] py-3 rounded-lg` |
| Form Card        | Flat, unbordered canvas: `w-full max-w-[420px] mx-auto` (No heavy card container borders) |
| Header Lockup    | Left `< Back to website` link + Proportional AutoNexa emblem (`w-7 h-[18px]`) with `Auto<span className="text-[#8C383E] dark:text-[#E59344]">Nexa</span>` |

**Pattern notes:**
- **Zero Two-Input Rows:** First name, last name, postal code, and province are each rendered on their own full-width stacked row.
- **Seeded Demo Accounts Stripped:** All hardcoded demo fill buttons and mock hints are removed from the client interface.
- **Interactive Checkbox:** "Keep me logged in" with custom `#8C383E` check indicator.

---

### `OtpInput`

File: `components/auth/OtpInput.tsx`  
Last updated: 2026-10-10 (light theme)  
Mode: Seller onboarding — light Autumn Editorial

| Property         | Class / CSS Rule |
| ---------------- | ---------------- |
| Background       | `authInputClasses` per box |
| Border           | Same as inputs; invalid via `aria-invalid` |
| Border radius    | `rounded-md` |
| Text — primary   | `font-mono text-xl font-semibold text-center` |
| Text — secondary | n/a |
| Spacing          | `flex justify-between gap-2 sm:gap-2.5`; boxes `aspect-square max-w-14 px-0 py-0` |
| Hover state      | Focus selects the digit |
| Shadow           | none |
| Accent usage     | Blue focus ring |

**Pattern notes:**
- Controlled (`value`, `onChange`, `onComplete`). Use it through RHF `Controller`. Supports paste and SMS autofill (`autocomplete="one-time-code"`). It refocuses box 1 after a rejected code clears it.

---

### `FunnelSteps`

File: `components/auth/FunnelSteps.tsx`  
Last updated: 2026-10-10 (light theme)  
Mode: Seller onboarding — light Autumn Editorial

| Property         | Class / CSS Rule |
| ---------------- | ---------------- |
| Background       | Active `bg-primary text-white`; done `bg-success/10 text-success ring-1 ring-success/30`; inactive `bg-surface-container text-outline` |
| Border           | none; `ChevronRight` separators `text-outline` |
| Border radius    | `rounded-full` 28px badges |
| Text — primary   | Active label `font-body text-sm font-semibold text-on-surface` |
| Text — secondary | Done `text-on-surface-variant`, inactive `text-outline` (non-current labels hide below `sm`) |
| Spacing          | `gap-1.5 sm:gap-2` |
| Hover state      | none |
| Shadow           | none |
| Accent usage     | Blue = current, emerald = completed |

**Pattern notes:**
- `current: "vehicle" | "account" | "verify" | "identity"`. Renders `<nav><ol>` with `aria-current="step"` and sr-only status text.

---

### `DecodedVehicleCard`

File: `components/auth/DecodedVehicleCard.tsx`  
Last updated: 2026-10-10  
Mode: Seller onboarding — light Autumn Editorial

| Property         | Class / CSS Rule |
| ---------------- | ---------------- |
| Background       | `bg-surface-container-low`; spec pills `bg-surface-container-lowest` |
| Border           | `border border-border-card`; pills `border-border-card` |
| Border radius    | `rounded-md`; pills `rounded-full` |
| Text — primary   | Title `font-headline text-xl font-bold text-on-surface` + trim `text-on-surface-variant/80` |
| Text — secondary | VIN `font-mono text-sm tracking-wider text-on-surface-variant` |
| Spacing          | `p-5`; pills `mt-4 gap-2 px-3 py-1` |
| Hover state      | "Edit VIN" `text-primary hover:bg-primary/10` |
| Shadow           | none |
| Accent usage     | Eyebrow "VERIFIED VEHICLE" `text-[11px] font-bold uppercase tracking-wider text-primary` |

**Pattern notes:**
- Pills show engine, drivetrain and fuel type. A failed decode shows "VIN accepted" with manual-entry copy.

---

### `PhotoCapture`

File: `components/auth/PhotoCapture.tsx`  
Last updated: 2026-10-10 (light theme)  
Mode: Seller onboarding — light Autumn Editorial

| Property         | Class / CSS Rule |
| ---------------- | ---------------- |
| Background       | `bg-surface-container-low hover:bg-surface-container`; preview fills the tile |
| Border           | Dashed: empty `border-outline-variant`, filled `border-primary`, error `border-error` |
| Border radius    | `rounded-md` |
| Text — primary   | Label `text-sm font-semibold text-on-surface` |
| Text — secondary | Instruction `text-xs text-on-surface-variant` |
| Spacing          | `aspect-[1.586/1]` (ID card) or `aspect-[3/4] max-w-[220px]` (selfie) |
| Hover state      | Tile tint; "Retake" pill `bg-on-surface/85 text-white` |
| Shadow           | none |
| Accent usage     | Blue border once a photo is attached |

**Pattern notes:**
- A `<label>`-wrapped `input[type=file]` with `capture`. Object URLs are revoked on change and unmount. `validateKycPhoto()` allows JPG/PNG/WEBP/HEIC up to 10 MB.

---

### Seller Portal — `SellerHeader`, `KycStatusBanner`, `ListingStartCard`, `SellerDashboard`

File: `components/seller/*.tsx`  
Last updated: 2026-10-10  
Mode: Porcelain (light) seller portal

| Property         | Class / CSS Rule |
| ---------------- | ---------------- |
| Background       | Canvas `bg-portal-canvas`; cards `bg-portal-surface`; header `bg-portal-surface/90 backdrop-blur-md` |
| Border           | `border border-portal-border` |
| Border radius    | Cards `rounded-2xl`; tiles/banners `rounded-xl`; buttons `rounded-lg` |
| Text — primary   | `font-headline font-bold text-portal-text` |
| Text — secondary | `font-body text-sm text-portal-text-muted` |
| Spacing          | Page `max-w-6xl px-4 sm:px-6 py-8 sm:py-10 space-y-6`; cards `p-5 sm:p-6` |
| Hover state      | Primary action `bg-portal-primary hover:bg-portal-primary-hover text-white` |
| Shadow           | none (tonal borders only) |
| Accent usage     | KYC needed: `border-secondary/40 bg-secondary-fixed/40` + `text-on-secondary-fixed`; verified: `emerald-50/200/600/800`; counts in `font-mono tabular-nums` |

**Pattern notes:**
- The stat tiles show counts only. This respects the sealed-bid invariant: no CAD amounts while an auction is ACTIVE.
- `KycStatusBanner` and `ListingStartCard` read live status from `useKycStatus()`, which re-checks every 3s only while the status is PENDING.

---

### `AuthShell` & `AuthVisualPanel` (Asymmetric Split-Screen Auth Suite)

File: `components/auth/AuthShell.tsx`, `components/auth/AuthVisualPanel.tsx`  
Last updated: 2026-10-16  
Mode: Dual-layout Responsive Architecture (Mobile-First Touch Canvas < 1024px &rarr; 12-Column Split Desktop ≥ 1024px)

| Property         | Class / CSS Rule |
| ---------------- | ---------------- |
| Layout Structure | Mobile (`< 1024px`): Clean, direct single-column white form canvas with top navigation header (zero banner image clutter above the fold); Desktop (`≥ 1024px`): 12-col split grid (`lg:grid-cols-12` — 5-col form canvas / 7-col sticky photographic panel) |
| Mobile Top Bar   | `< Back to website` link + mobile brand lockup (`lg:hidden flex items-center gap-2` with official emblem) |
| Left Canvas      | `bg-white px-4 py-5 sm:px-8 sm:py-8 lg:px-12 lg:py-10 max-w-[420px] w-full mx-auto` |
| Touch Ergonomics | All buttons & role pills enforced with `min-h-[44px]` / `min-h-[46px]` touch boundaries and `active:scale-[0.99]` feedback |
| Fluid Grids      | Form paired rows (First/Last name, Postal/Province) use responsive fluid wrapping `grid grid-cols-1 sm:grid-cols-2 gap-3` preventing truncation on small mobile devices (`< 400px`) |
| Breadcrumbs      | `FunnelSteps.tsx` features `overflow-x-auto scrollbar-none` horizontal swipe protection for narrow devices |
| Legal Footer     | Responsive stack: `flex flex-col sm:flex-row items-center justify-between gap-y-3 gap-x-4 text-center sm:text-left` |
| Right Panel      | High-resolution imagery with signature `rounded-bl-[80px] xl:rounded-bl-[100px]` inner curve, gold emblem, and interactive dot-matrix physics canvas |
| Accent Color     | Autumn Editorial Dual-Theme: Terracotta Wine (`#8C383E` Light) & Honey Amber (`#E59344` Dark), focus rings (`focus:ring-[#8C383E]`), and text selection (`selection:bg-[#8C383E] dark:selection:bg-[#E59344]`) |

### Marketing Landing Suite — Responsive Mobile-First Architecture

File: `components/marketing/*.tsx` (`Navbar.tsx`, `HeroSection.tsx`, `MarketValuationWidget.tsx`, `BodyTypeSelector.tsx`, `WhatIsAutoNexa.tsx`, `DiscoverSection.tsx`, `HowItWorks.tsx`, `ComparisonCards.tsx`, `ComparisonMatrix.tsx`, `Footer.tsx`)  
Last updated: 2026-10-16  
Mode: Autumn Editorial responsive execution (from ultra-compact 320px mobile viewports to 4K displays)

| Property | Class / Implementation Pattern |
| --- | --- |
| Floating Navbar | Capsule pill (`top-4 sm:top-6`) with responsive CTA text (`sm:hidden`: "Appraisal" vs `sm:inline`: "Get Free Appraisal"), `min-h-[44px]` touch target, `min-w-[44px] min-h-[44px]` hamburger toggle, full-screen dismissal backdrop (`bg-black/65 backdrop-blur-xs z-40`), and `Escape` keyboard dismissal |
| Hero Section | Fluid typography scaling `text-3xl sm:text-5xl md:text-6xl lg:text-7xl` with `pt-32 sm:pt-36 lg:pt-42` header clearance, eliminating headline collision on mobile `< 380px` |
| Valuation Widget | `[perspective:1200px]` with subtle 3D tilt, `touch-pan-x overscroll-x-contain` category tabs, `grid-cols-1 sm:grid-cols-12` vertical input stacking, `min-h-[48px]` input/button touch targets, and `grid-cols-4 sm:grid-cols-8 gap-2 sm:gap-4` body-type icons |
| What Is AutoNexa | Fluid stats row (`grid-cols-3 gap-2.5 sm:gap-6` with `text-2xl sm:text-3xl lg:text-4xl`) preventing text collision on narrow viewports; showcase cards with fluid glassmorphic banner padding (`p-4 sm:p-6`) and `min-h-[44px]` action buttons |
| Discover Section | Category tabs with `touch-pan-x overscroll-x-contain pb-1`, card price row with wrap safety (`flex-wrap items-baseline gap-1.5 sm:gap-2.5 max-w-[calc(100%-72px)]`), and mobile-fluid conversion CTA (`w-full sm:w-auto min-h-[48px]`) |
| How It Works | Responsive illustration cards (`h-52 sm:h-64 rounded-2xl`), hidden desktop flow lines (`hidden lg:block`), and responsive bottom appraisal trigger (`w-full sm:w-auto min-h-[48px]`) |
| Comparison Cards | Desktop 50/50 comparison split bar (`hidden lg:grid`) &rarr; Mobile interactive segmented pill switcher (`lg:hidden flex items-center p-1 rounded-xl bg-surface-container border border-border-card min-h-[44px]`) switching between `AutoNexa Platform` and `Traditional Approach`, with in-card context identity badges (`Traditional Dealership: Trade-In Friction` / `AutoNexa Platform: 1,400+ Dealer Bids`), in-card cross-navigation, and `min-h-[48px]` appraisal action trigger |
| Comparison Matrix | Desktop 12-column table with continuous highlighted AutoNexa card &rarr; Mobile consolidated comparative architecture (`md:hidden`): single top AutoNexa advantage banner (official emblem, "AutoNexa Platform", `+$2,850 CAD` net equity badge), unified comparative card container (`rounded-2xl bg-surface-container-low border border-border-card divide-y divide-border-card/60`), 3-way comparative telemetry rows (`AutoNexa [col-span-6]` high-contrast card vs `Trade-In [col-span-3]` vs `Classifieds [col-span-3]`), completely eliminating repetitive 10-card bloat and duplicate logos, completed with full-width `min-h-[48px]` CTA |
| Marketing Footer | Scaling headline (`text-4xl sm:text-6xl md:text-8xl lg:text-[104px]`), single-column mobile wrapping for directory links (`grid-cols-1 sm:grid-cols-2 md:grid-cols-4`), and dynamically self-resizing `AutoNexaPhysicsCanvas` |

### `ComparisonCards` (Interactive Dual-Perspective Comparison Suite)

File: `components/marketing/ComparisonCards.tsx`  
Last updated: 2026-10-16  
Mode: Autumn Editorial responsive execution (Segmented mobile pill switcher < 1024px &rarr; 50/50 split duel ≥ 1024px)

| Property         | Class / Implementation Pattern |
| ---------------- | ------------------------------ |
| Container        | `max-w-6xl mx-auto space-y-6 sm:space-y-8` on warm oat canvas (`bg-surface`) |
| Top Split Bar    | Desktop only (`hidden lg:grid grid-cols-2 rounded-2xl bg-surface-container-low border border-border-card overflow-hidden divide-x divide-border-card/60 p-1 sm:p-1.5`) |
| Mobile Switcher  | `lg:hidden flex items-center p-1 rounded-xl bg-surface-container border border-border-card` with `min-h-[44px]` tap targets and smooth active pill states |
| Traditional Card | `rounded-3xl border border-border-card/80 bg-surface-container-low p-6 sm:p-8 lg:p-10 flex flex-col justify-between relative overflow-hidden transition-all duration-300` with warning accent badge (`bg-error/10 text-error`) |
| AutoNexa Card    | `rounded-3xl border-2 border-primary/30 bg-surface-container-lowest p-6 sm:p-8 lg:p-10 flex flex-col justify-between relative overflow-hidden shadow-[0_20px_50px_rgba(140,56,62,0.08)]` with official emblem and honey amber highlight badge (`bg-secondary/20 text-on-surface`) |
| Interactive CTA  | Card bottom action: `inline-flex items-center justify-center gap-2 px-6 py-3.5 min-h-[48px] rounded-xl bg-primary hover:bg-primary-hover text-white font-body text-sm font-bold shadow-xs transition-colors` |

**Pattern notes:**
Eliminated mobile header stacking where traditional and AutoNexa titles stacked detached from content. The segmented mobile switcher gives instant single-tap switching between platforms while maintaining full comparative context via contextual in-card identity badges and cross-navigation links.

---

### `ComparisonMatrix` (Consolidated 3-Way Comparative Audit)

File: `components/marketing/ComparisonMatrix.tsx`  
Last updated: 2026-10-16  
Mode: Autumn Editorial responsive execution (Unified micro-strips < 768px &rarr; Continuous 12-col column audit ≥ 768px)

| Property         | Class / Implementation Pattern |
| ---------------- | ------------------------------ |
| Container        | `max-w-5xl mx-auto px-2 sm:px-6` with cursor spotlight overlay on desktop |
| Desktop Matrix   | 12-column grid (`grid-cols-12 gap-6 py-4.5 items-center`) with continuous full-height AutoNexa column card (`col-start-6 col-span-3 rounded-3xl bg-surface-container-lowest border-2 border-primary/25 shadow-[0_20px_50px_-12px_rgba(140,56,62,0.12)]`) |
| Mobile Advantage Banner | `p-4 rounded-2xl bg-surface-container-lowest border-2 border-primary/30 shadow-xs flex items-center justify-between gap-3` with official logo emblem and `+$2,850 CAD` net equity badge |
| Mobile Micro-Strips | `rounded-2xl bg-surface-container-low border border-border-card divide-y divide-border-card/60 overflow-hidden shadow-xs` with `p-3.5 space-y-2` row items |
| 3-Way Mobile Grid | `grid grid-cols-12 gap-1.5 items-stretch`: AutoNexa (`col-span-6 bg-surface-container-lowest border border-primary/25 px-2.5 py-1.5`), Dealership Trade-In (`col-span-3 bg-surface-container/60 border border-border-card/40 text-center px-1.5 py-1.5`), and Classifieds (`col-span-3 bg-surface-container/60 border border-border-card/40 text-center px-1.5 py-1.5`) |
| Action Button    | Full-width mobile trigger: `min-h-[48px] rounded-xl bg-primary hover:bg-primary-hover text-white font-body text-sm font-bold shadow-xs` |

**Pattern notes:**
Replaced 10 bloated mobile cards (which previously repeated the full AutoNexa logo and banner 10 times and generated ~1,200px of scrolling) with a consolidated comparative architecture: a single top advantage banner establishing authority, followed by a compact micro-strip card comparing all 10 criteria side-by-side with zero clutter.

---

### Portal Shell & Wholesale Dashboard — Responsive Architecture

File: `components/layout/*.tsx`, `components/seller/*.tsx` (`AppShell.tsx`, `MobileMenuButton.tsx`, `Sidebar.tsx`, `SellerDashboard.tsx`, `SellerHeader.tsx`, `KycStatusBanner.tsx`, `ListingStartCard.tsx`)  
Last updated: 2026-10-16  
Mode: Porcelain / Obsidian dual-theme responsive execution with institutional FinTech density

| Property | Class / Implementation Pattern |
| --- | --- |
| Mobile Viewport Clearance | `AppShell` main container has `pt-16 sm:pt-20 lg:pt-8 px-4 sm:px-6 lg:px-8`, ensuring fixed top floating mobile triggers never obscure dashboard titles or alert banners |
| Floating Mobile Menu Button | Dual-mode adaptive capsule (`bg-white/90 dark:bg-[#131215]/90 border border-black/10 dark:border-white/15`) with `min-w-[44px] min-h-[44px] rounded-xl shadow-md` |
| Portal Sidebar Drawer | Fixed overlay drawer on mobile with guaranteed `w-[280px] sm:w-[290px]` width (independent of desktop rail collapse state), dedicated top mobile close trigger (`X` icon), full-screen backdrop dismissal (`bg-black/85 backdrop-blur-sm`), and `Escape` keyboard dismissal |
| In-Rail Sidebar Toggle | In collapsed mode (`isCollapsed`), the external sticking-out arrow has been eliminated. Replaced with an in-rail toggle button with horizontal bars (`=`) centered above the Home icon (`size-10 rounded-xl hover:bg-gray-100 dark:hover:bg-white/[0.08]`) matching reference specs |
| Theme Mode Toggle | Ultra-clean segmented pill (`bg-white/90 border-gray-200/90` in light mode &rarr; `bg-[#121114]/80 border-white/[0.08]` in dark mode) with refined typography, balanced Lucide `Sun` and `Moon` icons, active pill elevation, zero pulsing dot clutter, and smooth micro-press scaling |
| Adaptive Scrollbars | Route-aware dual scrollbar architecture: Landing page and Web App light mode use warm terracotta wine red (`#8C383E` with `#F8ECDB` track); Dark mode uses Honey Amber (`#E59344` with `#0C0A09` track), completely eliminating green. |
| Seller Dashboard Stats | Sealed-bid compliant count telemetry in responsive grid (`grid-cols-3 gap-2 sm:gap-4 p-3 sm:p-4`) with fluid font scaling (`text-xl sm:text-3xl font-bold tabular-nums`) preventing mobile label clipping |
| Location Badge & Welcome | `flex-wrap items-center gap-2` preventing badge truncation on compact smartphones |
| Status Banners & Actions | `KycStatusBanner` and `ListingStartCard` buttons upgrade to full-width mobile touch triggers (`w-full sm:w-auto min-h-[44px]`) with clear status messaging |

---

### `SellerDashboard` & Milestone 4.1 Telemetry Suite

Files: `components/seller/SellerDashboard.tsx`, `components/seller/SellerAuctionCard.tsx`, `components/seller/SellerStatsGrid.tsx`, `components/seller/SellerEmptyState.tsx`, `components/seller/SellerNotificationFeed.tsx`  
Last updated: 2026-10-17  
Mode: Autumn Editorial Dual-Theme (Porcelain Ivory `#FFF8F2` Light / Deep Obsidian `#0C0A09` Dark)

| Property | Class / Implementation Pattern |
| --- | --- |
| Dashboard Container | `mx-auto max-w-6xl w-full py-4 sm:py-6 space-y-6` |
| Stats KPI Grid | `grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4`: Card `rounded-2xl border border-portal-border bg-portal-surface p-4 sm:p-5 hover:border-[#8C383E]/40 dark:hover:border-[#E59344]/40` |
| Stats Value Typography | `font-mono text-xl sm:text-2xl lg:text-3xl font-bold tabular-nums text-portal-text` |
| Active Auction Card | `rounded-2xl border border-portal-border bg-portal-surface overflow-hidden hover:border-[#8C383E]/40 dark:hover:border-[#E59344]/40 flex flex-col md:flex-row` |
| Vehicle Cover Image | `w-full md:w-64 lg:w-72 h-48 md:h-auto shrink-0 bg-portal-surface-hover object-cover group-hover:scale-105` |
| Sealed Bids Counter Pill | `px-3 py-1 rounded-lg bg-[#8C383E]/10 dark:bg-[#E59344]/15 border border-[#8C383E]/20 dark:border-[#E59344]/30 font-mono text-xs font-semibold text-[#8C383E] dark:text-[#E59344]` |
| 24h Countdown Clock | `font-mono text-xs sm:text-sm font-bold text-portal-text tracking-wider tabular-nums` with live client interval |
| Reserve Asking Price | `font-mono text-base sm:text-lg font-bold text-portal-text` formatted via `formatCadCents` |
| Status Pill: Live 24h | `bg-[#E59344]/10 text-[#E59344] border-[#E59344]/30` with pulsing amber dot |
| Status Pill: In Review | `bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25` |
| Status Pill: Completed | `bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30` |
| Onboarding Empty State | `rounded-3xl border border-portal-border bg-portal-surface p-6 sm:p-10 text-center` with 3-step timeline cards |
| Notification Feed | `rounded-2xl border border-portal-border bg-portal-surface p-5 sm:p-6` with type-aware icons and unread dots |

**Pattern notes:**
- **Strict Sealed-Bid Invariant:** Displays only total bid counts during active auctions (e.g. `14 Sealed Dealer Bids`). Dollar values remain sealed until auction conclusion.
- **Strict Integer CAD Cents:** All reserve prices, gross volume, and bids are typed, stored, and sent as whole integer cents (`formatCadCents` at UI boundary only).
- **Interactive State Switcher:** Includes high-utility view toggle (`Active Floor (3)` vs `First-Time Seller (0)`) and background telemetry refresh for end-to-end verification.


---

### `ListingWizardShell & VinDecodeStep` (Milestone 4.2 / Step 1)

Files: `components/seller/wizard/ListingWizardShell.tsx`, `components/seller/wizard/VinDecodeStep.tsx`, `components/seller/wizard/ListingWizard.tsx`, `store/useListingWizardStore.ts`  
Last updated: 2026-10-19  
Mode: Autumn Editorial Dual-Theme (Porcelain Ivory `#FFF8F2` Light / Deep Obsidian `#0C0A09` Dark)

| Property | Class / Implementation Pattern |
| --- | --- |
| Wizard Outer Shell | `min-h-screen bg-portal-canvas text-portal-text flex flex-col` |
| Sticky Header | `sticky top-0 z-40 bg-portal-surface/90 backdrop-blur-md border-b border-portal-border h-16` with back navigation, step indicator title (`Step 1 of 5`), and "Save & Exit" button |
| 5-Step Stepper Bar | Responsive 5-column track: `grid grid-cols-5 gap-2 pt-1 pb-3 max-w-3xl mx-auto px-4` with dynamic bar indicators (`h-1.5 rounded-full bg-portal-primary` for active, `bg-portal-primary/60` for completed, `bg-portal-border` for pending) and desktop checkmark icons |
| Content Container | `max-w-2xl w-full mx-auto px-4 py-6 md:py-8` with card styling `bg-portal-surface border border-portal-border rounded-xl p-5 md:p-6 shadow-xs` |
| 17-Char VIN Input | `w-full px-4 py-3 rounded-xl font-mono text-base tracking-wider bg-portal-surface border border-portal-border` with real-time uppercase sanitizer, character counter (`17/17`), and live ISO 3779 checksum validator |
| Realtime Checksum Indicator | Dynamic feedback: `CheckCircle2` green checkmark when checksum passes; `AlertCircle` crimson warning with exact expected check digit at position 9 when invalid |
| Postal Code Input | `font-mono tracking-wider` with auto-normalization (`M5V 2T6`) and automatic Canadian province detection badge (`ON`, `QC`, `BC`, etc.) |
| Auto-Decode Action | Full-width button with `Sparkles` icon and `RefreshCw` loading spinner calling `POST /api/vin/decode` (NHTSA vPIC with 3s timeout) |
| Decoded Vehicle Card | `border border-portal-primary/40 rounded-xl p-5 md:p-6 bg-portal-surface shadow-sm` showing headline (`Year Make Model • Trim`), "NHTSA Auto-Decoded" badge, and 6-spec pill grid (Body Class, Engine, Transmission, Drivetrain, Fuel Type, Location) |
| Manual Override Accordion | Expandable grid allowing instant manual corrections for Year, Make, Model, Trim, Transmission, and Drivetrain if API is partial or for rare imports |
| Navigation Flow | `router.push('/seller/list-car?step=details', { scroll: false })` keeping browser history and mobile hardware back button functional |
| State Persistence | `useListingWizardStore` backed by `localStorage` (`autonexa-listing-wizard-draft`) ensuring unsubmitted mobile drafts are never lost on reload or tab-switch |

**Pattern notes:**
- **Zero RSC Serialization Pitfall:** Implements `SellerListCarShell.tsx` as a client component to cleanly handle `RequireSession` function children without Next.js Server Component boundary errors.
- **Client & Server Shared VIN Rules:** Validates check-digit in browser in < 5ms before firing network requests, reducing useless backend load.
- **Seamless Landing-to-Wizard Handoff:** Reads any existing `useSellIntentStore` from public landing page appraisals to prefill the VIN on first mount.

---

### `VehicleSpecsStep` (Milestone 4.2 / Step 2)

Files: `components/seller/wizard/VehicleSpecsStep.tsx`, `lib/schemas/vehicle-schema.ts`, `store/useListingWizardStore.ts`  
Last updated: 2026-10-20  
Mode: Autumn Editorial Dual-Theme (Porcelain Ivory `#FFF8F2` Light / Deep Obsidian `#0C0A09` Dark)

| Property | Class / Implementation Pattern |
| --- | --- |
| Step 2 Container | `space-y-6 animate-in fade-in duration-300` within `ListingWizardShell` |
| Context Capsule | `px-2 py-0.5 rounded-md bg-portal-primary/10 text-portal-primary` displaying decoded Year, Make, Model & Trim |
| Odometer Card | `bg-portal-surface border border-portal-border rounded-xl p-5 md:p-6 shadow-xs` with `KM` suffix badge and integer kilometer validation (`100` to `999,999` km) |
| Powertrain Dropdowns | Controlled select inputs for Transmission (Automatic, Manual, CVT, Dual-Clutch) and Drivetrain (AWD, FWD, 4WD, RWD) pre-populated from Step 1 vPIC decode |
| Exterior Color Swatches | Swatch palette (Black, White, Silver, Grey, Blue, Red, Brown, Green, Gold, Custom) with selected ring `border-portal-primary bg-portal-primary/10 text-portal-primary font-semibold shadow-xs` |
| Working Keys Select | 1, 2 (Standard Pair), 3, 4+ keys with `Key` icon indicator |
| Canadian Collision Declaration | Toggle switch revealing claim count and damage description textarea; clean title default |
| Canadian Lien Declaration | Toggle switch with OMVIC compliance disclaimer and financing institution / payout CAD estimate field |
| Form Validation | React Hook Form with `@hookform/resolvers/zod` + `vehicleSpecsFormSchema` validation mode `onChange` |
| Navigation & Retention | "Back to VIN" and "Continue to Condition Map" triggers updating Zustand `specs` state and advancing step |

**Pattern notes:**
- **Canadian Metric Standard:** Exclusively enforces odometer readings in whole kilometers (`km`), preventing US-mile conversion errors.
- **OMVIC Lien Transparency:** Educates sellers that liens are cleared transparently by the purchasing dealership upon escrow payout.
- **Bi-Directional State Retention:** Navigating between Step 1, Step 2, and Step 3 preserves all selected values, swatches, and toggles via `useListingWizardStore`.

---

### `DamageMapperStep & VehicleSchematicSvg` (Milestone 4.2 / Step 3)

Files: `components/seller/wizard/DamageMapperStep.tsx`, `components/seller/wizard/VehicleSchematicSvg.tsx`, `store/useListingWizardStore.ts`  
Last updated: 2026-10-20  
Mode: Autumn Editorial Dual-Theme (Porcelain Ivory `#FFF8F2` Light / Deep Obsidian `#0C0A09` Dark)

| Property | Class / Implementation Pattern |
| --- | --- |
| 5 Viewpoint Tabs | `flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none` with active state `bg-portal-primary text-white font-semibold shadow-xs` and real-time pin count badge pill |
| Interactive SVG Canvas | `relative w-full aspect-16/9 sm:aspect-2/1 bg-portal-surface-hover/60 border border-portal-border rounded-2xl overflow-hidden cursor-crosshair` |
| 5 Automotive Schematics | Precision architectural SVG vectors: Top/Roof (`roof`), Driver Side (`driver_side`), Passenger Side (`passenger_side`), Front Fascia (`front`), and Rear Fascia (`rear`) |
| Hotspot Pin Indicators | Numbered pulsing badges positioned via `(x%, y%)` relative coordinates with severity color tokens (Amber `#E59344` for Minor, Orange `#EA580C` for Moderate, Crimson `#DC2626` for Severe) |
| Configuration Modal | Fixed backdrop modal (`bg-black/60 backdrop-blur-xs flex items-center justify-center p-4`) with 3 severity selector cards, quick panel pills, and description textarea |
| Quick Panel Tags | Context-aware area tags per viewpoint (e.g. "Driver Front Door", "Front Bumper", "Trunk / Liftgate", "Rocker Panel") |
| Declared Hotspots Grid | Responsive card grid (`grid grid-cols-1 sm:grid-cols-2 gap-2.5`) rendering numbered hotspot pills, panel label, severity badge, description, and trash delete action |
| Showroom Condition Action | "Clean Body" quick check allowing sellers with zero exterior damage to proceed with 0 tags |
| State Persistence | Zustand `damageHotspots` array updated with atomic add/update/remove actions and persisted in browser storage |

**Pattern notes:**
- **Wholesale Inspection Accuracy:** Visual 2D pin mapping matches professional dealer condition grading protocols (Manheim / ADESA standards).
- **Interactive Coordinate Normalization:** Coordinates are calculated strictly in relative percentages (`x%, y%`) bounded between 0% and 100%, ensuring pins stay aligned across mobile, tablet, and desktop viewports.
- **Bi-Directional Step Memory:** Navigating forward to Photo Gallery and back retains all placed pins and view selections without data loss.

---

### `PhotoUploadStep` (Milestone 4.2 / Step 4)

Files: `components/seller/wizard/PhotoUploadStep.tsx`, `lib/image-compression.ts`, `app/api/listings/media/presign/route.ts`, `app/api/mock/s3-upload/route.ts`, `store/useListingWizardStore.ts`  
Last updated: 2026-10-20  
Mode: Autumn Editorial Dual-Theme (Porcelain Ivory `#FFF8F2` Light / Deep Obsidian `#0C0A09` Dark)

| Property | Class / Implementation Pattern |
| --- | --- |
| Container | `space-y-6 animate-in fade-in duration-300` within `ListingWizardShell` |
| Quota Badge | Real-time intake counter (`X / 30 Photos`) toggling between amber (`bg-amber-500/10 text-amber-600`) and green (`bg-emerald-500/10 text-emerald-600`) upon reaching 8 photo threshold |
| Recommended Angles | 8 quick-reference pills (`Front 3/4`, `Rear 3/4`, `Odometer Cluster`, `Front Cabin`, `Rear Seats`, `Engine Bay`, `Tires`, `Trunk`) with `Sparkles` icon |
| Direct-to-S3 Dropzone | Drag-and-drop zone (`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer`) with active drag highlight (`border-portal-primary bg-portal-primary/10`) |
| Client-Side Compression | `browser-image-compression` downscaling to max 1920px WebP at 80% quality in web worker thread before network dispatch |
| Privacy Compliance | Automatic client-side EXIF stripping removing GPS coordinates, camera serials, and timestamps |
| Presigned S3 Intake | `POST /api/listings/media/presign` returns pre-authorized S3 PUT ticket avoiding streaming heavy uploads through server memory |
| Gallery Preview Grid | Responsive grid (`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3`) with Next.js image previews, file sizes, and status badges |
| Cover Photo Management | Gold badge (`bg-portal-primary text-white text-[10px] font-bold`) on index 0 photo; 1-click star button to designate cover image |
| Reorder & Removal | Left/Right shift arrows (`ChevronLeft`, `ChevronRight`) and delete trash button with clean hover action overlay |
| Validation Guard | Minimum 8 photo enforcement blocking progression with informative error alert banner |
| Demo Auto-Fill | `load-sample-photos-btn` populates 8 curated high-resolution vehicle showcase photos with all recommended angles for instant previewing |

**Pattern notes:**
- **Zero Server Memory Overhead:** Directly uploads to cloud storage (S3/R2) via client-side signed tickets rather than streaming multipart payloads through Next.js server memory.
- **Privacy Standard (PIPEDA / Law 25):** Cleans location EXIF metadata client-side before any byte leaves the seller's device.
- **Bi-Directional Navigation State:** Photos and cover preferences stay cached in `useListingWizardStore` across step navigation.

---

### `PriceReviewStep` (Milestone 4.2 / Step 5)

Files: `components/seller/wizard/PriceReviewStep.tsx`, `app/api/listings/route.ts`, `store/useListingWizardStore.ts`  
Last updated: 2026-10-20  
Mode: Autumn Editorial Dual-Theme (Porcelain Ivory `#FFF8F2` Light / Deep Obsidian `#0C0A09` Dark)

| Property | Class / Implementation Pattern |
| --- | --- |
| Container | `space-y-6 animate-in fade-in duration-300` within `ListingWizardShell` |
| Vehicle Recap Card | Top summary block displaying cover thumbnail, title (`Year Make Model Trim`), masked VIN, postal location, and 4-pill spec audit bar |
| Wholesale Corridor Engine | Dynamic wholesale valuation corridor (`$XX,XXX – $YY,YYY CAD`) derived from year, mileage degradation, and damage penalties with 1-click median applicator |
| Reserve Currency Mask | Masked integer CAD cents input enforcing integer cents invariant with sealed-bid privacy assurance pill |
| No-Reserve Auction Mode | Segmented pill toggle allowing sellers to list without reserve, informing of 3x dealer bid engagement |
| Canadian Legal Disclosures | OMVIC, AMVIC, and VSA mandatory affirmations: Registered Ownership Attestation, Accurate Condition Disclosure, and Lien Escrow Settlement Authorization |
| 1-Click Accept All | `btn-accept-all-declarations` allowing instant validation of all 3 disclosures with bubble event prevention |
| Moderation Submission | `POST /api/listings` dispatching complete validated listing draft, rendering celebratory success modal with listing ID, status, and dashboard return action |

---

### `SellerActiveAuctionView` (Milestone 4.3 / Page 4.3)

Files: `components/seller/SellerActiveAuctionView.tsx`, `app/api/listings/[id]/route.ts`, `app/(seller)/seller/listings/[id]/page.tsx`  
Last updated: 2026-10-20  
Mode: Autumn Editorial Dual-Theme (Porcelain Ivory `#FFF8F2` Light / Deep Obsidian `#0C0A09` Dark)

| Property | Class / Implementation Pattern |
| --- | --- |
| Hero Telemetry | 24-hour countdown digital clock with hours/minutes/seconds tabular numerals, status badge, and sealed dealer bid count pill |
| Sealed Invariant Guard | Zero dollar bid values exposed while `ACTIVE` — counts only (`N Sealed Dealer Bids`) |
| Simulation Stage Switcher | 3-pill toggle (`Live (24h)`, `Unsealed (Bids Open)`, `Accepted (Voucher)`) allowing instant state previewing during demos |
| High-Res Showcase Strip | Aspect 16:10 primary image canvas with gold Cover Photo badge and clickable horizontal thumbnail ribbon |
| Condition Inspection Panel | Verified damage hotspots audit list detailing panel location, severity tag, and seller notes |
| Verified Specs Matrix | Two-column specifications grid covering transmission, drivetrain, exterior/interior colors, master key count, collision declaration, and lien status |
| Dynamic State CTAs | Contextual transitions: directs to `select-dealer` when unsealed or `appointment` when accepted |

---

### `DealerSelectionView` (Milestone 4.3 / Page 4.4)

Files: `components/seller/DealerSelectionView.tsx`, `app/(seller)/seller/listings/[id]/select-dealer/page.tsx`  
Last updated: 2026-10-20  
Mode: Autumn Editorial Dual-Theme (Porcelain Ivory `#FFF8F2` Light / Deep Obsidian `#0C0A09` Dark)

| Property | Class / Implementation Pattern |
| --- | --- |
| Outcome Header | Summary banner highlighting top unsealed dealer offer in CAD cents and surplus above reserve asking price (`+$X,XXX CAD above reserve`) |
| Faceted Sort Switcher | Sort ladder by "Highest Bid" or "Nearest Dealership (km)" |
| Dealer Credential Cards | Card per unsealed offer rendering dealership name, OMVIC registration badge, star rating, verified reviews, distance in km, and wire payout speed (`1-Day Direct Wire`) |
| Top Offer Badge | Highlighted `#1 Top Certified Offer` ribbon with primary border accent |
| Legal Acceptance Modal | Confirmation modal clarifying legally binding transfer and outlining the subsequent 48-hour physical inspection handover |

---

### `AppointmentVoucherCard` (Milestone 4.3 / Page 4.5)

Files: `components/seller/AppointmentVoucherCard.tsx`, `app/(seller)/seller/listings/[id]/appointment/page.tsx`  
Last updated: 2026-10-20  
Mode: Autumn Editorial Dual-Theme (Porcelain Ivory `#FFF8F2` Light / Deep Obsidian `#0C0A09` Dark)

| Property | Class / Implementation Pattern |
| --- | --- |
| Official Voucher Shell | `border-2 border-portal-primary/40 rounded-3xl p-6 sm:p-10 shadow-xl` with unique alphanumeric pass code (`AN-2026-XXXX-ON`) |
| QR Verification Block | High-contrast QR pass code badge for dealership staff to scan upon vehicle arrival |
| Deal Terms Matrix | 3-card key metrics display: Accepted Purchase Offer in CAD cents, vehicle summary, and 48-hour expiration timestamp |
| Dealership Contact Dossier | Full purchasing desk dossier: physical address, phone, direct email, business hours, and Google Maps directions link |
| Interactive Handover Checklist | Interactive checklist of required physical documents (Ownership green slip, 2 keys, Photo ID, Void cheque for wire disbursement) |
| Print & Export Support | Print stylesheet styles (`no-print` utilities) supporting 1-click clean PDF export or paper printing |

---

### `DealerInventoryFeed` (Milestone 5.2 / Page 5.3)

Files: `components/dealer/DealerInventoryFeed.tsx`, `app/(dealer)/dealer/inventory/page.tsx`, `app/api/dealer/inventory/route.ts`  
Last updated: 2026-10-20  
Mode: FinTech Obsidian Dark / Porcelain Light Dual-Theme (`#0C0A09` / `#FFF8F2`)

| Property | Class / Implementation Pattern |
| --- | --- |
| Trading Floor Grid | Responsive 3-column inventory grid with high data density (`grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5`) |
| Urgency State | Server-synced 24h countdown clocks; sub-15min triggers Canadian Crimson urgency state (`bg-red-600 text-white animate-pulse`) |
| Sealed Invariant | Renders total sealed bids count (`N bids`) with zero live dollar exposure to competitors |
| Faceted Filters | Search query, Make filter, Max Mileage, Max Distance radius, Damage Grade (A/B/C/D), and Sort By options |
| Direct Bid Placement | Integrated 1-click trigger to open `SealedBidSlip` modal with upward revision rule |
| Direct Vehicle Inspection | Link to `/dealer/auctions/[id]` on card image, title, and dedicated Inspect button |

---

### `VehicleInspectionView` (Milestone 5.2 / Page 5.4)

Files: `components/dealer/VehicleInspectionView.tsx`, `app/(dealer)/dealer/auctions/[id]/page.tsx`, `app/api/dealer/inventory/[id]/route.ts`  
Last updated: 2026-10-20  
Mode: FinTech Obsidian Dark / Porcelain Light Dual-Theme (`#0C0A09` / `#FFF8F2`)

| Property | Class / Implementation Pattern |
| --- | --- |
| High-Res Gallery | Aspect 16:9 primary viewport with interactive chevrons, thumbnail strip, and full-screen lightbox zoom mode |
| Condition Hotspots | Disclosed damage hotspot panel list displaying panel names, severity tags (Minor, Moderate, Severe), and photo attachments |
| Decoded NHTSA Specs | 17-char VIN with 1-click clipboard copy, Engine spec, Drivetrain, Transmission, Odometer in KM, Paint codes, Key fobs count |
| Carfax Canadian Title | Accident-free badge, documented service records count, previous owners count, and lien-free disclosure status |
| Sticky Bid Telemetry | Active placed dealer bid in integer CAD cents, sealed total bid count, reserve status, and 1-click trigger for `SealedBidSlip` |

---

### `DealerActiveBidsView` (Milestone 5.3 / Page 5.6)

Files: `components/dealer/DealerActiveBidsView.tsx`, `app/(dealer)/dealer/active-bids/page.tsx`  
Last updated: 2026-10-20  
Mode: FinTech Obsidian Dark / Porcelain Light Dual-Theme (`#0C0A09` / `#FFF8F2`)

| Property | Class / Implementation Pattern |
| --- | --- |
| Exposure Summary | Committed bid volume calculated from integer CAD cents (`formatCadCents`) and active lots count |
| Status Badges | `LEAD_ESTIMATE` (Green leading corridor) vs `OUTBID_ESTIMATE` (Amber/Crimson alert) |
| Urgency Timers | Sub-15min red countdown pulse alerting dealer to raise bid before auction closing |
| 1-Click Upward Revision | "Raise Bid" action directly opening `SealedBidSlip` with upward revision enforcement |
| Filter Tabs | All Placed, Leading Corridor, and Outbid Attention segmented filter pills |

---

### `DealerWonMatchesView` (Milestone 5.3 / Page 5.7)

Files: `components/dealer/DealerWonMatchesView.tsx`, `app/(dealer)/dealer/won-matches/page.tsx`  
Last updated: 2026-10-20  
Mode: FinTech Obsidian Dark / Porcelain Light Dual-Theme (`#0C0A09` / `#FFF8F2`)

| Property | Class / Implementation Pattern |
| --- | --- |
| Unsealed Seller Contact | Full contact dossier: Seller legal name, verified phone number with `tel:` link, email with `mailto:`, and city/province |
| QR Intake Pass | QR code display with voucher pass code for dealership intake desk scanning |
| Handover Outcome Logger | Interactive settlement modal supporting `COMPLETED`, `RENEGOTIATED_LOWER`, `NO_SHOW`, and `DECLINED_AFTER_INSPECTION` |
| Financial Finality | Settlement price stored and displayed in integer CAD cents (`formatCadCents`) with technician inspection notes |

---

### `ListingModerationView` (Milestone 6.1 / Page 6.1)

Files: `components/admin/ListingModerationView.tsx`, `app/(admin)/admin/moderation/page.tsx`  
Last updated: 2026-10-20  
Mode: Super Admin Obsidian / Porcelain Operations Theme

| Property | Class / Implementation Pattern |
| --- | --- |
| Queue Split View | Left pending queue cards with live count; right deep-dive moderation inspector |
| Verification Checklist | VIN decode match, minimum 8 photos check, damage hotspots disclosure review, seller reserve validation |
| Operations Actions | 1-click "Approve & Start 24h Auction", "Request Edits" (with seller SMS/email note modal), or "Reject" (with regulatory code) |

---

### `AdminAuctionsView` (Milestone 6.3 / Page 6.3)

Files: `components/admin/AdminAuctionsView.tsx`, `app/(admin)/admin/auctions/page.tsx`  
Last updated: 2026-10-20  
Mode: Super Admin Obsidian / Porcelain Operations Theme

| Property | Class / Implementation Pattern |
| --- | --- |
| Master Operations Table | Filterable table across `ACTIVE`, `ACCEPTED`, `CANCELLED` auction states with real-time countdown clocks |
| Emergency Time Extensions | Privileged action adding +1h, +2h, +6h, or +24h with mandatory compliance audit note requirement |
| Emergency Lot Kill | Emergency termination button requiring audit trail justification |

---

### `AdminAnalyticsView` (Milestone 6.5 / Page 6.5)

Files: `components/admin/AdminAnalyticsView.tsx`, `app/(admin)/admin/analytics/page.tsx`  
Last updated: 2026-10-20  
Mode: Super Admin Obsidian / Porcelain Operations Theme

| Property | Class / Implementation Pattern |
| --- | --- |
| Executive KPIs | Gross Merchandise Value (GMV in CAD cents), Auction Clearance Rate %, Bidding Velocity (bids/lot), and Consumer Surplus |
| Provincial Breakdown | Ontario (OMVIC), Alberta (AMVIC), British Columbia (VSA), Quebec (OPC) volume bars and dealer counts |
---

### `SellerStatsGrid & SellerDashboard` (Milestone 4.1 UI/UX Polish)

File: `components/seller/SellerStatsGrid.tsx`, `components/seller/SellerDashboard.tsx`  
Last updated: 2026-10-20  
Mode: Modern High-Value Portal Dual-Theme (Unified `#FFFFFF` Light Canvas / `#0C0A09` Dark Canvas)

| Property | Class / Implementation Pattern |
| --- | --- |
| Canvas Background | `bg-white dark:bg-[#0C0A09]` (single color background; `#FFF8F2` outer border framing removed) |
| Container Width | `w-full max-w-[1600px] mx-auto py-2 sm:py-4 space-y-7` (expansive layout, zero wasted side space) |
| Top Stats Bar | Unified container `rounded-2xl border border-portal-border bg-portal-surface p-4 sm:p-6 shadow-xs` |
| Stats Grid Columns | `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0 lg:divide-x divide-portal-border` |
| Stats Content Layout | Side-by-side flex row `flex items-center justify-between gap-4`: text on left, big icon on right |
| Phosphor Icons | Large `w-8 h-8 sm:w-9 sm:h-9` (`CurrencyDollar`, `Gavel`, `CheckCircle`, `Clock`) in amber/orange `#E59344` |
| Icon Background | **Zero rounded background circle** — clean, naked large icons directly adjacent to telemetry |
| Metric Telemetry | Label: `font-mono text-[11px] font-bold uppercase tracking-wider text-portal-text-muted`; Value: `font-headline text-2xl sm:text-3xl font-bold text-portal-text` |
| Trend Subtitles | Green indicator with `TrendUp` icon: `text-emerald-600 dark:text-emerald-400 font-medium text-xs` |
| Primary CTA Button | Vibrant amber/wine pill `bg-[#8C383E] dark:bg-[#E59344] text-white px-5 py-2.5 rounded-xl font-bold` (`+ LIST NEW VEHICLE`) |
| Search & Filter Bar | Full-width search input with `MagnifyingGlass` + filter pills (`All Listings`, `Live 24h Floor`, `Under Review`, `Sold`) |
| View Mode Toggle | Dual layout toggle: Grid view (`SquaresFour`) vs List view (`List`) with responsive cards |
| Collapsed Rail Hover | Clean naked icons with active left accent bar (`absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-[#8C383E] dark:bg-[#E59344]`), zero circular bubble backgrounds, and dual-theme `SidebarFlyout` |

**Pattern notes:**
- Single color background invariant: `--portal-canvas` set to `#FFFFFF` in light mode, ensuring seamless continuity with cards and sidebar with zero `#FFF8F2` double-borders.
- Side-by-side metric layout with naked large Phosphor icons establishes the modern financial dashboard aesthetic.

---

### `SellerNotifications & Professional Navigation` (Milestone 4.1 UI/UX Polish #2)

Files: `components/seller/SellerNotificationDropdown.tsx`, `app/(seller)/seller/notifications/page.tsx`, `components/layout/Sidebar.tsx`, `app/layout.tsx`  
Last updated: 2026-10-20  
Mode: Modern Enterprise High-Contrast Portal

| Property | Class / Implementation Pattern |
| --- | --- |
| Typography Engine | `next/font/google` with `Epilogue` (`--font-headline`), `Plus Jakarta Sans` (`--font-body`), `JetBrains Mono` (`--font-mono`) |
| Sidebar Active Route | `bg-neutral-100 dark:bg-white/[0.08] text-neutral-900 dark:text-white font-semibold rounded-lg px-3 py-2` (zero pink sausage bubbles) |
| Sidebar Sub-Item Active | `text-[#8C383E] dark:text-[#E59344] font-semibold bg-[#8C383E]/5 dark:bg-[#E59344]/10 rounded-md px-2.5 py-1.5` |
| Notification Bell Button | Header icon button with animated unread badge ping (`SellerNotificationDropdown`) above the search bar |
| Notification Popover | Floating card `w-80 sm:w-96 rounded-2xl bg-white dark:bg-[#131215] border border-portal-border shadow-2xl` |
| Dedicated Alert Center | Full-page management at `/seller/notifications` with filter pills (`All`, `Unread`, `Bids`, `System`), bulk mark as read, and clear actions |
| Clean Listings Floor | Full-width 3-column responsive grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`); side cards removed for an uncluttered, valued layout |

---

### `SellerAuctionCard` Signature Notched Card (Milestone 4.1 Signature Geometry & Brand Logos)

File: `components/seller/SellerAuctionCard.tsx`  
Last updated: 2026-10-20  
Mode: Signature Architectural Portal Card (Naked Brand Icons + Pure White `#FFFFFF` Light Canvas / `#121212` Dark Canvas + DiscoverSection Pocket Notch)

| Property | Class / Implementation Pattern |
| --- | --- |
| Card Geometry | `rounded-tl-[32px] rounded-tr-[32px] rounded-bl-[32px] rounded-br-none p-4 sm:p-5 flex flex-col justify-between relative` with masked shadow layer (`maskImage: radial-gradient(circle at bottom right...)`); square bottom-right corner completely housed under pocket |
| Background | Light: `bg-white` card on `bg-white` canvas; Dark: `dark:bg-[#1E1E1E]` card on `dark:bg-[#121212]` canvas |
| Border | `border border-gray-200/90 dark:border-white/10 hover:-translate-y-1` (zero conflicting colored borders on hover) |
| Top Header Row | Flex row above photo canvas: left direct automaker logo icon (`w-8 h-8 flex items-center justify-center shrink-0` with authentic brand emblem, zero separate background bubble or border), middle headline (`font-headline text-[15px] sm:text-base font-bold`) & subhead (`font-body text-[11px] text-portal-text-muted`), and right status beacon pill |
| Automaker Brand Logos | Direct naked icons mapped from `public/car-company-logos/` (Toyota: `image_16 - Copy.png`, Jeep: `image_15.png`, Ford: `image_14.svg`, Honda: `image_12.png`, Polestar: `image_11.png`, Mitsubishi: `image_10.png`, Hyundai: `image_09.png`, Cadillac: `image_13.png`) with `dark:brightness-0 dark:invert` |
| Telemetry Status Pill | Compact institutional pill: Active: emerald beacon pulse + `X Bids`; Completed: neutral chip + `Sold`; Review: amber chip + `Review` |
| Photo Canvas | `rounded-[24px] overflow-hidden relative h-60 sm:h-64 w-full bg-neutral-100 dark:bg-white/[0.04]` (clean, unencumbered, unobstructed hero car photography) |
| Card Body & Specs | Stacked specs: mileage, transmission, fuel type, VIN, and verified Carfax badge (`CheckCircle`) |
| Bottom Pricing | Bold reserve asking CAD (`font-headline text-xl sm:text-2xl font-black`) + institutional status chip (`ArrowUpRight`) |
| Docked Concave Notch | Exact DiscoverSection landing page pocket: `w-[78px] h-[78px] bg-white dark:bg-[#121212] rounded-tl-[26px] border-t border-l border-gray-200/90 dark:border-white/10` with two 20×20px fillet curve SVGs (`fill-white dark:fill-[#121212]`) smoothly transitioning from card right and bottom walls into pocket |
| Docked Action Squircle | `w-[52px] h-[52px] rounded-[18px] bg-white dark:bg-[#202020] border border-gray-200/90 dark:border-white/15 shadow-[0_4px_14px_rgba(0,0,0,0.08)]` centered in pocket with uniform 13px channel cushion |
| Action Button Hover | `hover:bg-[#8C383E] hover:text-white dark:hover:bg-[#E59344] dark:hover:text-[#121212] active:scale-95` with `ArrowUpRight` translation |
| Grid Container Layout | `w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 lg:gap-6` — accommodates 4 cards per row across full desktop width with balanced spacing |

**Pattern notes:**
- **Naked Automaker Icons:** Direct automaker logo icons without enclosing circular bubble borders or background tints, keeping the header clean and modern.
- **Pure White Light Canvas (`#FFFFFF`):** High-clarity white background requested for light mode across web app layouts.
- **Sophisticated Charcoal Dark Canvas (`#121212`):** Modern `#121212` dark background paired with `#1E1E1E` elevated cards and matching `#121212` pocket cutout fills.
- **Clean Hover Mechanics:** Removed conflicting `hover:border-...` on the card perimeter so the bottom-right notch maintains seamless corner alignment during mouseover without amber border lines leaking through.

---

### `SellerAuctionCard Status Chip` (Milestone 4.1 Neutral Invariant — Zero Green Backgrounds)

Files: `components/seller/SellerAuctionCard.tsx`, `components/marketing/DiscoverSection.tsx`, `components/seller/KycStatusBanner.tsx`  
Last updated: 2026-10-20  
Mode: Institutional Modern High-Contrast Neutral

| Property | Class / Implementation Pattern |
| --- | --- |
| Status Countdown Chip | `bg-neutral-100 dark:bg-white/[0.08] text-neutral-800 dark:text-neutral-200 border-gray-200 dark:border-white/10` (Strictly eliminated `bg-[#16271E]` and saturated green backgrounds) |
| Active Telemetry Pill | `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-white/[0.08] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-neutral-100` with subtle brand pulse indicator (`bg-[#8C383E] dark:bg-[#E59344]`) |
| Verification Banner | `rounded-2xl border border-gray-200/90 dark:border-white/10 bg-white dark:bg-[#1E1E1E] px-4 py-3 font-body text-xs sm:text-sm text-gray-900 dark:text-neutral-100 shadow-2xs` (neutral container with subtle check icon) |

---

### `ListingWizardShell & Stepper` (Milestone 4.1 Expansive Container Architecture)

File: `components/seller/wizard/ListingWizardShell.tsx`  
Last updated: 2026-10-20  
Mode: Modern Enterprise Wizard Shell

| Property | Class / Implementation Pattern |
| --- | --- |
| Max Width Boundary | Expanded from narrow `max-w-2xl` to modern expansive `max-w-5xl` (`px-4 sm:px-6 py-6 md:py-8`) across header, progress track, and `<main>` content |
| Header Navigation | Sticky top header with blurred background (`bg-portal-surface/90 backdrop-blur-md border-b border-portal-border`), back button, step metadata, and save-and-exit trigger |
| Linear Stepper Track | 5-step grid (`grid grid-cols-5 gap-2`) with active bar indicator (`bg-portal-primary shadow-sm`), completed bar (`bg-portal-primary/60`), and step labels with `Check` icons |
| Side Spacing Parity | Eliminates excessive negative side gutters on wide desktop monitors, providing optimal breathing room for car schematics and multi-column photo galleries |

---

### `VinDecodeStep & Vehicle Summary` (Milestone 4.1 Human-Centered Copy & Vertical Flow)

File: `components/seller/wizard/VinDecodeStep.tsx`  
Last updated: 2026-10-20  
Mode: Friendly Non-Technical Intake Flow

| Property | Class / Implementation Pattern |
| --- | --- |
| Copy Tone | Plain, approachable language ("Vehicle Details", "Find Vehicle Details", "Vehicle Identified") without developer jargon like "NHTSA vPIC auto-decode" or "ISO 3779 checksum test" |
| Icons | Automotive and action icons (`Car`, `MapPin`, `CheckCircle2`, `HelpCircle`); zero AI sparkle icons |
| Vehicle Specs Summary | Vertical specification list (`divide-y divide-portal-border-subtle border-t border-b border-portal-border-subtle text-xs`) replacing 6 repetitive boxed cards; eliminates truncated card text |
| Form Controls | Clean monospaced inputs with clear counter (`17/17`), real-time check indicator, and unobtrusive location helper |

---

### `DamageMapperStep` (Milestone 4.1 Simplified Vehicle Condition Flow)

File: `components/seller/wizard/DamageMapperStep.tsx`  
Last updated: 2026-10-20  
Mode: Intuitive Condition Tagging

| Property | Class / Implementation Pattern |
| --- | --- |
| Title & Instructions | "Mark Any Scratches or Dents" — clear, concise instructions for regular car owners |
| Clean Body Banner | Subtle container with `CheckCircle2` ("No cosmetic flaws on your car? You can proceed with 0 tags for clean showroom condition") — completely replaced AI sparkles |
| Interactive Schematic | 5 perspective views (`roof`, `driver_side`, `passenger_side`, `front`, `rear`) with pin placing, severity selection, and damage area labeling |

---

### `PhotoUploadStep` (Milestone 4.1 Asymmetric Hero Gallery & Wireframe Architecture)

File: `components/seller/wizard/PhotoUploadStep.tsx`  
Last updated: 2026-10-20  
Mode: Asymmetrical Hero + Secondary Thumbnail Grid

| Property | Class / Implementation Pattern |
| --- | --- |
| Recommended Angles Checklist | Clean 4-column checklist (`grid grid-cols-2 sm:grid-cols-4 gap-2 text-portal-text-muted text-[11px]`) with subtle bullets, replacing nested chips and AI sparkle icons |
| Hero Asymmetric Split | 12-column desktop grid: Left column (`lg:col-span-7`) hosts Big Cover Photo (`h-72 sm:h-80 md:h-[370px]`); Right column (`lg:col-span-5`) hosts 2-column secondary thumbnail grid |
| Extreme Top-Right Upload Slot | Slot #2 in right-side grid is the interactive `+ Upload More` dropzone tile (`border-2 border-dashed border-portal-primary/50 bg-portal-primary/5 hover:bg-portal-primary/10`) |
| Secondary Thumbnails | Numbered thumbnail cards (`#2`, `#3`, `#4`) with star (set as cover) and delete hover actions |
| Lower Photo Grid | Additional photos (`#5`, `#6`, `#7`, etc.) flow cleanly in a grid directly underneath the left cover photo |
| Empty Wireframe Frame | When 0 photos are uploaded, renders the exact same split geometry: Large left Cover Photo dropzone (`Main Cover Photo`) + right 2-column placeholder slots with `+ Upload More` in extreme top right |
| Non-Technical Reassurance | Friendly copy: "Photos are securely protected. Location data is removed for your privacy." |
