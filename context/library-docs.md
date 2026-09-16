# Library Docs: Car Auction Marketplace Platform (CAMP)

Project-specific usage patterns, code recipes, and hard constraints for every frontend library in CAMP. 
Read the relevant section before implementing any feature that touches these libraries.

---

## Order of Authority

When implementing third-party library integrations, adhere to this hierarchy:

```
MCP Server (Live Docs) → Skills via AGENTS.md → This File (Project Rules) → General Training Data
```

Never guess APIs. If a library pattern isn't covered here, check official v5/v15 docs before writing code.

---

## 1. TanStack Query v5 (React Query)

Used exclusively for server state: queries, mutations, cache invalidation, and optimistic updates. Never use TanStack Query for purely client-side UI toggles.

### Query Key Factory Pattern
All query keys must be defined centrally in `src/lib/query-keys.ts` using tuple factories to prevent cache collisions and ensure type-safe invalidation.

```typescript
// src/lib/query-keys.ts
export const auctionKeys = {
  all: ['auctions'] as const,
  lists: () => [...auctionKeys.all, 'list'] as const,
  list: (filters: { radius?: number; province?: string }) => [...auctionKeys.lists(), filters] as const,
  details: () => [...auctionKeys.all, 'detail'] as const,
  detail: (id: string) => [...auctionKeys.details(), id] as const,
  bids: (id: string) => [...auctionKeys.detail(id), 'bids'] as const,
};
```

### Data Fetching Hook Pattern

Always wrap queries in custom hooks inside `src/hooks/`. Never call `useQuery` directly inside presentation components.

```typescript
// src/hooks/useAuctionDetails.ts
import { useQuery } from '@tanstack/react-query';
import { auctionKeys } from '@/lib/query-keys';
import { api } from '@/lib/api-client';
import type { AuctionDetailResponse } from '@/types/auction';

export function useAuctionDetails(auctionId: string) {
  return useQuery({
    queryKey: auctionKeys.detail(auctionId),
    queryFn: async (): Promise<AuctionDetailResponse> => {
      const response = await api.get<AuctionDetailResponse>(`/api/listings/${auctionId}`);
      if (!response.success) {
        throw new Error(response.error || 'Failed to load auction');
      }
      return response.data;
    },
    staleTime: 1000 * 30, // 30 seconds
    enabled: Boolean(auctionId),
  });
}
```

### Sealed Bid Mutation Pattern

Mutations must handle optimistic UI state cautiously. Since bids are sealed, never optimistically append bid amounts to other clients.

```typescript
// src/hooks/useSubmitBid.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { auctionKeys } from '@/lib/query-keys';
import { api } from '@/lib/api-client';

type SubmitBidPayload = {
  listingId: string;
  amountCents: number; // Integer CAD cents
};

export function useSubmitBid(listingId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ listingId, amountCents }: SubmitBidPayload) => {
      return api.post(`/api/listings/${listingId}/bids`, { amountCents });
    },
    onSuccess: () => {
      // Invalidate dealer's own bid cache and active listing state
      queryClient.invalidateQueries({ queryKey: auctionKeys.detail(listingId) });
    },
  });
}
```

**TanStack Query Rules:**

* Never store API responses in Zustand. TanStack Query owns the server cache.
* In v5, `onSuccess`, `onError`, and `onSettled` are removed from `useQuery`—handle errors in the UI via `isError` or an `ErrorBoundary`.
* Always set explicit `staleTime` (minimum 15s for feed, 5s for active auctions).

---

## 2. Zustand

Used exclusively for ephemeral client-side state: multi-step wizards, UI modal toggles, and draft filters.

### Multi-Step Listing Wizard Store Pattern

