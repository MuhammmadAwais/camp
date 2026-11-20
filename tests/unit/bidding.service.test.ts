import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  BadRequestError,
  ConflictError,
  ExternalServiceError,
  ForbiddenError,
  NotFoundError,
  PaymentRequiredError,
  UnauthorizedError,
} from "@/lib/server/errors";
import {
  createMockSupabaseClient,
  makeSessionContext,
} from "./helpers/supabase-mock";

const { mockCreateAdminClient, mockNotifyMatchCreated } = vi.hoisted(() => ({
  mockCreateAdminClient: vi.fn(),
  mockNotifyMatchCreated: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminSupabaseClient: mockCreateAdminClient,
}));

vi.mock("@/lib/server/services/notification.service", () => ({
  notifyMatchCreated: mockNotifyMatchCreated,
}));

import {
  placeSealedBid,
  placeSealedBidSchema,
} from "@/lib/server/services/bidding.service";
import {
  acceptDealerOffer,
  DEFAULT_HANDOVER_CHECKLIST,
} from "@/lib/server/services/fulfillment.service";

const LISTING_ID = "22222222-2222-4222-8222-222222222201";
const BID_ID = "33333333-3333-4333-8333-333333333301";
const DEALERSHIP_ID = "11111111-1111-4111-8111-111111111101";
const MATCH_ID = "44444444-4444-4444-8444-444444444401";

