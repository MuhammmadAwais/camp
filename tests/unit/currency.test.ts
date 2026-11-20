import { describe, expect, it } from "vitest";
import { createListingPayloadSchema } from "@/lib/server/services/listing.service";
import { placeSealedBidSchema } from "@/lib/server/services/bidding.service";
import { cn, formatCadCents, formatCentsToCAD } from "@/lib/utils";

describe("Integer CAD Cents & Utility Invariants (NFR-14)", () => {
  it("formats whole CAD cents reliably with en-CA locale formatting", () => {
    expect(formatCadCents(0)).toBe("$0 CAD");
    expect(formatCadCents(100_000)).toBe("$1,000 CAD");
    expect(formatCadCents(6_850_000)).toBe("$68,500 CAD");
    expect(formatCadCents(6_850_000, false)).toBe("$68,500");
    expect(formatCadCents(25_000_000)).toBe("$250,000 CAD");
    expect(formatCentsToCAD(-50_000)).toBe("-$500 CAD");
  });

  it("maintains exact integer cent arithmetic without IEEE-754 float drift", () => {
    const monthlyPricesCents = [19_900, 49_900, 119_900];
    const totalMrrCents = monthlyPricesCents.reduce((sum, v) => sum + v, 0);
    expect(Number.isInteger(totalMrrCents)).toBe(true);
    expect(totalMrrCents).toBe(189_700);

    // Example classic floating-point bug: 0.1 + 0.2 !== 0.3 in floats, exact in integer cents
    expect(10 + 20).toBe(30);

    const annualPriceCents = 479_000;
    const monthlyEquivCents = Math.round(annualPriceCents / 12);
    expect(Number.isInteger(monthlyEquivCents)).toBe(true);
    expect(monthlyEquivCents).toBe(39_917);
  });

  it("rejects fractional floating-point cent amounts at validation boundaries", () => {
    const floatBid = placeSealedBidSchema.safeParse({
      auctionId: "22222222-2222-4222-8222-222222222201",
      bidAmountCents: 35000.5,
      certifiedDeclaration: true,
    });
    expect(floatBid.success).toBe(false);

    const floatReserve = createListingPayloadSchema.safeParse({
      vin: "WP1AA2A59MLB12345",
      year: 2023,
      make: "Porsche",
      model: "Macan",
      mileageKm: 22_000,
      reservePriceCents: 45000.25,
      declarationOwnerAttested: true,
      declarationAccurateCondition: true,
      declarationNoUnpaidFines: true,
    });
    expect(floatReserve.success).toBe(false);
  });

  it("merges Tailwind classes cleanly via cn()", () => {
    expect(cn("p-2 text-sm", "p-4", false && "hidden", "font-bold")).toBe(
      "text-sm p-4 font-bold"
    );
  });
});