```typescript
// src/store/useListingWizardStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export type DamageHotspot = {
  zone: string; // e.g., 'FRONT_BUMPER', 'DRIVER_DOOR'
  severity: 'MINOR' | 'MODERATE' | 'SEVERE';
  description?: string;
};

type ListingWizardState = {
  step: number;
  vin: string;
  decodedSpecs: Record<string, unknown> | null;
  mileageKm: number | null;
  askingPriceCents: number | null;
  damageHotspots: DamageHotspot[];
  mediaKeys: string[];
  
  // Actions
  setStep: (step: number) => void;
  setVin: (vin: string, specs?: Record<string, unknown>) => void;
  addDamageHotspot: (hotspot: DamageHotspot) => void;
  removeDamageHotspot: (zone: string) => void;
  setMediaKeys: (keys: string[]) => void;
  resetWizard: () => void;
};

const initialState = {
  step: 1,
  vin: '',
  decodedSpecs: null,
  mileageKm: null,
  askingPriceCents: null,
  damageHotspots: [],
  mediaKeys: [],
};

export const useListingWizardStore = create<ListingWizardState>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,
        setStep: (step) => set({ step }),
        setVin: (vin, specs) => set({ vin, decodedSpecs: specs || null }),
        addDamageHotspot: (hotspot) =>
          set((state) => ({
            damageHotspots: [...state.damageHotspots.filter((h) => h.zone !== hotspot.zone), hotspot],
          })),
        removeDamageHotspot: (zone) =>
          set((state) => ({
            damageHotspots: state.damageHotspots.filter((h) => h.zone !== zone),
          })),
        setMediaKeys: (mediaKeys) => set({ mediaKeys }),
        resetWizard: () => set(initialState),
      }),
      { name: 'camp-listing-wizard' }
    )
  )
);
```

**Zustand Rules:**

* Keep stores small and purpose-built. Do not build one gigantic global store.
* Always call `resetWizard()` after a successful vehicle submission.
* Never write API fetch calls inside Zustand actions.

---

## 3. React Hook Form + Zod

All forms must use `react-hook-form` with `@hookform/resolvers/zod`. Uncontrolled inputs with direct refs only—never wire inputs to raw `useState`.

### CAD Currency Input & Validation Pattern

Form displays formatted currency (`$42,500.00`), but transforms and validates values as **integer cents** (`4250000` CAD).

```typescript
// src/lib/schemas/listing-schema.ts
import { z } from 'zod';

export const bidSubmissionSchema = z.object({
  amountDollars: z
    .string()
    .min(1, 'Bid amount is required')
    .regex(/^\d+(\.\d{1,2})?$/, 'Enter a valid CAD amount (e.g. 15000 or 15000.50)')
    .transform((val) => Math.round(parseFloat(val) * 100))
    .refine((cents) => cents >= 10000, {
      message: 'Minimum bid is $100.00 CAD',
    }),
});

export type BidSubmissionForm = z.input<typeof bidSubmissionSchema>;
export type BidSubmissionParsed = z.output<typeof bidSubmissionSchema>;
```

### Component Implementation

```tsx
// src/components/dealer/BidSubmissionForm.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { bidSubmissionSchema, type BidSubmissionForm } from '@/lib/schemas/listing-schema';

interface Props {
  listingId: string;
  minNextBidCents: number;
  onSubmitBid: (cents: number) => Promise<void>;
}

export function BidSubmissionForm({ listingId, minNextBidCents, onSubmitBid }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BidSubmissionForm>({
    resolver: zodResolver(bidSubmissionSchema),
    defaultValues: { amountDollars: '' },
  });

  const onSubmit = async (data: any) => {
    // data is transformed to cents by Zod output
    await onSubmitBid(data.amountDollars);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="text-sm font-medium text-text-main dark:text-text-dark-main">
          Sealed Offer (CAD)
        </label>
        <div className="relative mt-1">
          <span className="absolute left-3 top-2.5 font-mono text-sm text-text-muted">CAD $</span>
          <input
            type="text"
            inputMode="decimal"
            placeholder="25000.00"
            className="w-full rounded border border-border-hairline pl-16 pr-3 py-2 font-mono text-sm focus:border-brand-electric focus:outline-none"
            {...register('amountDollars')}
          />
        </div>
        {errors.amountDollars && (
          <p className="mt-1 text-xs text-brand-crimson">{errors.amountDollars.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded bg-brand-primary py-2.5 font-mono text-sm font-bold text-white hover:bg-brand-primary/90 disabled:opacity-50"
      >
        {isSubmitting ? 'Securing Bid...' : 'Submit Binding Bid'}
      </button>
    </form>
  );
}
```

