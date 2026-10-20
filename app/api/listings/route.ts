import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { mockApiDisabled, ok, fail, parseJson, simulateLatency } from "@/lib/mock/http";

const createListingSchema = z.object({
  vin: z.string().min(17).max(17),
  postalCode: z.string().min(3),
  decodedVehicle: z.record(z.string(), z.any()).nullable(),
  specs: z.object({
    mileageKm: z.number().int().min(1).max(999999),
    transmission: z.string().nullable().optional(),
    drivetrain: z.string().nullable().optional(),
    exteriorColor: z.string().nullable().optional(),
    interiorColor: z.string().nullable().optional(),
    keysCount: z.number().int().min(1).max(10).optional().default(2),
    accidentDeclaration: z.boolean().optional().default(false),
    accidentCount: z.number().int().optional().default(0),
    accidentDetails: z.string().optional().default(""),
    hasLien: z.boolean().optional().default(false),
    lienDetails: z.string().optional().default(""),
  }),
  damageHotspots: z.array(
    z.object({
      id: z.string(),
      viewpoint: z.string(),
      xPercent: z.number(),
      yPercent: z.number(),
      severity: z.enum(["MINOR", "MODERATE", "SEVERE"]),
      panel: z.string(),
      description: z.string().optional(),
      photoUrl: z.string().optional(),
    })
  ).optional().default([]),
  photos: z.array(
    z.object({
      id: z.string(),
      previewUrl: z.string(),
      s3Key: z.string().optional(),
      fileName: z.string(),
      fileSizeBytes: z.number(),
      isCover: z.boolean(),
      status: z.string(),
      progress: z.number(),
    })
  ).min(1, "At least 1 photo is required"),
  reservePriceCents: z.number().int().min(0).nullable(),
  declarationOwnerAttested: z.literal(true, { message: "You must attest to legal ownership to list this vehicle" }),
  declarationAccurateCondition: z.literal(true, { message: "You must declare vehicle condition accurately" }),
  declarationNoUnpaidFines: z.literal(true, { message: "You must authorize lien and settlement terms" }),
});

export type CreateListingInput = z.infer<typeof createListingSchema>;

export async function POST(request: NextRequest) {
  const disabled = mockApiDisabled();
  if (disabled) return disabled;

  await simulateLatency(400);

  const parsed = await parseJson(request, createListingSchema);
  if ("response" in parsed) {
    return parsed.response;
  }

  const { data } = parsed;

  const listingId = `auc-${data.vin.slice(0, 8).toLowerCase()}-${Date.now().toString(36)}`;
  const now = new Date();
  const auctionEndsAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

  const responsePayload = {
    id: listingId,
    vin: data.vin,
    year: data.decodedVehicle?.year ?? 2022,
    make: data.decodedVehicle?.make ?? "Vehicle",
    model: data.decodedVehicle?.model ?? "Sedan",
    trim: data.decodedVehicle?.trim ?? "",
    mileageKm: data.specs.mileageKm,
    status: "PENDING_MODERATION",
    reservePriceCents: data.reservePriceCents,
    coverPhotoUrl: data.photos.find((p) => p.isCover)?.previewUrl ?? data.photos[0]?.previewUrl,
    photoCount: data.photos.length,
    hotspotCount: data.damageHotspots.length,
    createdAt: now.toISOString(),
    auctionEndsAt,
    message: "Listing successfully submitted for dealer wholesale auction moderation.",
  };

  return ok(responsePayload, 201);
}
