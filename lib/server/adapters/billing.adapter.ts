import Stripe from "stripe";
import { getServerEnv } from "@/lib/server/env";
import {
  AppError,
  BadRequestError,
  ExternalServiceError,
} from "@/lib/server/errors";

let cachedClient: Stripe | null = null;
let cachedSecretKey: string | null = null;

function getStripeClient(): Stripe {
  const { stripeSecretKey } = getServerEnv();
  if (!stripeSecretKey) {
    throw new AppError({
      status: 503,
      code: "BILLING_NOT_CONFIGURED",
      message:
        "Stripe billing is not configured in this environment. Add STRIPE_SECRET_KEY to enable live CAD checkout and customer billing portal sessions.",
    });
  }

  if (!cachedClient || cachedSecretKey !== stripeSecretKey) {
    cachedClient = new Stripe(stripeSecretKey, {
      typescript: true,
    });
    cachedSecretKey = stripeSecretKey;
  }

  return cachedClient;
}

export function isStripeConfigured(): boolean {
  return Boolean(getServerEnv().stripeSecretKey);
}

export function isStripeWebhookConfigured(): boolean {
  const env = getServerEnv();
  return Boolean(env.stripeSecretKey && env.stripeWebhookSecret);
}

async function ensureStripeCustomerId(
  stripe: Stripe,
  params: {
    existingCustomerId: string | null;
    email: string;
    dealershipName: string;
    dealershipId: string;
  }
): Promise<string> {
  if (params.existingCustomerId) {
    return params.existingCustomerId;
  }

  const customer = await stripe.customers.create({
    email: params.email,
    name: params.dealershipName,
    metadata: {
      dealership_id: params.dealershipId,
    },
  });

  return customer.id;
}

export type CreateCheckoutSessionInput = {
  dealershipId: string;
  dealershipName: string;
  customerEmail: string;
  stripeCustomerId: string | null;
  planId: string;
  planSlug: string;
  planName: string;
  billingInterval: "month" | "year";
  priceCents: number;
  stripePriceId: string | null;
  successUrl: string;
  cancelUrl: string;
};

export type CreateCheckoutSessionOutput = {
  checkoutUrl: string;
  sessionId: string;
  stripeCustomerId: string;
};

/**
 * Creates a Stripe Checkout Session in CAD for the dealership's selected plan.
 * Falls back to inline CAD `price_data` when `plans.stripe_price_id` is null.
 */
export async function createCheckoutSession(
  input: CreateCheckoutSessionInput
): Promise<CreateCheckoutSessionOutput> {
  const stripe = getStripeClient();

  try {
    const customerId = await ensureStripeCustomerId(stripe, {
      existingCustomerId: input.stripeCustomerId,
      email: input.customerEmail,
      dealershipName: input.dealershipName,
      dealershipId: input.dealershipId,
    });

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
      input.stripePriceId
        ? [{ price: input.stripePriceId, quantity: 1 }]
        : [
            {
              price_data: {
                currency: "cad",
                unit_amount: input.priceCents,
                recurring: {
                  interval: input.billingInterval,
                },
                product_data: {
                  name: `AutoNexa ${input.planName} (${
                    input.billingInterval === "year" ? "Annual" : "Monthly"
                  } CAD)`,
                  metadata: {
                    plan_id: input.planId,
                    plan_slug: input.planSlug,
                  },
                },
              },
              quantity: 1,
            },
          ];

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: lineItems,
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      client_reference_id: input.dealershipId,
      allow_promotion_codes: true,
      subscription_data: {
        metadata: {
          dealership_id: input.dealershipId,
          plan_id: input.planId,
          plan_slug: input.planSlug,
        },
      },
      metadata: {
        dealership_id: input.dealershipId,
        plan_id: input.planId,
        plan_slug: input.planSlug,
      },
    });

    if (!session.url) {
      throw new ExternalServiceError(
        "Stripe Checkout session did not return a redirect URL.",
        "EXTERNAL_SERVICE_ERROR"
      );
    }

    return {
      checkoutUrl: session.url,
      sessionId: session.id,
      stripeCustomerId: customerId,
    };
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new ExternalServiceError(
      "Unable to initialize Stripe Checkout session.",
      "EXTERNAL_SERVICE_ERROR",
      err
    );
  }
}

export type CreateBillingPortalInput = {
  dealershipId: string;
  dealershipName: string;
  customerEmail: string;
  stripeCustomerId: string | null;
  returnUrl: string;
};

export type CreateBillingPortalOutput = {
  portalUrl: string;
  stripeCustomerId: string;
};

/**
 * Creates a Stripe Customer Billing Portal session so DEALER_ADMINs can manage
 * payment methods and view hosted Stripe receipts.
 */
export async function createBillingPortalSession(
  input: CreateBillingPortalInput
): Promise<CreateBillingPortalOutput> {
  const stripe = getStripeClient();

  try {
    const customerId = await ensureStripeCustomerId(stripe, {
      existingCustomerId: input.stripeCustomerId,
      email: input.customerEmail,
      dealershipName: input.dealershipName,
      dealershipId: input.dealershipId,
    });

    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: input.returnUrl,
    });

    return {
      portalUrl: portal.url,
      stripeCustomerId: customerId,
    };
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new ExternalServiceError(
      "Unable to open Stripe Billing Portal session.",
      "EXTERNAL_SERVICE_ERROR",
      err
    );
  }
}

/**
 * Verifies Stripe webhook HMAC signatures against the raw request body.
 */
export function constructWebhookEvent(
  rawBody: string | Buffer,
  signatureHeader: string | null
): Stripe.Event {
  const stripe = getStripeClient();
  const { stripeWebhookSecret } = getServerEnv();

  if (!stripeWebhookSecret) {
    throw new AppError({
      status: 503,
      code: "BILLING_NOT_CONFIGURED",
      message: "STRIPE_WEBHOOK_SECRET is not configured in this environment.",
    });
  }

  if (!signatureHeader || signatureHeader.trim().length === 0) {
    throw new BadRequestError(
      "Missing Stripe-Signature header.",
      "INVALID_STRIPE_SIGNATURE"
    );
  }

  try {
    return stripe.webhooks.constructEvent(
      rawBody,
      signatureHeader,
      stripeWebhookSecret
    );
  } catch (err) {
    throw new BadRequestError(
      "Invalid Stripe webhook signature.",
      "INVALID_STRIPE_SIGNATURE",
      { reason: err instanceof Error ? err.message : "verification_failed" }
    );
  }
}
