import { constructWebhookEvent } from "@/lib/server/adapters/billing.adapter";
import { handleApiRoute, ok } from "@/lib/server/http";
import { processStripeWebhookEvent } from "@/lib/server/services/stripe-webhook.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = handleApiRoute(async (request) => {
  // Always read the unparsed raw request body so Stripe HMAC signature verification matches byte-for-byte.
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");

  const event = constructWebhookEvent(rawBody, signature);
  const result = await processStripeWebhookEvent(event);

  return ok(result);
});
