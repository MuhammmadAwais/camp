# UI Tokens: AutoNexa & CAMP Platform

Design tokens engineered for the AutoNexa Canadian wholesale vehicle marketplace.
These tokens unite two core domains:
1. **The Public Marketing & Landing Experience (AutoNexa):** Powered by the **Autumn Editorial** design system specified in [DESIGN (3).md](file:///c:/Users/Prime/OneDrive/Documents/Office/Office%20Projects/camp/DESIGN%20%283%29.md) — rich terracotta wine, honey amber, warm oat canvas, and editorial typography.
2. **The High-Velocity Auction Portals (Seller / Dealer):** Institutional FinTech density, dual-mode (Porcelain Light vs. Obsidian Dark), and monospaced auction telemetry.

Never hardcode hex values or use raw Tailwind color classes (e.g. `bg-blue-500`) in components. Use these exact token classes throughout the codebase.

---

## How to Use (Tailwind CSS v4)

All design tokens are declared in `@theme` in `app/globals.css`.
Tailwind v4 automatically generates utility classes from these tokens:
- `--color-primary` → `bg-primary`, `text-primary`, `border-primary`
- `--color-secondary` → `bg-secondary`, `text-secondary`, `border-secondary`
- `--color-surface` → `bg-surface`, `text-on-surface`
- `--font-headline` → `font-headline` (Epilogue)
- `--font-body` → `font-body` (Plus Jakarta Sans)
- `--font-mono` → `font-mono` (JetBrains Mono)

---

## globals.css — Complete `@theme` Definition

```css
@import "tailwindcss";

@theme {
  /* ========================================================
     TYPOGRAPHY FONTS
     ======================================================== */
  --font-headline: "Epilogue", serif;
  --font-body: "Plus Jakarta Sans", sans-serif;
  --font-mono: "JetBrains Mono", monospace;

  /* ========================================================
     AUTUMN EDITORIAL PALETTE (AutoNexa Landing & Marketing)
     ======================================================== */
  /* Surfaces & Canvas */
  --color-surface: #FFF8F2;
  --color-surface-dim: #E4D8C8;
  --color-surface-bright: #FFF8F2;
  --color-surface-container-lowest: #FFFFFF;
  --color-surface-container-low: #FEF2E1;
  --color-surface-container: #F8ECDB;
  --color-surface-container-high: #F3E7D6;
  --color-surface-container-highest: #EDE1D0;
  --color-surface-variant: #EDE1D0;
  --color-background: #FFF8F2;

  /* On-Surfaces (Text & Content) */
  --color-on-surface: #201B11;          /* Espresso plum / Deep dark contrast */
  --color-on-surface-variant: #554242;  /* Muted descriptive taupe */
  --color-on-background: #201B11;
  --color-inverse-surface: #363024;
  --color-inverse-on-surface: #FBEFDE;

  /* Primary Brand (Terracotta / Burgundy Wine) */
  --color-primary: #8C383E;             /* Authoritative wine (Pantone 2350 U) */
  --color-primary-hover: #752B30;       /* Deeper plum-wine for button hover */
  --color-primary-container: #8C383E;
  --color-on-primary: #FFFFFF;
  --color-on-primary-container: #FFB5B6;
  --color-inverse-primary: #FFB3B4;
  --color-primary-fixed: #FFDADA;
  --color-primary-fixed-dim: #FFB3B4;
  --color-on-primary-fixed: #40000B;
  --color-on-primary-fixed-variant: #7B2B32;

  /* Secondary Accent (Warm Honey Amber) */
  --color-secondary: #E59344;           /* Warm honey amber (Pantone P 14-8 U) */
  --color-secondary-container: #FEA857;
  --color-on-secondary: #FFFFFF;
  --color-on-secondary-container: #723E00;
  --color-secondary-fixed: #FFDCC1;
  --color-secondary-fixed-dim: #FFB778;
  --color-on-secondary-fixed: #2E1500;
  --color-on-secondary-fixed-variant: #6C3A00;

  /* Tertiary Tone (Toasted Almond) */
  --color-tertiary: #DDA77B;            /* Muted toasted almond */
  --color-tertiary-container: #734A26;
  --color-on-tertiary: #FFFFFF;
  --color-on-tertiary-container: #F4BC8F;
  --color-tertiary-fixed: #FFDCC2;
  --color-tertiary-fixed-dim: #F3BB8E;
  --color-on-tertiary-fixed: #2E1500;
  --color-on-tertiary-fixed-variant: #643E1B;

  /* Borders & Outlines */
  --color-outline: #887272;
  --color-outline-variant: #DAC0C0;
  --color-border-card: #EADDCB;
  --color-border-ghost: rgba(140, 56, 62, 0.12);

  /* Status & Feedback */
  --color-success: #4D6846;             /* Earthy sage */
  --color-warning: #E59344;             /* Honey amber */
  --color-error: #BA1A1A;               /* Crimson berry */
  --color-on-error: #FFFFFF;
  --color-error-container: #FFDAD6;
  --color-on-error-container: #93000A;

  /* ========================================================
     AUCTION PORTAL TELEMETRY TOKENS (Wholesale Floor)
     ======================================================== */
  --color-canvas-light: #FAFBFC;        /* Porcelain: Seller app */
  --color-canvas-dark: #080C14;         /* Obsidian: Dealer terminal */
  --color-surface-light: #FFFFFF;
  --color-surface-dark: #0E1420;
  --color-track-light: #F1F5F9;
  --color-track-dark: #162032;

  --color-brand-primary: #0B2545;       /* Deep Cobalt Navy */
  --color-brand-electric: #3B82F6;      /* Electric Cobalt */
  --color-brand-crimson: #E63946;       /* Urgent countdown / Canadian Crimson */
  --color-brand-neon-crimson: #FF4D4D;  /* Dark mode urgency pulse */

  /* Canadian Regulatory Badges */
  --color-badge-omvic: #3B82F6;        /* Ontario */
  --color-badge-amvic: #64748B;        /* Alberta */
  --color-badge-vsa: #10B981;          /* British Columbia */

  /* ========================================================
     PORTAL & WEB APP DESIGN SYSTEM (Porcelain / Obsidian & Racing Emerald)
     ======================================================== */
  /* Porcelain Light Mode Tokens */
  --color-portal-canvas: #F8FAFC;
  --color-portal-surface: #FFFFFF;
  --color-portal-surface-hover: #F1F5F9;
  --color-portal-border: #E2E8F0;
  --color-portal-border-subtle: rgba(226, 232, 240, 0.7);
  --color-portal-text: #0F172A;
  --color-portal-text-muted: #64748B;

  /* Obsidian Dark Mode Tokens */
  --color-portal-dark-canvas: #080C14;
  --color-portal-dark-surface: #0E1420;
  --color-portal-dark-surface-hover: #162032;
  --color-portal-dark-border: rgba(255, 255, 255, 0.08);
  --color-portal-dark-border-subtle: rgba(255, 255, 255, 0.04);
  --color-portal-dark-text: #F8FAFC;
  --color-portal-dark-text-muted: #94A3B8;

  /* Racing Emerald Palette */
  --color-emerald-50: #ECFDF5;
  --color-emerald-100: #D1FAE5;
  --color-emerald-200: #A7F3D0;
  --color-emerald-300: #6EE7B7;
  --color-emerald-400: #34D399;
  --color-emerald-500: #10B981;         /* Dark mode primary accent */
  --color-emerald-600: #059669;         /* Light mode primary accent */
  --color-emerald-700: #047857;
  --color-emerald-800: #065F46;
  --color-emerald-900: #064E3B;
  --color-emerald-950: #022C22;

  --color-portal-primary: #15803D;
  --color-portal-primary-hover: #166534;
  --color-portal-primary-tint: rgba(22, 163, 74, 0.10);

  --color-portal-dark-primary: #10B981;
  --color-portal-dark-primary-hover: #059669;
  --color-portal-dark-primary-tint: rgba(16, 185, 129, 0.15);

  /* Glassmorphic Auth Tokens (why-us.webp backdrop) */
  --color-glass-card-bg: rgba(9, 13, 22, 0.82);
  --color-glass-card-border: rgba(255, 255, 255, 0.10);
  --color-glass-input-bg: rgba(255, 255, 255, 0.04);
  --color-glass-input-border: rgba(255, 255, 255, 0.08);
  --color-glass-input-focus: rgba(16, 185, 129, 0.60);

  /* ========================================================
     BORDER RADII
     ======================================================== */
  --radius-xs: 0.25rem;                 /* 4px: Chips, badge tags */
  --radius-sm: 0.5rem;                  /* 8px: Standard inputs, buttons */
  --radius-md: 0.75rem;                 /* 12px: Interactive controls */
  --radius-lg: 1rem;                    /* 16px: Content cards */
  --radius-xl: 1.5rem;                  /* 24px: Hero containers & modals */
  --radius-2xl: 2rem;                   /* 32px: Auth floating glassmorphic container */
  --radius-full: 9999px;                /* Pills, avatar circles */

  /* ========================================================
     ELEVATION & SHADOWS
     ======================================================== */
  --shadow-ambient-warm: 0 16px 32px -4px rgba(56, 20, 24, 0.08);
  --shadow-ambient-card: 0 4px 20px -2px rgba(56, 20, 24, 0.05);
  --shadow-glass-card: 0 25px 60px -15px rgba(0, 0, 0, 0.85);
  --shadow-emerald-glow: 0 0 25px -4px rgba(16, 185, 129, 0.35);
}
```

---

## Semantic Token Mapping for Landing Page Components

| Element | CSS Classes | Description |
| :--- | :--- | :--- |
| **Page Background** | `bg-surface text-on-surface` | Soft, warm ivory canvas (`#FFF8F2`) eliminating glare |
| **Elevated Card** | `bg-surface-container-lowest border border-border-card shadow-ambient-card rounded-lg` | Crisp ivory card on warm canvas |
| **Layered Container** | `bg-surface-container rounded-xl` | Paced section shift or sunken container (`#F8ECDB`) |
| **Primary Button** | `bg-primary text-white hover:bg-primary-hover rounded-sm font-body font-semibold px-6 py-3 transition-colors` | Terracotta wine pill/button |
| **Secondary Button** | `border-1.5 border-primary text-primary hover:bg-primary/5 rounded-sm font-body font-semibold px-6 py-3 transition-colors` | Outlined wine button |
| **Accent / Conversion CTA** | `bg-secondary text-on-surface hover:bg-secondary/90 rounded-sm font-body font-semibold px-6 py-3 transition-colors` | Warm honey amber high-energy CTA |
| **Section Eyebrow** | `font-body text-xs font-bold tracking-widest uppercase text-secondary` | Honey amber section tag |
| **Display Headline** | `font-headline font-bold text-on-surface tracking-tight` | Epilogue editorial headline |
| **Body Text** | `font-body text-on-surface-variant leading-relaxed` | Plus Jakarta Sans readable text |
| **Live Telemetry / VIN** | `font-mono text-primary font-semibold tracking-wide` | Monospaced jitter-free readout |

---

## Semantic Token Mapping for Portal & Auth Components

| Element | CSS Classes | Description |
| :--- | :--- | :--- |
| **Auth Viewport Canvas** | `relative min-h-screen bg-black overflow-hidden flex items-center justify-center p-4` | Full-screen container over `why-us.webp` |
| **Auth Glassmorphic Card** | `w-full max-w-md backdrop-blur-2xl bg-glass-card-bg border border-glass-card-border shadow-glass-card rounded-2xl p-6 sm:p-8` | Translucent frosted container |
| **Auth Segmented Tab (Active)** | `bg-white/10 text-white font-body font-semibold shadow-sm rounded-full py-1.5 px-4` | Pill indicator for Sign In / Sign Up |
| **Auth Segmented Tab (Inactive)** | `text-neutral-400 hover:text-white font-body font-medium transition-colors py-1.5 px-4` | Inactive tab state |
| **Auth Input Field** | `w-full bg-glass-input-bg border border-glass-input-border focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-white placeholder:text-neutral-500 rounded-xl px-4 py-3 text-sm transition-all` | Frosted input with emerald focus |
| **Auth Primary Action Button** | `w-full bg-white text-slate-950 hover:bg-neutral-100 font-body font-semibold py-3 px-4 rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.12)] transition-all active:scale-[0.99]` | High-contrast white CTA |
| **Auth Social Button** | `w-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white font-body font-medium py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-3` | Google OAuth dark glass button |
| **Portal Canvas (Light)** | `bg-portal-canvas text-portal-text min-h-screen` | Clean Slate 50 workspace |
| **Portal Canvas (Dark)** | `dark:bg-portal-dark-canvas dark:text-portal-dark-text min-h-screen` | Deep Obsidian terminal |
| **Portal Primary Action** | `bg-portal-primary hover:bg-portal-primary-hover text-white dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-slate-950 font-semibold rounded-lg px-4 py-2.5 transition-colors` | Racing Emerald action button |
| **Live Telemetry & Timer** | `font-mono tabular-nums font-semibold text-emerald-600 dark:text-emerald-400` | Jitter-free currency/clock readout |

