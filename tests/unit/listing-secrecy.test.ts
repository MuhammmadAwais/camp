import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ConflictError,
  ExternalServiceError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@/lib/server/errors";
import {
  createMockSupabaseClient,
  makeSessionContext,
  type MockQueryState,
} from "./helpers/supabase-mock";

const {
  mockCreateAdminClient,
  mockGeocodePostal,
  mockValidateVin,
  mockNotifyModeration,
} = vi.hoisted(() => ({
  mockCreateAdminClient: vi.fn(),
  mockGeocodePostal: vi.fn(),
  mockValidateVin: vi.fn((vin: string) => vin.trim().toUpperCase()),
  mockNotifyModeration: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminSupabaseClient: mockCreateAdminClient,
}));

vi.mock("@/lib/server/adapters/geo.adapter", () => ({
  geocodeCanadianPostalCode: mockGeocodePostal,
}));

vi.mock("@/lib/server/adapters/vin.adapter", () => ({
  validateAndNormalizeVin: mockValidateVin,
}));

vi.mock("@/lib/server/services/notification.service", () => ({
  notifyListingModerationDecision: mockNotifyModeration,
  notifyMatchCreated: vi.fn().mockResolvedValue(undefined),
}));

import {
  normalizeDamageGrade,
  sortPhotos,
  toReserveStatus,
} from "@/lib/server/services/dealer-feed.service";
import {
  createListing,
  getSellerDashboard,
  getSellerListingDetail,
} from "@/lib/server/services/listing.service";
import {
  decideListing,
  getModerationDossier,
  listModerationQueue,
  moderationDecisionSchema,
} from "@/lib/server/services/moderation.service";

const LISTING_ID = "22222222-2222-4222-8222-222222222201";
const SELLER_ID = "00000000-0000-4000-8000-000000000001";
const DEALER_ID = "11111111-1111-4111-8111-111111111101";

function makeListingRow(overrides: Record<string, unknown> = {}) {
  return {
    id: LISTING_ID,
    seller_id: SELLER_ID,
    vin: "WP1AA2A59MLB12345",
    year: 2023,
    make: "Porsche",
    model: "Macan",
    trim: "S",
    mileage_km: 24_000,
    status: "ACTIVE",
    reserve_price_cents: 6_200_000,
    bid_count: 3,
    auction_started_at: "2026-11-20T00:00:00.000Z",
    auction_ends_at: "2026-11-21T00:00:00.000Z",
    closed_at: null,
    province: "ON",
    city: "Toronto",
    postal_code: "M5V 2T6",
    transmission: "Automatic",
    drivetrain: "AWD",
    exterior_color: "Chalk",
    interior_color: "Black",
    keys_count: 2,
    has_lien: false,
    lien_details: "",
    accident_declaration: false,
    accident_count: 0,
    damage_grade: "A",
    damage_hotspot_count: 0,
    engine_spec: "2.9L V6",
    declaration_owner_attested: true,
    declaration_accurate_condition: true,
    declaration_no_unpaid_fines: true,
    moderation_notes: null,
    seller_notes: null,
    service_history_notes: null,
    created_at: "2026-11-19T12:00:00.000Z",
    ...overrides,
  };
}