**React Hook Form Rules:**

* Never do floating-point math in the component. Pass converted cents to the API.
* Always include accessible error messages using `<p role="alert">`.

---

## 4. next-intl (Bilingual Routing & Translations)

Used for English/French localization matching Quebec Law 25 obligations.

### Translation Dictionary Structure

Translations live in `messages/en.json` and `messages/fr.json`.

```json
// messages/en.json
{
  "Auction": {
    "title": "24-Hour Sealed Auction",
    "bidsReceived": "{count, plural, =0 {No bids yet} =1 {1 Bid Placed} other {# Bids Placed}}",
    "timeLeft": "Time Remaining",
    "sealedNotice": "Bids are sealed and binding under provincial regulations."
  }
}
```

### Component Usage Pattern

```tsx
// Server Component
import { getTranslations } from 'next-intl/server';

export async function AuctionHeader({ listingId }: { listingId: string }) {
  const t = await getTranslations('Auction');
  return (
    <header>
      <h1 className="font-display text-2xl">{t('title')}</h1>
      <p className="font-mono text-xs">{t('sealedNotice')}</p>
    </header>
  );
}

// Client Component
'use client';
import { useTranslations } from 'next-intl';

export function BidTelemetry({ count }: { count: number }) {
  const t = useTranslations('Auction');
  return (
    <div className="rounded bg-track-light p-3 dark:bg-track-dark">
      <span className="font-mono text-sm font-semibold">
        {t('bidsReceived', { count })}
      </span>
    </div>
  );
}
```

**next-intl Rules:**

* Always use the typed `Link` from `@/i18n/routing` instead of `next/link` to preserve the active locale (`/en`, `/fr`).
* Never hardcode user-facing strings in JSX. Every label, error message, and badge must resolve via translation keys.

---

## 5. browser-image-compression & Direct AWS S3 Upload

Client-side image processing pipeline. Strips location metadata (EXIF/GPS) for PIPEDA privacy compliance and reduces payload size before sending to AWS S3.

### Compression & Direct Upload Pipeline

```typescript
// src/lib/media-upload.ts
import imageCompression from 'browser-image-compression';
import { api } from '@/lib/api-client';

const COMPRESSION_CONFIG = {
  maxSizeMB: 1.5,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  preserveExif: false, // Critical: Strips GPS/EXIF for PIPEDA privacy
  fileType: 'image/jpeg',
};

type PresignedUrlResponse = {
  uploadUrl: string;
  fileKey: string;
};

export async function processAndUploadVehiclePhoto(
  file: File,
  listingId: string
): Promise<string> {
  // 1. Compress & Strip EXIF
  const compressedFile = await imageCompression(file, COMPRESSION_CONFIG);

  // 2. Request Presigned URL from Backend
  const presignRes = await api.post<PresignedUrlResponse>('/api/listings/media/presign', {
    listingId,
    contentType: 'image/jpeg',
    fileName: file.name,
  });

  if (!presignRes.success) {
    throw new Error('Failed to generate secure upload credentials');
  }

  // 3. Direct Browser PUT to AWS S3
  const s3Upload = await fetch(presignRes.data.uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'image/jpeg',
    },
    body: compressedFile,
  });

  if (!s3Upload.ok) {
    throw new Error('Failed to upload image to storage cluster');
  }

  return presignRes.data.fileKey;
}
```

**Media Rules:**

* Photos must NEVER touch the Node.js Express server. Always upload directly from the browser to AWS S3 via presigned `PUT` URLs.
* `preserveExif: false` is non-negotiable. Retaining GPS data in public/dealer images violates Canadian privacy standards.
* Limit batch uploads to max 5 concurrent promises to avoid saturating mobile network connections.

