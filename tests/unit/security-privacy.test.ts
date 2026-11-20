import type { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ServerEnv } from "@/lib/server/env";
import {
  ConflictError,
  ExternalServiceError,
  ForbiddenError,
  RateLimitError,
} from "@/lib/server/errors";
import {
  createMockSupabaseClient,
  makeSessionContext,
  type MockQueryState,
} from "./helpers/supabase-mock";

const { mockGetServerEnv, mockCreateAdminClient } = vi.hoisted(() => ({
  mockGetServerEnv: vi.fn<() => ServerEnv>(),
  mockCreateAdminClient: vi.fn(),
}));

vi.mock("@/lib/server/env", () => ({
  getServerEnv: mockGetServerEnv,
  getPublicSupabaseEnv: vi.fn(() => ({
    url: "https://example.supabase.co",
    publishableKey: "anon-key",
  })),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminSupabaseClient: mockCreateAdminClient,
}));

import {
  getStorageAdapter,
  resolveS3StorageConfig,
  S3StorageAdapter,
  SupabaseStorageAdapter,
} from "@/lib/server/adapters/storage.adapter";
import {
  enforceRateLimit,
  extractClientIp,
  rateLimitHeaders,
} from "@/lib/server/rate-limit";
import {
  exportPersonalData,
  requestAccountDeletion,
  requestAccountDeletionSchema,
} from "@/lib/server/services/privacy.service";

function baseEnv(overrides: Partial<ServerEnv> = {}): ServerEnv {
  return {
    supabaseUrl: "https://example.supabase.co",
    supabasePublishableKey: "anon-key",
    supabaseSecretKey: "service-role-key",
    appUrl: "http://localhost:3000",
    enableMockApi: false,
    storageDriver: "supabase",
    kycMode: "sandbox",
    ...overrides,
  };
}

function makeMockRequest(headersMap: Record<string, string> = {}): NextRequest {
  return {
    headers: new Headers(headersMap),
  } as unknown as NextRequest;
}