describe("Sealed Bidding & Fulfillment Services", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("placeSealedBidSchema", () => {
    it("enforces CAD cent bounds, integer amounts, and declaration attestation", () => {
      expect(
        placeSealedBidSchema.safeParse({
          auctionId: LISTING_ID,
          bidAmountCents: 99_999,
          certifiedDeclaration: true,
        }).success
      ).toBe(false);

      expect(
        placeSealedBidSchema.safeParse({
          auctionId: LISTING_ID,
          bidAmountCents: 100_000_001,
          certifiedDeclaration: true,
        }).success
      ).toBe(false);

      expect(
        placeSealedBidSchema.safeParse({
          auctionId: LISTING_ID,
          bidAmountCents: 3_500_000,
          certifiedDeclaration: false,
        }).success
      ).toBe(false);

      expect(
        placeSealedBidSchema.safeParse({
          auctionId: LISTING_ID,
          bidAmountCents: 3_500_000,
          certifiedDeclaration: true,
          idempotencyKey: "short",
        }).success
      ).toBe(false);

      expect(
        placeSealedBidSchema.safeParse({
          auctionId: LISTING_ID,
          bidAmountCents: 3_500_000,
          certifiedDeclaration: true,
          idempotencyKey: "bid-key-12345678",
        }).success
      ).toBe(true);
    });
  });

  describe("placeSealedBid()", () => {
    it("blocks non-dealer roles and DEALER_INSPECTOR seats", async () => {
      const sellerCtx = makeSessionContext({
        role: "SELLER",
        dealershipId: DEALERSHIP_ID,
        seatRole: "DEALER_BUYER",
      }) as ReturnType<typeof makeSessionContext> & { dealershipId: string };

      await expect(
        placeSealedBid(sellerCtx, {
          auctionId: LISTING_ID,
          bidAmountCents: 4_500_000,
          certifiedDeclaration: true,
        })
      ).rejects.toMatchObject({ status: 403, code: "FORBIDDEN" });

      const inspectorCtx = makeSessionContext({
        role: "DEALER_AGENT",
        dealershipId: DEALERSHIP_ID,
        seatRole: "DEALER_INSPECTOR",
      }) as ReturnType<typeof makeSessionContext> & { dealershipId: string };

      await expect(
        placeSealedBid(inspectorCtx, {
          auctionId: LISTING_ID,
          bidAmountCents: 4_500_000,
          certifiedDeclaration: true,
        })
      ).rejects.toMatchObject({
        status: 403,
        code: "FORBIDDEN_INSPECTOR_BID",
      });
    });

    it("scopes idempotency keys and formats initial, upward revision, and idempotent receipts", async () => {
      const { supabase, rpcSpy } = createMockSupabaseClient(
        () => ({ data: null }),
        () => ({
          data: {
            success: true,
            idempotent: false,
            bid_id: BID_ID,
            listing_id: LISTING_ID,
            amount_cents: 4_500_000,
            version: 1,
            revision_count: 0,
            placed_at: "2026-11-20T15:00:00.000Z",
          },
          error: null,
        })
      );

      const dealerCtx = makeSessionContext({
        role: "DEALER_ADMIN",
        dealershipId: DEALERSHIP_ID,
        seatRole: "DEALER_ADMIN",
        supabase,
      }) as ReturnType<typeof makeSessionContext> & { dealershipId: string };

      const initialReceipt = await placeSealedBid(
        dealerCtx,
        {
          auctionId: LISTING_ID,
          bidAmountCents: 4_500_000,
          certifiedDeclaration: true,
          conditions: "Certified cheque on inspection",
          notes: "Pick up within 24h",
        },
        { headerIdempotencyKey: "hdr-key-99887766" }
      );

      expect(rpcSpy).toHaveBeenCalledWith("submit_dealer_bid", {
        p_listing_id: LISTING_ID,
        p_amount_cents: 4_500_000,
        p_idempotency_key: `${DEALERSHIP_ID}:hdr-key-99887766`,
        p_conditions: "Certified cheque on inspection",
        p_notes: "Pick up within 24h",
      });
      expect(initialReceipt.message).toContain("securely submitted");
      expect(initialReceipt.bidAmountCents).toBe(4_500_000);

      rpcSpy.mockResolvedValueOnce({
        data: {
          success: true,
          idempotent: false,
          bid_id: BID_ID,
          listing_id: LISTING_ID,
          amount_cents: 4_750_000,
          version: 2,
          revision_count: 1,
          placed_at: "2026-11-20T15:10:00.000Z",
        },
        error: null,
      });

      const revisedReceipt = await placeSealedBid(dealerCtx, {
        auctionId: LISTING_ID,
        bidAmountCents: 4_750_000,
        certifiedDeclaration: true,
        idempotencyKey: "rev-key-12345678",
      });
      expect(revisedReceipt.revisionCount).toBe(1);
      expect(revisedReceipt.message).toContain("revised upward");

      rpcSpy.mockResolvedValueOnce({
        data: {
          success: true,
          idempotent: true,
          bid_id: BID_ID,
          listing_id: LISTING_ID,
          amount_cents: 4_750_000,
          version: 2,
          revision_count: 1,
          placed_at: "2026-11-20T15:10:00.000Z",
        },
        error: null,
      });

      const replayReceipt = await placeSealedBid(dealerCtx, {
        auctionId: LISTING_ID,
        bidAmountCents: 4_750_000,
        certifiedDeclaration: true,
        idempotencyKey: "rev-key-12345678",
      });
      expect(replayReceipt.idempotent).toBe(true);
      expect(replayReceipt.message).toContain("already recorded");
    });

    it.each([
      ["UNAUTHORIZED: expired", UnauthorizedError, 401, "UNAUTHENTICATED"],
      ["INVALID_BID_AMOUNT: bad", BadRequestError, 400, "INVALID_BID_AMOUNT"],
      ["INVALID_IDEMPOTENCY_KEY: missing", BadRequestError, 400, "INVALID_IDEMPOTENCY_KEY"],
      ["FORBIDDEN_INSPECTOR_BID: denied", ForbiddenError, 403, "FORBIDDEN_INSPECTOR_BID"],
      ["DEALERSHIP_NOT_VERIFIED: pending", ForbiddenError, 403, "DEALERSHIP_NOT_VERIFIED"],
      ["FORBIDDEN: no access", ForbiddenError, 403, "FORBIDDEN"],
      ["LISTING_NOT_FOUND: missing", NotFoundError, 404, "NOT_FOUND"],
      ["AUCTION_NOT_ACTIVE: closed", ConflictError, 409, "AUCTION_NOT_ACTIVE"],
      [
        "BID_MUST_INCREASE: Revised bid (4000000) must exceed current bid (4500000)",
        ConflictError,
        409,
        "BID_MUST_INCREASE",
      ],
      [
        "BID_MUST_INCREASE: must increase",
        ConflictError,
        409,
        "BID_MUST_INCREASE",
      ],
      ["SUBSCRIPTION_PAST_DUE: past due", PaymentRequiredError, 402, "SUBSCRIPTION_PAST_DUE"],
      ["QUOTA_EXCEEDED: exhausted", PaymentRequiredError, 402, "QUOTA_EXCEEDED"],
    ] as const)(
      "maps RPC exception '%s' to typed HTTP error",
      async (pgMessage, ErrorCtor, expectedStatus, expectedCode) => {
        const { supabase } = createMockSupabaseClient(
          () => ({ data: null }),
          () => ({
            data: null,
            error: { code: "P0001", message: pgMessage },
          })
        );

        const dealerCtx = makeSessionContext({
          role: "DEALER_AGENT",
          dealershipId: DEALERSHIP_ID,
          seatRole: "DEALER_BUYER",
          supabase,
        }) as ReturnType<typeof makeSessionContext> & { dealershipId: string };

        let caught: unknown;
        try {
          await placeSealedBid(dealerCtx, {
            auctionId: LISTING_ID,
            bidAmountCents: 4_500_000,
            certifiedDeclaration: true,
          });
        } catch (err) {
          caught = err;
        }

        expect(caught).toBeInstanceOf(ErrorCtor);
        expect(caught).toMatchObject({
          status: expectedStatus,
          code: expectedCode,
        });
        if (expectedCode === "SUBSCRIPTION_PAST_DUE") {
          expect(caught).toMatchObject({
            details: { actionUrl: "/dealer/billing" },
          });
        }
        if (expectedCode === "QUOTA_EXCEEDED") {
          expect(caught).toMatchObject({
            details: { actionUrl: "/dealer/subscription" },
          });
        }
        if (pgMessage.includes("current bid (4500000)")) {
          expect(caught).toMatchObject({
            details: { currentBidCents: 4_500_000 },
          });
        }
      }
    );

    it("handles duplicate key 23505, unknown RPC errors, and invalid RPC payload shapes", async () => {
      const { supabase, rpcSpy } = createMockSupabaseClient(
        () => ({ data: null }),
        () => ({
          data: null,
          error: { code: "23505", message: "duplicate key value" },
        })
      );
      const dealerCtx = makeSessionContext({
        role: "DEALER_ADMIN",
        dealershipId: DEALERSHIP_ID,
        seatRole: "DEALER_ADMIN",
        supabase,
      }) as ReturnType<typeof makeSessionContext> & { dealershipId: string };

      await expect(
        placeSealedBid(dealerCtx, {
          auctionId: LISTING_ID,
          bidAmountCents: 4_500_000,
          certifiedDeclaration: true,
        })
      ).rejects.toMatchObject({ status: 409, code: "CONFLICT" });

      rpcSpy.mockResolvedValueOnce({
        data: null,
        error: { code: "42000", message: "unexpected db failure" },
      });
      await expect(
        placeSealedBid(dealerCtx, {
          auctionId: LISTING_ID,
          bidAmountCents: 4_500_000,
          certifiedDeclaration: true,
        })
      ).rejects.toBeInstanceOf(ExternalServiceError);

      rpcSpy.mockResolvedValueOnce({ data: { invalid: true }, error: null });
      await expect(
        placeSealedBid(dealerCtx, {
          auctionId: LISTING_ID,
          bidAmountCents: 4_500_000,
          certifiedDeclaration: true,
        })
      ).rejects.toBeInstanceOf(ExternalServiceError);
    });
  });

  describe("acceptDealerOffer()", () => {
    it("validates listing UUID and SELLER role before calling RPC", async () => {
      const sellerCtx = makeSessionContext({ role: "SELLER" });
      await expect(
        acceptDealerOffer(sellerCtx, "not-a-uuid", {
          bidId: BID_ID,
          selectionReason: "HIGHEST",
        })
      ).rejects.toMatchObject({ status: 404 });

      const dealerCtx = makeSessionContext({ role: "DEALER_ADMIN" });
      await expect(
        acceptDealerOffer(dealerCtx, LISTING_ID, {
          bidId: BID_ID,
          selectionReason: "HIGHEST",
        })
      ).rejects.toMatchObject({ status: 403, code: "FORBIDDEN" });
    });

    it.each([
      ["UNAUTHORIZED: required", 401, "UNAUTHENTICATED"],
      ["LISTING_NOT_FOUND: missing", 404, "NOT_FOUND"],
      ["FORBIDDEN: not owner", 403, "FORBIDDEN"],
      ["AUCTION_NOT_UNSEALED: active", 409, "AUCTION_NOT_UNSEALED"],
      ["MATCH_ALREADY_EXISTS: exists", 409, "MATCH_ALREADY_EXISTS"],
      ["BID_NOT_FOUND: ineligible", 404, "BID_NOT_FOUND"],
    ] as const)(
      "maps accept_dealer_bid error '%s' to HTTP %i",
      async (pgMessage, expectedStatus, expectedCode) => {
        const { supabase } = createMockSupabaseClient(
          () => ({ data: null }),
          () => ({ data: null, error: { code: "P0001", message: pgMessage } })
        );
        const sellerCtx = makeSessionContext({ role: "SELLER", supabase });

        await expect(
          acceptDealerOffer(sellerCtx, LISTING_ID, {
            bidId: BID_ID,
            selectionReason: "HIGHEST",
          })
        ).rejects.toMatchObject({ status: expectedStatus, code: expectedCode });
      }
    );

    it("hydrates appointment voucher and tolerates best-effort notification failure", async () => {
      const { supabase, admin } = createMockSupabaseClient(
        (state) => {
          if (state.table === "dealerships") {
            return {
              data: {
                operating_name: "Pfaff Automotive Partners",
                street_address: "100 Auto Park Circle",
                city: "Woodbridge",
                province: "ON",
                postal_code: "L4L 8R2",
                contact_phone: "+19055551234",
                contact_email: "desk@pfaff.ca",
                operating_hours: "Mon-Sat 9am-6pm",
                license_number: "OMVIC-88123",
                regulator: "OMVIC",
              },
            };
          }
          if (state.table === "listings") {
            return {
              data: {
                year: 2023,
                make: "Ford",
                model: "F-150",
                vin: "1FTFW1E84MFA00001",
                city: "Toronto",
                province: "ON",
              },
            };
          }
          return { data: null };
        },
        () => ({
          data: {
            success: true,
            match_id: MATCH_ID,
            voucher_code: "ANX-ON-A1B2C3",
            agreed_amount_cents: 4_850_000,
            accept_expires_at: "2026-11-21T16:00:00.000Z",
            dealership_id: DEALERSHIP_ID,
          },
          error: null,
        })
      );

      mockCreateAdminClient.mockReturnValue(admin);
      mockNotifyMatchCreated.mockRejectedValueOnce(new Error("SMTP offline"));

      const sellerCtx = makeSessionContext({ role: "SELLER", supabase });
      const response = await acceptDealerOffer(sellerCtx, LISTING_ID, {
        bidId: BID_ID,
        selectionReason: "HIGHEST",
      });

      expect(response.matchId).toBe(MATCH_ID);
      expect(response.status).toBe("ACCEPTED");
      expect(response.voucher).toMatchObject({
        voucherCode: "ANX-ON-A1B2C3",
        dealershipName: "Pfaff Automotive Partners",
        licenseNumber: "OMVIC-88123",
        acceptedOfferCents: 4_850_000,
        checklist: DEFAULT_HANDOVER_CHECKLIST,
      });
      expect(mockNotifyMatchCreated).toHaveBeenCalledTimes(1);

      // Cover null dealership/listing fallback & unexpected/malformed RPC errors
      const { supabase: nullFbSb, admin: nullFbAdmin, rpcSpy: acceptSpy } =
        createMockSupabaseClient(
          () => ({ data: null }),
          () => ({
            data: {
              success: true,
              match_id: MATCH_ID,
              voucher_code: "ANX-ON-ZZZZ",
              agreed_amount_cents: 3_900_000,
              accept_expires_at: "2026-11-21T16:00:00.000Z",
              dealership_id: DEALERSHIP_ID,
            },
            error: null,
          })
        );
      mockCreateAdminClient.mockReturnValue(nullFbAdmin);
      const fbRes = await acceptDealerOffer(
        makeSessionContext({ role: "SELLER", supabase: nullFbSb }),
        LISTING_ID,
        { bidId: BID_ID, selectionReason: "NEAREST" }
      );
      expect(fbRes.voucher.dealershipName).toBe("Licensed Dealership");

      acceptSpy.mockResolvedValueOnce({ data: null, error: { code: "42000", message: "db error" } });
      await expect(
        acceptDealerOffer(makeSessionContext({ role: "SELLER", supabase: nullFbSb }), LISTING_ID, {
          bidId: BID_ID,
          selectionReason: "HIGHEST",
        })
      ).rejects.toBeInstanceOf(ExternalServiceError);

      acceptSpy.mockResolvedValueOnce({ data: { invalid: true }, error: null });
      await expect(
        acceptDealerOffer(makeSessionContext({ role: "SELLER", supabase: nullFbSb }), LISTING_ID, {
          bidId: BID_ID,
          selectionReason: "HIGHEST",
        })
      ).rejects.toBeInstanceOf(ExternalServiceError);
    });
  });
});