---

## 6. Server-Sent Events (SSE) / Authoritative Time Sync

Used for real-time 24-hour auction countdowns and live sealed-bid counter updates.

### SSE Auction Listener Hook

```typescript
// src/hooks/useAuctionSSE.ts
'use client';

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { auctionKeys } from '@/lib/query-keys';

type AuctionSSEEvent = {
  type: 'TICK' | 'BID_PLACED' | 'AUCTION_CLOSED';
  serverTime: string; // ISO 8601 UTC
  auctionEndsAt: string; // ISO 8601 UTC
  bidCount: number;
};

export function useAuctionSSE(listingId: string) {
  const queryClient = useQueryClient();
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const [bidCount, setBidCount] = useState<number>(0);

  useEffect(() => {
    if (!listingId) return;

    const eventSource = new EventSource(
      `${process.env.NEXT_PUBLIC_API_URL}/api/listings/${listingId}/stream`
    );

    eventSource.onmessage = (event) => {
      try {
        const data: AuctionSSEEvent = JSON.parse(event.data);

        // Calculate authoritative drift-free delta
        const serverNow = new Date(data.serverTime).getTime();
        const endsAt = new Date(data.auctionEndsAt).getTime();
        const deltaSeconds = Math.max(0, Math.floor((endsAt - serverNow) / 1000));

        setSecondsRemaining(deltaSeconds);
        setBidCount(data.bidCount);

        if (data.type === 'AUCTION_CLOSED') {
          queryClient.invalidateQueries({ queryKey: auctionKeys.detail(listingId) });
          eventSource.close();
        }
      } catch (err) {
        console.error('[SSE] Failed to parse auction stream', err);
      }
    };

    eventSource.onerror = () => {
      // Automatic browser reconnects apply; close if terminal
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [listingId, queryClient]);

  return { secondsRemaining, bidCount };
}
```

**SSE Rules:**

* Never compute countdowns based on `Date.now()`. Always compute the difference against the authoritative `serverTime` returned by the SSE payload.
* Clean up event source instances inside the `useEffect` return teardown to prevent connection leaks on the VPS.

---

## 7. NHTSA VPIC Decode Utility

Decodes 17-character VINs for automated listing creation.

### Client Helper

```typescript
// src/lib/vpic-decoder.ts
export type DecodedVehicle = {
  year: number;
  make: string;
  model: string;
  trim?: string;
  engine?: string;
  transmission?: string;
  bodyClass?: string;
};

export async function decodeVinClient(vin: string): Promise<DecodedVehicle> {
  const cleanVin = vin.trim().toUpperCase();
  if (cleanVin.length !== 17) {
    throw new Error('VIN must be exactly 17 characters');
  }

  const res = await fetch(
    `https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${cleanVin}?format=json`
  );

  if (!res.ok) {
    throw new Error('NHTSA VPIC API unavailable');
  }

  const json = await res.json();
  const results: Array<{ Variable: string; Value: string | null }> = json.Results || [];

  const getValue = (varName: string) =>
    results.find((item) => item.Variable === varName)?.Value || undefined;

  const yearStr = getValue('Model Year');
  const make = getValue('Make');
  const model = getValue('Model');

  if (!yearStr || !make || !model) {
    throw new Error('Could not decode basic vehicle specifications from VIN');
  }

  return {
    year: parseInt(yearStr, 10),
    make,
    model,
    trim: getValue('Trim') || getValue('Series'),
    engine: getValue('Displacement (L)') ? `${getValue('Displacement (L)')}L` : undefined,
    transmission: getValue('Transmission Style'),
    bodyClass: getValue('Body Class'),
  };
}
```

**VPIC Rules:**

* Always capitalize and validate 17-character VIN format before initiating an external request.
* If VPIC returns null for trim or transmission, gracefully fall back to manual form inputs—never block the user from proceeding.
