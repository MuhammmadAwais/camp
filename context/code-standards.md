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
- **No Server Actions for API Mutations:** All mutations run through TanStack `useMutation` calling `app/api/**` Route Handlers via `lib/api-client.ts`. Do not use Next.js Server Actions (`"use server"`) for standard CRUD — keeping `/api/*` REST contracts explicit, testable, and portable for Senior Engineer review.

---

## Backend & Server Architecture Rules (`app/api/**` & `lib/server/**`)

Every backend file built on `feat/supabase-backend` MUST follow these production system-design standards:

1. **Strict Layer Separation:**
   - `app/api/**/route.ts` — Thin HTTP controllers only: parse/validate input with Zod, check auth/RBAC, delegate to a service, return standardized JSON. Zero business logic or raw SQL inside route files.
   - `lib/server/services/*.ts` — Pure domain logic (auction transitions, bidding rules, moderation, fulfillment, audit logging). Independently unit-testable with Vitest.
   - `lib/server/adapters/*.ts` — External vendor boundaries (`storage`, `vin`, `geo`, `kyc`, `billing`, `notification`). Must implement a typed interface, handle timeouts gracefully, and NEVER crash the request if an optional vendor key is absent.
   - `lib/supabase/` — `client.ts` (browser Realtime/Auth only), `server.ts` (per-request `@supabase/ssr` client honoring RLS), `admin.ts` (service-role client — server-only, explicitly justified per call site).
2. **Zero Unhandled Crashes:**
   - Every Route Handler MUST be wrapped in `handleApiRoute(...)` (`lib/server/http.ts`).
   - Throw typed `AppError` subclasses (`ValidationError`, `UnauthorizedError`, `ForbiddenError`, `NotFoundError`, `ConflictError`, `PaymentRequiredError`, `RateLimitError`) with stable machine-readable error codes (`BID_MUST_INCREASE`, `AUCTION_NOT_ACTIVE`, `SUBSCRIPTION_PAST_DUE`, etc.) so frontend i18n maps them cleanly.
   - Never leak raw Postgres errors, stack traces, or internal column names to API responses.
3. **Database & Migration Discipline:**
   - Every schema, RLS, index, RPC, and `pg_cron` change MUST be saved in ordered SQL files under `supabase/migrations/` — zero ad-hoc untracked dashboard edits.
   - Every table storing CAD money MUST use `BIGINT` (`*_cents`) with `CHECK (*_cents >= 0)` (or `> 0` for bids).
   - Never bypass RLS casually: use the user-scoped `createServerSupabaseClient()` by default; use `createAdminSupabaseClient()` ONLY for verified webhooks, system jobs, or explicitly role-checked admin operations.
4. **Transparent Senior Handoff Comments:**
   - Whenever a Phase 1/reference shortcut is taken intentionally (e.g., Supabase Storage before dedicated AWS S3, seeded postal centroids before Google Geocoding API, sandbox KYC), annotate the exact line with `// TODO(senior-review): <production upgrade note>`.

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
- `next-intl` — Bilingual localization (Phase B10)
- `browser-image-compression` — Client-side photo compression/EXIF stripping
- `tailwindcss`, `lucide-react`, `clsx`, `tailwind-merge` — Styling & UI
- Radix UI primitives (`@radix-ui/react-*`) — Accessible headless components
- `@supabase/supabase-js`, `@supabase/ssr` — Supabase Postgres, Auth, Realtime & Storage (`ca-central-1`)
- `stripe` — Dealership CAD SaaS subscription billing & verified webhooks (Phase B7)
- `vitest` — Unit, service, and RLS isolation test suite (Phase B9)
- *(Optional Phase B8 production adapters)* `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, `@upstash/ratelimit`, `@upstash/redis`

Do not install any other packages without updating this list first.