describe("Sealed-Bid Listing Secrecy, Dashboard & Moderation (AC-04 / H1)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGeocodePostal.mockResolvedValue({
      postalCode: "M5V 2T6",
      province: "ON",
      city: "Toronto",
      locationWkt: "SRID=4326;POINT(-79.389 43.645)",
    });
  });

  describe("getSellerListingDetail() sealed-bid secrecy invariant", () => {
    it.each(["ACTIVE", "DRAFT", "PENDING_MODERATION", "EDITS_REQUESTED"] as const)(
      "never queries bids and strictly omits unsealedBids/selectedBid/appointmentVoucher when listing status is %s",
      async (status) => {
        const queriedTables: string[] = [];
        const { supabase } = createMockSupabaseClient((state) => {
          queriedTables.push(state.table);
          if (state.table === "listings") {
            return { data: makeListingRow({ status }) };
          }
          if (state.table === "listing_media") {
            return {
              data: [
                { id: "m1", public_url: "https://cdn/1.webp", is_cover: true, sort_order: 0 },
              ],
            };
          }
          return { data: [] };
        });

        const sellerCtx = makeSessionContext({ userId: SELLER_ID, supabase });
        const detail = await getSellerListingDetail(sellerCtx, LISTING_ID);

        expect(queriedTables).not.toContain("bids");
        expect(queriedTables).not.toContain("matches");
        expect(detail.auction.status).toBe(status);
        expect(detail.auction.bidCount).toBe(3);
        expect(detail.unsealedBids).toBeUndefined();
        expect(detail.selectedBid).toBeUndefined();
        expect(detail.appointmentVoucher).toBeUndefined();
      }
    );

    it("hydrates ranked unsealedBids on UNSEALED listings (and handles empty bids)", async () => {
      const { supabase, admin } = createMockSupabaseClient(
        (state) => {
          if (state.table === "listings") return { data: makeListingRow({ status: "UNSEALED" }) };
          if (state.table === "listing_media" || state.table === "damage_hotspots") {
            return { data: [] };
          }
          if (state.table === "bids") {
            return {
              data: [
                {
                  id: "bid-1",
                  dealership_id: DEALER_ID,
                  amount_cents: 6_450_000,
                  created_at: "2026-11-20T05:00:00Z",
                  revised_at: null,
                  status: "ACTIVE",
                },
              ],
            };
          }
          if (state.table === "dealerships") {
            return {
              data: [
                {
                  id: DEALER_ID,
                  operating_name: "Pfaff Automotive",
                  license_number: "OMVIC-88123",
                  province: "ON",
                  city: "Woodbridge",
                  rating: 4.9,
                  review_count: 14,
                  payout_speed_days: 1,
                  certified_pre_inspection: true,
                },
              ],
            };
          }
          return { data: null };
        },
        () => ({
          data: [{ dealership_id: DEALER_ID, distance_km: 18.4 }],
          error: null,
        })
      );
      mockCreateAdminClient.mockReturnValue(admin);

      const adminCtx = makeSessionContext({ role: "ADMIN", userId: "admin-1", supabase });
      const detail = await getSellerListingDetail(adminCtx, LISTING_ID);

      expect(detail.unsealedBids).toHaveLength(1);
      expect(detail.unsealedBids?.[0]).toMatchObject({
        dealershipName: "Pfaff Automotive",
        bidAmountCents: 6_450_000,
        distanceKm: 18.4,
      });
      expect(detail.appointmentVoucher).toBeUndefined();

      const { supabase: zeroBidsSb } = createMockSupabaseClient((state) => {
        if (state.table === "listings") return { data: makeListingRow({ status: "UNSEALED" }) };
        return { data: [] };
      });
      const zeroDetail = await getSellerListingDetail(
        makeSessionContext({ userId: SELLER_ID, supabase: zeroBidsSb }),
        LISTING_ID
      );
      expect(zeroDetail.unsealedBids).toEqual([]);
    });

    it("hydrates selectedBid & appointmentVoucher, handles missing match, not found, and DB errors", async () => {
      const { supabase, admin } = createMockSupabaseClient((state) => {
        if (state.table === "listings") {
          return { data: makeListingRow({ status: "COMPLETED" }) };
        }
        if (state.table === "listing_media") {
          return {
            data: [
              { id: "m1", public_url: "https://cdn/a.webp", is_cover: false, sort_order: 0 },
            ],
          };
        }
        if (state.table === "damage_hotspots") {
          return {
            data: [{ id: "h1", panel: "Bumper", severity: "MINOR", description: "Scuff" }],
          };
        }
        if (state.table === "bids") {
          return {
            data: [
              {
                id: "bid-win",
                dealership_id: DEALER_ID,
                amount_cents: 6_500_000,
                created_at: "2026-11-20T05:00:00Z",
                revised_at: "2026-11-20T06:00:00Z",
                status: "WON",
              },
            ],
          };
        }
        if (state.table === "dealerships") {
          return {
            data: [
              {
                id: DEALER_ID,
                operating_name: "Pfaff Automotive",
                license_number: "OMVIC-88123",
                regulator: "OMVIC",
                street_address: "100 Auto Park Circle",
                province: "ON",
                city: "Woodbridge",
                postal_code: "L4L 8R2",
                contact_phone: "+19055551234",
                contact_email: "desk@pfaff.ca",
                operating_hours: "Mon-Sat 9-6",
                rating: 4.9,
                review_count: 14,
                payout_speed_days: 1,
                certified_pre_inspection: true,
              },
            ],
          };
        }
        if (state.table === "matches") {
          return {
            data: {
              id: "match-1",
              winning_bid_id: "bid-win",
              dealership_id: DEALER_ID,
              voucher_code: "ANX-ON-XYZ123",
              agreed_amount_cents: 6_500_000,
              accept_expires_at: "2026-11-21T12:00:00Z",
            },
          };
        }
        return { data: null };
      });
      mockCreateAdminClient.mockReturnValue(admin);

      const ownerCtx = makeSessionContext({ userId: SELLER_ID, supabase });
      const completedDetail = await getSellerListingDetail(ownerCtx, LISTING_ID);
      expect(completedDetail.selectedBid?.id).toBe("bid-win");
      expect(completedDetail.appointmentVoucher?.voucherCode).toBe("ANX-ON-XYZ123");

      const otherSellerCtx = makeSessionContext({
        userId: "99999999-9999-4999-8999-999999999999",
        supabase,
      });
      await expect(
        getSellerListingDetail(otherSellerCtx, LISTING_ID)
      ).rejects.toBeInstanceOf(ForbiddenError);

      await expect(
        getSellerListingDetail(ownerCtx, "bad-uuid")
      ).rejects.toBeInstanceOf(NotFoundError);

      const { supabase: notFoundSb } = createMockSupabaseClient(() => ({ data: null }));
      await expect(
        getSellerListingDetail(makeSessionContext({ supabase: notFoundSb }), LISTING_ID)
      ).rejects.toBeInstanceOf(NotFoundError);

      const { supabase: dbErrSb } = createMockSupabaseClient(() => ({
        error: { message: "timeout" },
      }));
      await expect(
        getSellerListingDetail(makeSessionContext({ supabase: dbErrSb }), LISTING_ID)
      ).rejects.toBeInstanceOf(ExternalServiceError);

      const { supabase: bidsErrSb } = createMockSupabaseClient((state) => {
        if (state.table === "listings") return { data: makeListingRow({ status: "UNSEALED" }) };
        if (state.table === "bids") return { error: { message: "bids error" } };
        return { data: [] };
      });
      await expect(
        getSellerListingDetail(
          makeSessionContext({ userId: SELLER_ID, supabase: bidsErrSb }),
          LISTING_ID
        )
      ).rejects.toBeInstanceOf(ExternalServiceError);
    });
  });

  describe("getSellerDashboard() & createListing()", () => {
    it("computes integer CAD totals, sorts cover media, maps notifications, and handles errors", async () => {
      const { supabase } = createMockSupabaseClient((state) => {
        if (state.table === "listings") {
          return {
            data: [
              makeListingRow({
                status: "ACTIVE",
                bid_count: 4,
                listing_media: [
                  { public_url: "https://cdn/2.webp", is_cover: false, sort_order: 1 },
                  { public_url: "https://cdn/1.webp", is_cover: true, sort_order: 2 },
                ],
              }),
              makeListingRow({ id: "l2", status: "COMPLETED", bid_count: 2 }),
            ],
          };
        }
        if (state.table === "matches") {
          return {
            data: [
              { final_price_cents: 6_100_000, agreed_amount_cents: 6_200_000 },
              { final_price_cents: null, agreed_amount_cents: 2_900_000 },
            ],
          };
        }
        if (state.table === "notifications") {
          return {
            data: [
              { id: "n1", title: "Bid", description: "d", created_at: "2026-11-20T00:00:00Z", type: "BID", read: false, listing_id: LISTING_ID },
              { id: "n2", title: "KYC", description: "d", created_at: "2026-11-20T00:00:00Z", type: "KYC", read: true, listing_id: null },
              { id: "n3", title: "Billing", description: "d", created_at: "2026-11-20T00:00:00Z", type: "BILLING", read: true, listing_id: null },
            ],
          };
        }
        return { data: [] };
      });

      const sellerCtx = makeSessionContext({ userId: SELLER_ID, supabase });
      const dash = await getSellerDashboard(sellerCtx);

      expect(dash.stats).toEqual({
        activeAuctionsCount: 1,
        totalBidsReceived: 6,
        completedSalesCount: 1,
        totalValueEarnedCents: 9_000_000,
      });
      expect(dash.auctions[0]?.thumbnailUrl).toBe("https://cdn/1.webp");
      expect(dash.notifications.map((n) => n.type)).toEqual([
        "BID",
        "KYC",
        "SYSTEM",
      ]);

      const { supabase: errSb } = createMockSupabaseClient(() => ({
        error: { message: "dashboard failed" },
      }));
      await expect(
        getSellerDashboard(makeSessionContext({ supabase: errSb }))
      ).rejects.toBeInstanceOf(ExternalServiceError);
    });

    it("enforces KYC, field validation, photo bounds, active VIN uniqueness, damage grades, and happy path", async () => {
      const unverifiedCtx = makeSessionContext({ kycStatus: "PENDING" });
      await expect(
        createListing(
          unverifiedCtx,
          {
            vin: "WP1AA2A59MLB12345",
            year: 2023,
            make: "Porsche",
            model: "Macan",
            mileageKm: 20_000,
            reservePriceCents: 5_000_000,
            damageHotspots: [],
            declarationOwnerAttested: true,
            declarationAccurateCondition: true,
            declarationNoUnpaidFines: true,
          },
          { ipAddress: null, userAgent: null }
        )
      ).rejects.toMatchObject({ status: 403, code: "KYC_REQUIRED" });

      await expect(
        createListing(
          makeSessionContext({ kycStatus: "VERIFIED" }),
          {
            vin: "WP1AA2A59MLB12345",
            reservePriceCents: 5_000_000,
            damageHotspots: [],
            declarationOwnerAttested: true,
            declarationAccurateCondition: true,
            declarationNoUnpaidFines: true,
          },
          { ipAddress: null, userAgent: null }
        )
      ).rejects.toBeInstanceOf(ValidationError);

      const { admin: cfgAdmin } = createMockSupabaseClient((state) => {
        if (state.table === "platform_config") return { data: { value_json: "2" } };
        if (state.table === "listings") return { data: null };
        return { data: null };
      });
      mockCreateAdminClient.mockReturnValue(cfgAdmin);

      await expect(
        createListing(
          makeSessionContext({ kycStatus: "VERIFIED" }),
          {
            vin: "WP1AA2A59MLB12345",
            year: 2023,
            make: "Porsche",
            model: "Macan",
            mileageKm: 20_000,
            photoUrls: ["https://cdn/1.webp"],
            reservePriceCents: 5_000_000,
            damageHotspots: [],
            declarationOwnerAttested: true,
            declarationAccurateCondition: true,
            declarationNoUnpaidFines: true,
          },
          { ipAddress: null, userAgent: null }
        )
      ).rejects.toBeInstanceOf(ValidationError);

      const manyPhotos = Array.from({ length: 31 }, (_, i) => `https://cdn/${i}.webp`);
      await expect(
        createListing(
          makeSessionContext({ kycStatus: "VERIFIED" }),
          {
            vin: "WP1AA2A59MLB12345",
            year: 2023,
            make: "Porsche",
            model: "Macan",
            mileageKm: 20_000,
            photoUrls: manyPhotos,
            reservePriceCents: 5_000_000,
            damageHotspots: [],
            declarationOwnerAttested: true,
            declarationAccurateCondition: true,
            declarationNoUnpaidFines: true,
          },
          { ipAddress: null, userAgent: null }
        )
      ).rejects.toBeInstanceOf(ValidationError);

      const { admin: dupVinAdmin } = createMockSupabaseClient((state) => {
        if (state.table === "platform_config") return { data: { value_json: 2 } };
        if (state.table === "listings") return { data: { id: "existing-id" } };
        return { data: null };
      });
      mockCreateAdminClient.mockReturnValue(dupVinAdmin);

      await expect(
        createListing(
          makeSessionContext({ kycStatus: "VERIFIED" }),
          {
            vin: "WP1AA2A59MLB12345",
            year: 2023,
            make: "Porsche",
            model: "Macan",
            mileageKm: 20_000,
            photoUrls: ["https://cdn/1.webp", "https://cdn/2.webp"],
            reservePriceCents: 5_000_000,
            damageHotspots: [],
            declarationOwnerAttested: true,
            declarationAccurateCondition: true,
            declarationNoUnpaidFines: true,
          },
          { ipAddress: null, userAgent: null }
        )
      ).rejects.toMatchObject({ status: 409, code: "ACTIVE_VIN_EXISTS" });

      const rollbackOps: MockQueryState[] = [];
      const { supabase: failMediaSb, admin: failMediaAdmin } = createMockSupabaseClient((state) => {
        if (state.table === "platform_config") return { data: { value_json: 2 } };
        if (state.table === "listings" && state.op === "select") return { data: null };
        if (state.table === "listings" && state.op === "insert") {
          return { data: makeListingRow({ status: "PENDING_MODERATION" }) };
        }
        if (state.table === "listings" && state.op === "delete") {
          rollbackOps.push(state);
          return { data: null };
        }
        if (state.table === "listing_media") return { error: { message: "fail" } };
        return { data: null };
      });
      mockCreateAdminClient.mockReturnValue(failMediaAdmin);

      await expect(
        createListing(
          makeSessionContext({ kycStatus: "VERIFIED", supabase: failMediaSb }),
          {
            vin: "WP1AA2A59MLB12345",
            year: 2023,
            make: "Porsche",
            model: "Macan",
            mileageKm: 20_000,
            photos: [
              { publicUrl: "https://cdn/1.webp", s3Key: "k1", isCover: true },
              { previewUrl: "https://cdn/2.webp", fileName: "2.webp" },
            ],
            reservePriceCents: 5_000_000,
            damageHotspots: [{ severity: "SEVERE", panel: "Bumper" }],
            declarationOwnerAttested: true,
            declarationAccurateCondition: true,
            declarationNoUnpaidFines: true,
          },
          { ipAddress: null, userAgent: null }
        )
      ).rejects.toMatchObject({ status: 502 });
      expect(rollbackOps).toHaveLength(1);

      // Happy path with MODERATE hotspot (grade C) & photoUrls
      const { supabase: happySb, admin: happyAdmin } = createMockSupabaseClient((state) => {
        if (state.table === "platform_config") return { data: null };
        if (state.table === "listings" && state.op === "select") return { data: null };
        if (state.table === "listings" && state.op === "insert") {
          return { data: makeListingRow({ status: "PENDING_MODERATION" }) };
        }
        return { data: null };
      });
      mockCreateAdminClient.mockReturnValue(happyAdmin);

      const created = await createListing(
        makeSessionContext({ kycStatus: "VERIFIED", supabase: happySb }),
        {
          vin: "WP1AA2A59MLB12345",
          year: 2023,
          make: "Porsche",
          model: "Macan",
          mileageKm: 20_000,
          photoUrls: Array.from({ length: 8 }, (_, i) => `https://cdn/p${i}.webp`),
          coverPhotoUrl: "https://cdn/p2.webp",
          reservePriceCents: 5_000_000,
          damageHotspots: [{ severity: "MODERATE", areaLabel: "Hood" }],
          declarationOwnerAttested: true,
          declarationAccurateCondition: true,
          declarationNoUnpaidFines: true,
        },
        { ipAddress: "198.51.100.1", userAgent: "Vitest" }
      );
      expect(created.photoCount).toBe(8);
      expect(created.hotspotCount).toBe(1);
      expect(created.coverPhotoUrl).toBe("https://cdn/p2.webp");
    });
  });

  describe("moderation.service & dealer-feed secrecy helpers", () => {
    it("covers moderation queue, dossier guards, all 3 decisions, and race conflicts", async () => {
      expect(
        moderationDecisionSchema.safeParse({
          action: "REJECT",
          reason: "bad",
        }).success
      ).toBe(false);
      expect(
        moderationDecisionSchema.safeParse({ action: "APPROVE" }).success
      ).toBe(true);

      const { admin } = createMockSupabaseClient((state) => {
        if (state.table === "listings" && state.op === "select") {
          return {
            data: [
              makeListingRow({ status: "PENDING_MODERATION" }),
              makeListingRow({ id: "l-edit", status: "EDITS_REQUESTED" }),
              makeListingRow({ id: "l-rej", status: "REJECTED" }),
            ],
          };
        }
        if (state.table === "listing_media") return { data: [] };
        if (state.table === "profiles") {
          return {
            data: [
              {
                id: SELLER_ID,
                first_name: "Sarah",
                last_name: "Jenkins",
                email: "seller@autonexa.ca",
                phone_e164: "+14165550100",
                city: "Toronto",
                kyc_status: "VERIFIED",
              },
            ],
          };
        }
        return { data: null };
      });
      mockCreateAdminClient.mockReturnValue(admin);

      const queue = await listModerationQueue(
        makeSessionContext({ role: "ADMIN" })
      );
      expect(queue.counts).toMatchObject({
        ALL: 3,
        PENDING: 1,
        EDITS_REQUESTED: 1,
        REJECTED: 1,
      });

      await expect(
        getModerationDossier(makeSessionContext({ role: "SELLER" }), LISTING_ID)
      ).rejects.toBeInstanceOf(ForbiddenError);
      await expect(
        getModerationDossier(makeSessionContext({ role: "ADMIN" }), "bad-uuid")
      ).rejects.toBeInstanceOf(NotFoundError);

      const { admin: dossierAdmin } = createMockSupabaseClient((state) => {
        if (state.table === "listings") return { data: makeListingRow({ status: "PENDING_MODERATION" }) };
        return { data: [] };
      });
      mockCreateAdminClient.mockReturnValue(dossierAdmin);
      const dossier = await getModerationDossier(
        makeSessionContext({ role: "ADMIN" }),
        LISTING_ID
      );
      expect(dossier.id).toBe(LISTING_ID);

      for (const [action, statusAfter, expectedMod] of [
        ["APPROVE", "ACTIVE", "APPROVED"],
        ["REQUEST_EDITS", "EDITS_REQUESTED", "EDITS_REQUESTED"],
        ["REJECT", "REJECTED", "REJECTED"],
      ] as const) {
        const { admin: decAdmin } = createMockSupabaseClient((state) => {
          if (state.table === "platform_config") return { data: { value_json: "24" } };
          if (state.table === "listings" && state.op === "select") {
            return { data: makeListingRow({ status: "PENDING_MODERATION" }) };
          }
          if (state.table === "listings" && state.op === "update") {
            return { data: makeListingRow({ status: statusAfter }) };
          }
          return { data: [] };
        });
        mockCreateAdminClient.mockReturnValue(decAdmin);
        mockNotifyModeration.mockRejectedValueOnce(new Error("Email failure"));

        const res = await decideListing(
          makeSessionContext({ role: "ADMIN" }),
          LISTING_ID,
          { action, reason: action === "APPROVE" ? undefined : "Clear reason provided" },
          { ipAddress: "127.0.0.1" }
        );
        expect(res.status).toBe(expectedMod);
      }

      const { admin: raceAdmin } = createMockSupabaseClient((state) => {
        if (state.table === "listings" && state.op === "select") {
          return { data: makeListingRow({ status: "PENDING_MODERATION" }) };
        }
        return { data: null };
      });
      mockCreateAdminClient.mockReturnValue(raceAdmin);
      await expect(
        decideListing(
          makeSessionContext({ role: "ADMIN" }),
          LISTING_ID,
          { action: "APPROVE" },
          { ipAddress: null }
        )
      ).rejects.toBeInstanceOf(ConflictError);
    });

    it("never reveals RESERVE_MET or reserve cents in dealer feed helpers", () => {
      expect(toReserveStatus(null)).toBe("NO_RESERVE");
      expect(toReserveStatus(0)).toBe("NO_RESERVE");
      expect(toReserveStatus(4_500_000)).toBe("RESERVE_PENDING");

      expect(normalizeDamageGrade(" b ")).toBe("B");
      expect(normalizeDamageGrade(" c ")).toBe("C");
      expect(normalizeDamageGrade(" d ")).toBe("D");
      expect(normalizeDamageGrade("unknown")).toBe("A");

      const ordered = sortPhotos([
        { public_url: "https://cdn/2.webp", is_cover: false, sort_order: 1 },
        { public_url: "https://cdn/cover.webp", is_cover: true, sort_order: 2 },
      ]);
      expect(ordered).toEqual([
        "https://cdn/cover.webp",
        "https://cdn/2.webp",
      ]);
      expect(sortPhotos([])).toHaveLength(1);
    });
  });
});
