# UI Registry: Car Auction Marketplace Platform (CAMP)

This is a **Living Document**[cite: 23]. It serves as the single source of truth for all built UI components to prevent design drift across chat sessions and API boundaries.

---

## Agent Instructions: How to Use This Registry

**BEFORE building any new component:**
1. Check this registry. Does a component for this exact purpose already exist[cite: 23]?
2. If YES: Import it. Match its exact props and CSS classes[cite: 23]. Do not invent a variation.
3. If NO: Build the component strictly following `ui-tokens.md` and `ui-rules.md`[cite: 23].

**AFTER building any new reusable component:**
1. You MUST update this file by appending the component's documentation[cite: 23].
2. Use the exact formatting template provided below.
3. Explicitly state how the component handles Light Mode (Seller) vs. Dark Mode (Dealer).

---

## Component Documentation Template

Use this format when logging new components:

### `ComponentName`
- **Path:** `src/components/...`
- **Description:** Brief purpose of the component.
- **Props:** `{ propName: type, ... }`
- **Base Classes:** The exact core Tailwind classes used.
- **Mode Behavior:** 
  - *Light (Seller):* e.g., `bg-surface-light text-text-main`
  - *Dark (Dealer):* e.g., `dark:bg-surface-dark dark:text-text-dark-main`

---

## Registered Components

*(This section will grow as the project is built. Agents: Append new components below this line.)*

### `PrimaryButton` (Example Template)
- **Path:** `src/components/ui/PrimaryButton.tsx`
- **Description:** Main action trigger for form submissions and bidding.
- **Props:** `{ children: ReactNode, onClick?: () => void, isLoading?: boolean, isUrgent?: boolean }`
- **Base Classes:** `rounded-sm px-4 py-2 font-mono text-sm font-bold transition-colors disabled:opacity-50`
- **Mode Behavior:**
  - *Standard Light:* `bg-brand-primary text-white hover:bg-brand-primary/90`
  - *Standard Dark:* `dark:bg-brand-electric dark:text-white dark:hover:bg-brand-electric/90`
  - *Urgent (`isUrgent`):* `bg-brand-crimson dark:bg-brand-neon-crimson`

### `CADCurrencyInput` (Example Template)
- **Path:** `src/components/shared/CADCurrencyInput.tsx`
- **Description:** Uncontrolled form input for CAD bids/asking prices. Transforms to integer cents.
- **Props:** `{ ...useFormRegisterReturn }`
- **Base Classes:** `w-full rounded-sm border pl-16 pr-3 py-2 font-mono text-sm focus:outline-none`
- **Mode Behavior:**
  - *Light:* `bg-track-light border-border-hairline text-text-main focus:ring-1 focus:ring-brand-primary`
  - *Dark:* `dark:bg-track-dark dark:border-border-dark dark:text-text-dark-main dark:focus:ring-brand-electric`