# Code Standards: Car Auction Marketplace Platform (CAMP)

Implementation rules and conventions for the entire project. The AI agent must follow these in every session without exception. These rules prevent pattern drift across sessions.

---

## Engineering Mindset

The AI agent on this project operates as a senior engineer. This means:

- **Think before implementing** — understand what is being built and why before writing a single line.
- **Read context files first** — never assume, always verify against `architecture.md` and `project-overview.md`.
- **Scope is sacred** — only build what the current feature requires. Never go beyond scope even if it seems helpful.
- **Clean over clever** — simple readable code that a junior developer can understand is always preferred over clever abstractions.
- **No Floating Point Currency** — All Canadian Dollar amounts are processed, stored, and mutated as **integer cents**.

---

## TypeScript Rules

- Strict mode enabled in `tsconfig.json` — no exceptions.
- Never use `any` — use `unknown` and narrow the type, or define a strict `zod` schema.
- Never use type assertions (`as SomeType`) unless absolutely necessary and commented why (e.g., when narrowing standard DOM Events).
- All function parameters and return types must be explicitly typed.
- Use `type` for object shapes and API payloads — use `interface` only for extendable component props.

---

## Next.js 15 Conventions

- **App Router only** — no Pages Router.
- **Server Components by Default** — Keep components on the server unless interactivity is explicitly required.
- **Only add `"use client"` when the component requires:**
  - `useState`, `useReducer`, or `useEffect`.
  - Browser APIs (e.g., `window`, `navigator`).
  - Event listeners (`onClick`, `onChange`).
  - Access to Zustand (`useStore`) or TanStack Query (`useQuery`, `useMutation`).
- **Data Fetching:**
  - Server Components: Use native `fetch` with Next.js caching options.
  - Client Components: Use TanStack Query exclusively. Never fetch in a bare `useEffect`.
- **No Server Actions for API Mutations:** Our backend is a decoupled Node.js/Express REST API. We use TanStack `useMutation` pointing to our Next.js API route proxies or directly to the backend. We do not use Next.js Server Actions (`"use server"`) for standard CRUD.

---

## File and Folder Naming

- **Folders:** kebab-case — `list-car`, `won-auctions`, `components`.
- **Component files:** PascalCase — `BidSubmissionForm.tsx`, `AuctionTimer.tsx`.
- **Hook files:** camelCase starting with `use` — `useAuctionDetails.ts`, `useListingWizardStore.ts`.
- **Utility files:** camelCase — `api-client.ts`, `vpic-decoder.ts`.
- **One component per file** — never export multiple React components from one file unless they are strictly sub-components only used by the default export.
- **Index files** — Use `index.ts` only in `components/ui/` for barrel exports. Avoid massive barrel exports in feature folders.

---

## Component Structure

Every component must follow this exact structural order:

```tsx
'use client'; // Only if needed

// 1. External dependencies
import { useState } from 'react';
import { useTranslations } from 'next-intl';

// 2. Internal UI & Hook imports
import { Button } from '@/components/ui/button';
import { useAuctionDetails } from '@/hooks/useAuctionDetails';
import { formatCAD } from '@/lib/currency';

// 3. Type definitions (Props)
interface Props {
  listingId: string;
  isHighContrast?: boolean;
}

// 4. Component Definition
export function BidTelemetryCard({ listingId, isHighContrast = false }: Props) {
  // A. Hooks (Translations, Query, Zustand)
  const t = useTranslations('Auction');
  const { data, isLoading } = useAuctionDetails(listingId);
  
  // B. Local State
  const [isExpanded, setIsExpanded] = useState(false);

  // C. Derived State / Handlers
  const handleExpand = () => setIsExpanded(!isExpanded);

  // D. Render (Early returns first)
  if (isLoading) return <TelemetrySkeleton/>;
  if (!data) return null;

  return (
    <div className={`p-4 ${isHighContrast ? 'bg-surface-dark' : 'bg-surface-light'}`}>
      {/* JSX goes here */}
    </div>
  );
}
```

- Never use default exports for components — always use named exports to ensure exact refactoring across the codebase.
- Props type is defined directly above the component — not in a separate types file unless shared across multiple files.

---

## API & Fetch Conventions

All API calls must use the centralized `api-client.ts` wrapper. Never use raw `fetch` or `axios` directly in components.

```typescript
// src/hooks/useSubmitBid.ts
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { auctionKeys } from '@/lib/query-keys';

export function useSubmitBid(listingId: string) {
  return useMutation({
    mutationFn: async (amountCents: number) => {
      // API client automatically handles JWT attachment and Error unwrapping
      const res = await api.post(`/api/listings/${listingId}/bids`, { amountCents });
      if (!res.success) throw new Error(res.error);
      return res.data;
    }
  });
}
```

---

## Currency & Math Invariants (CRITICAL)

Because this is a financial auction platform, standard JavaScript floating-point errors (e.g., `0.1 + 0.2 = 0.30000000000000004`) will destroy bids.

- **Storage & Transport:** ALL monetary values are stored in Zustand, transmitted via TanStack Query, and sent to the API as **integer cents**. (e.g., `$42,500.00` = `4250000`).
- **UI Inputs:** Users type standard decimals (`42500.50`). Zod schemas immediately transform this string into an integer (`Math.round(parseFloat(val) * 100)`) before it hits any local state or API.
- **UI Display:** Use a dedicated formatter to convert cents back to a localized CAD string before rendering.

```typescript
// src/lib/currency.ts
export function formatCentsToCAD(cents: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 0, // Auctions rarely use cents, keep UI clean
    maximumFractionDigits: 0,
  }).format(cents / 100);
}
```

---

## Error Handling

- Never use empty `catch` blocks. Always log the error or handle it.
- **Client UI Errors:** Never expose raw API stack traces to the UI. Map backend errors to human-readable strings via `next-intl` (e.g., `t('errors.bidRejected')`).
- **Form Errors:** Use React Hook Form's `setError` to bind API validation failures directly to the offending input fields.

---

## Import Aliases

Always use the `@/` alias mapped to the `src/` directory. Never use relative imports that go up more than one level.

```typescript
// Correct
import { Button } from '@/components/ui/button';
import { formatCentsToCAD } from '@/lib/currency';

// Never
import { Button } from '../../../components/ui/button';
```

---

## Dependencies

Never install a new package without explicit justification.

Approved dependencies for this project:

- `next`, `react`, `react-dom`
- `@tanstack/react-query` — Server state
- `zustand` — Client state
- `react-hook-form`, `@hookform/resolvers/zod`, `zod` — Forms and Validation
- `next-intl` — Bilingual localization
- `browser-image-compression` — S3 photo compression/EXIF stripping
- `tailwindcss`, `lucide-react`, `clsx`, `tailwind-merge` — Styling & UI
- Radix UI primitives (`@radix-ui/react-*`) — Accessible headless components

Do not install any other packages without updating this list first.
