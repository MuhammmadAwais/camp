import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { mockApiDisabled, ok, fail, parseJson, simulateLatency } from "@/lib/mock/http";

const bidSchema = z.object({
  auctionId: z.string().min(1),
  bidAmountCents: z.number().int().min(100000, "Bid must be at least $1,000 CAD"),
  certifiedDeclaration: z.literal(true, {
    message: "You must attest to the legally binding dealer purchase agreement",
  }),
});

export async function POST(request: NextRequest) {
  const disabled = mockApiDisabled();
  if (disabled) return disabled;

  await simulateLatency(250);

  const parsed = await parseJson(request, bidSchema);
  if ("response" in parsed) {
    return parsed.response;
  }

  const { data } = parsed;

  return ok({
    success: true,
    auctionId: data.auctionId,
    bidAmountCents: data.bidAmountCents,
    placedAt: new Date().toISOString(),
    message: "Sealed bid securely submitted to AutoNexa dealer exchange.",
  });
}