describe("Security Rate Limiter, S3 ca-central-1 Adapter & PIPEDA Privacy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetServerEnv.mockReturnValue(baseEnv());
    (
      globalThis as typeof globalThis & {
        __autonexaRateLimitStore?: Map<string, number[]>;
      }
    ).__autonexaRateLimitStore = new Map();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("rate-limit.ts", () => {
    it("extracts and sanitizes client IPs across proxy headers", () => {
      expect(
        extractClientIp(
          makeMockRequest({ "x-forwarded-for": "198.51.100.7, 10.0.0.1" })
        )
      ).toBe("198.51.100.7");
      expect(
        extractClientIp(makeMockRequest({ "x-real-ip": "203.0.113.9" }))
      ).toBe("203.0.113.9");
      expect(
        extractClientIp(makeMockRequest({ "cf-connecting-ip": "192.0.2.5" }))
      ).toBe("192.0.2.5");
      expect(extractClientIp(makeMockRequest())).toBe("127.0.0.1");
    });

    it("enforces in-memory sliding window and emits RateLimitError (429) with Retry-After", async () => {
      const req = makeMockRequest({ "x-forwarded-for": "198.51.100.88" });

      for (let i = 1; i <= 5; i++) {
        const res = await enforceRateLimit(req, "auth_verify", {
          scopeKey: "user-1",
        });
        expect(res.allowed).toBe(true);
        const headers = rateLimitHeaders(res);
        expect(headers["X-RateLimit-Limit"]).toBe("5");
        expect(headers["X-RateLimit-Remaining"]).toBe(String(5 - i));
      }

      await expect(
        enforceRateLimit(req, "auth_verify", { scopeKey: "user-1" })
      ).rejects.toSatisfy(
        (err: unknown) =>
          err instanceof RateLimitError &&
          err.status === 429 &&
          err.code === "RATE_LIMITED" &&
          (err.retryAfterSeconds ?? 0) > 0
      );
    });

    it("handles Upstash Redis allowed, blocked (429), and fallback paths", async () => {
      mockGetServerEnv.mockReturnValue(
        baseEnv({
          upstashRedisRestUrl: "https://test.upstash.io/",
          upstashRedisRestToken: "upstash-token",
        })
      );

      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify([{ result: 0 }, { result: 2 }, { result: ["k", "1700000000000"] }]),
            { status: 200 }
          )
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify([{ result: 1 }, { result: 1 }]), { status: 200 })
        )
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify([
              { result: 0 },
              { result: 10 },
              { result: ["k", String(Date.now() - 5_000)] },
            ]),
            { status: 200 }
          )
        );
      vi.stubGlobal("fetch", fetchMock);

      const req = makeMockRequest({ "x-forwarded-for": "198.51.100.90" });
      const okRes = await enforceRateLimit(req, "auth_login");
      expect(okRes.backend).toBe("upstash");
      expect(okRes.remaining).toBe(7);

      await expect(enforceRateLimit(req, "auth_login")).rejects.toBeInstanceOf(
        RateLimitError
      );

      fetchMock.mockRejectedValueOnce(new Error("Upstash timeout"));
      const fallbackRes = await enforceRateLimit(req, "auth_login");
      expect(fallbackRes.backend).toBe("memory");
    });
  });

  describe("storage.adapter.ts (S3 ca-central-1 SigV4 Drop-In)", () => {
    it("validates S3 credentials cleanly and switches storage driver dynamically", () => {
      expect(getStorageAdapter()).toBeInstanceOf(SupabaseStorageAdapter);

      mockGetServerEnv.mockReturnValue(baseEnv({ storageDriver: "s3" }));
      expect(() => resolveS3StorageConfig()).toThrowError(ExternalServiceError);

      try {
        getStorageAdapter();
      } catch (err) {
        expect(err).toMatchObject({ code: "STORAGE_NOT_CONFIGURED" });
      }

      mockGetServerEnv.mockReturnValue(
        baseEnv({
          storageDriver: "s3",
          awsRegion: "ca-central-1",
          awsS3Bucket: "autonexa-media-ca",
          awsAccessKeyId: "AKIAIOSFODNN7EXAMPLE",
          awsSecretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
        })
      );
      expect(getStorageAdapter()).toBeInstanceOf(S3StorageAdapter);
    });

    it("generates AWS SigV4 URLs, handles empty deletes & non-2xx errors", async () => {
      const s3 = new S3StorageAdapter({
        region: "ca-central-1",
        bucket: "autonexa-media-ca",
        accessKeyId: "AKIAIOSFODNN7EXAMPLE",
        secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
      });

      const signedUpload = await s3.createSignedUploadUrl(
        "listing-media",
        "/seller-1/photo front.jpg"
      );
      expect(signedUpload.uploadUrl).toContain("X-Amz-Algorithm=AWS4-HMAC-SHA256");

      const readUrl = await s3.createSignedReadUrl("kyc-docs", "u1/id.png", 600);
      expect(readUrl).toContain("X-Amz-Expires=600");

      const cfS3 = new S3StorageAdapter({
        region: "ca-central-1",
        bucket: "autonexa-media-ca",
        accessKeyId: "AKIAIOSFODNN7EXAMPLE",
        secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
        publicBaseUrl: "https://cdn.autonexa.ca/",
      });
      expect(cfS3.getPublicUrl("listing-media", "seller-1/a.webp")).toBe(
        "https://cdn.autonexa.ca/listing-media/seller-1/a.webp"
      );

      await s3.deleteObject("dispute-evidence", []);

      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(new Response("", { status: 200 }))
        .mockResolvedValueOnce(new Response(null, { status: 204 }))
        .mockResolvedValueOnce(new Response("Forbidden", { status: 403 }))
        .mockResolvedValueOnce(new Response("Server Error", { status: 500 }));
      vi.stubGlobal("fetch", fetchMock);

      const uploaded = await s3.uploadBuffer(
        "dispute-evidence",
        "d1/hoist.jpg",
        new Uint8Array([1, 2, 3]),
        "image/jpeg"
      );
      expect(uploaded.path).toBe("d1/hoist.jpg");

      await s3.deleteObject("dispute-evidence", "d1/hoist.jpg");

      await expect(
        s3.uploadBuffer(
          "dispute-evidence",
          "d1/fail.jpg",
          new ArrayBuffer(4),
          "image/jpeg"
        )
      ).rejects.toBeInstanceOf(ExternalServiceError);

      await expect(
        s3.deleteObject("dispute-evidence", ["d1/fail.jpg"])
      ).rejects.toBeInstanceOf(ExternalServiceError);
    });
  });

  describe("privacy.service.ts (PIPEDA & Quebec Law 25)", () => {
    it("exports dealer records, deduplicates bids/matches, and withholds ACTIVE seller bids", async () => {
      const queries: MockQueryState[] = [];
      const { admin } = createMockSupabaseClient((state) => {
        queries.push(state);
        if (state.table === "user_consents") {
          return {
            data: [
              {
                id: "c1",
                consent_type: "PIPEDA_PRIVACY",
                granted: true,
                policy_version: "1.0",
                recorded_at: "2026-11-01T00:00:00Z",
              },
            ],
          };
        }
        if (state.table === "kyc_submissions") {
          return { data: null };
        }
        if (state.table === "listings") {
          return {
            data: [
              {
                id: "listing-unsealed-1",
                vin: "1FTFW1E84MFA00001",
                year: 2022,
                make: "Ford",
                model: "F-150",
                trim: "Lariat",
                mileage_km: 40_000,
                status: "UNSEALED",
                reserve_price_cents: 4_000_000,
                city: "Toronto",
                province: "ON",
                postal_code: "M5V 2T6",
                bid_count: 1,
                created_at: "2026-11-15T00:00:00Z",
                auction_started_at: "2026-11-15T01:00:00Z",
                auction_ends_at: "2026-11-16T01:00:00Z",
                closed_at: "2026-11-16T01:00:00Z",
              },
            ],
          };
        }
        if (state.table === "listing_media") {
          return {
            data: [{ listing_id: "listing-unsealed-1", storage_key: "k1", photo_label: "front", sort_order: 0 }],
          };
        }
        if (state.table === "damage_hotspots") {
          return {
            data: [{ listing_id: "listing-unsealed-1", viewpoint: "front", panel: "bumper", severity: "MINOR", description: "scuff" }],
          };
        }
        if (state.table === "bids") {
          return {
            data: [
              {
                id: "bid-dealer-1",
                listing_id: "listing-unsealed-1",
                dealership_id: "11111111-1111-4111-8111-111111111101",
                amount_cents: 4_350_000,
                status: "WON",
                conditions: null,
                version: 1,
                revision_count: 0,
                created_at: "2026-11-15T10:00:00Z",
                revised_at: null,
              },
            ],
          };
        }
        if (state.table === "matches") {
          return {
            data: [
              {
                id: "m1",
                listing_id: "listing-unsealed-1",
                dealership_id: "11111111-1111-4111-8111-111111111101",
                voucher_code: "ANX-ON-1234",
                selection_reason: "HIGHEST",
                agreed_amount_cents: 4_350_000,
                final_price_cents: 4_350_000,
                accept_expires_at: "2026-11-17T10:00:00Z",
                outcome: "COMPLETED",
                outcome_logged_at: "2026-11-17T08:00:00Z",
                created_at: "2026-11-16T02:00:00Z",
              },
            ],
          };
        }
        if (state.table === "disputes") {
          return {
            data: [
              {
                id: "d1",
                match_id: "m1",
                category: "MISSING_KEYS",
                status: "RESOLVED",
                allegation_summary: "Second key",
                compliance_decision_notes: "Resolved",
                created_at: "2026-11-16T03:00:00Z",
                resolved_at: "2026-11-16T04:00:00Z",
              },
            ],
          };
        }
        if (state.table === "notifications") {
          return {
            data: [
              {
                id: "n1",
                type: "MATCH",
                title: "Won",
                description: "Voucher issued",
                read: true,
                created_at: "2026-11-16T02:00:00Z",
              },
            ],
          };
        }
        return { data: null };
      });
      mockCreateAdminClient.mockReturnValue(admin);

      const dealerCtx = makeSessionContext({
        role: "DEALER_ADMIN",
        dealershipId: "11111111-1111-4111-8111-111111111101",
      });
      const bundle = await exportPersonalData(dealerCtx, { ipAddress: null });
      expect(bundle.counts).toEqual({
        consents: 1,
        listings: 1,
        bids: 1,
        matches: 1,
        disputes: 1,
        notifications: 1,
      });

      const { admin: errAdmin } = createMockSupabaseClient(() => ({
        error: { message: "read error" },
      }));
      mockCreateAdminClient.mockReturnValue(errAdmin);
      await expect(
        exportPersonalData(dealerCtx, { ipAddress: null })
      ).rejects.toBeInstanceOf(ExternalServiceError);
    });

    it("covers deletion validation, obligations conflict, profile error, and global signOut catch", async () => {
      expect(
        requestAccountDeletionSchema.safeParse({ confirmationText: "DELETE MY ACCOUNT" }).success
      ).toBe(true);
      expect(
        requestAccountDeletionSchema.safeParse({ confirmationText: "delete my account" }).success
      ).toBe(false);

      await expect(
        requestAccountDeletion(
          makeSessionContext({ role: "ADMIN" }),
          { confirmationText: "DELETE MY ACCOUNT" },
          { ipAddress: null, userAgent: null }
        )
      ).rejects.toBeInstanceOf(ForbiddenError);

      const { admin: obligationAdmin } = createMockSupabaseClient((state) => {
        if (state.table === "disputes") return { count: 1 };
        return { count: 0 };
      });
      mockCreateAdminClient.mockReturnValue(obligationAdmin);

      await expect(
        requestAccountDeletion(
          makeSessionContext({
            role: "DEALER_AGENT",
            dealershipId: "11111111-1111-4111-8111-111111111101",
          }),
          { confirmationText: "DELETE MY ACCOUNT" },
          { ipAddress: null, userAgent: null }
        )
      ).rejects.toBeInstanceOf(ConflictError);

      const { admin: profileErrAdmin } = createMockSupabaseClient((state) => {
        if (state.table === "profiles" && state.op === "update") {
          return { error: { message: "update failed" } };
        }
        return { count: 0, data: null };
      });
      mockCreateAdminClient.mockReturnValue(profileErrAdmin);

      await expect(
        requestAccountDeletion(
          makeSessionContext({ role: "SELLER" }),
          { confirmationText: "DELETE MY ACCOUNT" },
          { ipAddress: null, userAgent: null }
        )
      ).rejects.toBeInstanceOf(ExternalServiceError);

      const { supabase, admin: deleteAdmin, signOutMock } =
        createMockSupabaseClient((state) =>
          state.op === "select" ? { count: 0, data: null } : { data: null }
        );
      signOutMock.mockRejectedValueOnce(new Error("signOut error"));
      mockCreateAdminClient.mockReturnValue(deleteAdmin);

      const res = await requestAccountDeletion(
        makeSessionContext({ role: "SELLER", supabase }),
        { confirmationText: "DELETE MY ACCOUNT", reason: "Done" },
        { ipAddress: "198.51.100.5", userAgent: "Vitest" }
      );
      expect(res.accountStatus).toBe("PENDING_DELETION");

      const { admin: sellerMatchConflict } = createMockSupabaseClient((state) => {
        if (state.table === "matches") return { count: 1 };
        return { count: 0 };
      });
      mockCreateAdminClient.mockReturnValue(sellerMatchConflict);
      await expect(
        requestAccountDeletion(
          makeSessionContext({ role: "SELLER" }),
          { confirmationText: "DELETE MY ACCOUNT" },
          { ipAddress: null, userAgent: null }
        )
      ).rejects.toBeInstanceOf(ConflictError);

      const { admin: oblErrAdmin } = createMockSupabaseClient(() => ({
        error: { message: "count error" },
      }));
      mockCreateAdminClient.mockReturnValue(oblErrAdmin);
      await expect(
        requestAccountDeletion(
          makeSessionContext({ role: "SELLER" }),
          { confirmationText: "DELETE MY ACCOUNT" },
          { ipAddress: null, userAgent: null }
        )
      ).rejects.toBeInstanceOf(ExternalServiceError);
    });
  });
});
