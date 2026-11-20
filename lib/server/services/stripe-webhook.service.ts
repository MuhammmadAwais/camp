import type Stripe from "stripe";
import { retrieveStripeSubscription } from "@/lib/server/adapters/billing.adapter";
import { ExternalServiceError } from "@/lib/server/errors";
import { logger } from "@/lib/server/logger";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { Database, Json } from "@/lib/supabase/database.types";

type AdminClient = ReturnType<typeof createAdminSupabaseClient>;
type SubscriptionRow = Database["public"]["Tables"]["subscriptions"]["Row"];
type PlanRow = Database["public"]["Tables"]["plans"]["Row"];
type SubscriptionStatus = Database["public"]["Enums"]["subscription_status"];

export type StripeWebhookProcessResult = {
  received: true;
  eventId: string;
  eventType: string;
  duplicate: boolean;
  handled: boolean;
  reason?: string;
  dealershipId?: string;
  subscriptionStatus?: string;
};

type ResolvedSubscriptionContext = {
  subscription: SubscriptionRow | null;
  dealershipId: string | null;
  operatingName: string | null;
  province: string | null;
};

type PeriodBounds = {
  startIso: string;
  endIso: string;
  fromStripe: boolean;
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value: string | null | undefined): value is string {
  return Boolean(value && UUID_REGEX.test(value));
}

function extractStripeId(
  value: string | { id: string } | null | undefined
): string | null {
  if (!value) return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof value === "object" && typeof value.id === "string") {
    const trimmed = value.id.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  return null;
}

function mergeMetadata(
  ...sources: Array<Record<string, string> | null | undefined>
): Record<string, string> {
  const merged: Record<string, string> = {};
  for (const source of sources) {
    if (!source) continue;
    for (const [key, val] of Object.entries(source)) {
      if (typeof val === "string" && val.trim().length > 0) {
        merged[key] = val.trim();
      }
    }
  }
  return merged;
}

function addBillingInterval(date: Date, interval: "month" | "year"): Date {
  const next = new Date(date.getTime());
  if (interval === "year") {
    next.setUTCFullYear(next.getUTCFullYear() + 1);
  } else {
    next.setUTCMonth(next.getUTCMonth() + 1);
  }
  return next;
}

function defaultPeriod(interval: "month" | "year"): PeriodBounds {
  const now = new Date();
  return {
    startIso: now.toISOString(),
    endIso: addBillingInterval(now, interval).toISOString(),
    fromStripe: false,
  };
}

function unixBoundsOrNull(
  startSec: number | null | undefined,
  endSec: number | null | undefined
): PeriodBounds | null {
  if (
    typeof startSec === "number" &&
    typeof endSec === "number" &&
    Number.isFinite(startSec) &&
    Number.isFinite(endSec) &&
    startSec > 0 &&
    endSec > startSec
  ) {
    return {
      startIso: new Date(startSec * 1000).toISOString(),
      endIso: new Date(endSec * 1000).toISOString(),
      fromStripe: true,
    };
  }
  return null;
}

type LegacyInvoiceFields = {
  subscription?: string | { id: string } | null;
  payment_intent?: string | { id: string } | null;
};

type LegacyLinePriceFields = {
  price?: string | { id: string } | null;
};

type LegacySubscriptionPeriodFields = {
  current_period_start?: number;
  current_period_end?: number;
};

function extractInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const v23Sub = extractStripeId(
    invoice.parent?.subscription_details?.subscription
  );
  if (v23Sub) return v23Sub;

  const legacy = invoice as unknown as LegacyInvoiceFields;
  return extractStripeId(legacy.subscription);
}

function extractInvoicePaymentIntentId(
  invoice: Stripe.Invoice
): string | null {
  const firstPayment = invoice.payments?.data?.[0];
  const v23Pi = extractStripeId(firstPayment?.payment?.payment_intent);
  if (v23Pi) return v23Pi;

  const legacy = invoice as unknown as LegacyInvoiceFields;
  return extractStripeId(legacy.payment_intent);
}

function extractInvoiceMetadata(
  invoice: Stripe.Invoice
): Record<string, string> {
  const lineMeta = invoice.lines?.data?.[0]?.metadata ?? null;
  const subDetailsMeta =
    invoice.parent?.subscription_details?.metadata ?? null;
  return mergeMetadata(lineMeta, subDetailsMeta, invoice.metadata);
}

function extractInvoicePriceId(invoice: Stripe.Invoice): string | null {
  const firstLine = invoice.lines?.data?.[0];
  if (!firstLine) return null;

  const v23Price = extractStripeId(firstLine.pricing?.price_details?.price);
  if (v23Price) return v23Price;

  const legacyLine = firstLine as unknown as LegacyLinePriceFields;
  return extractStripeId(legacyLine.price);
}

function extractInvoicePeriod(
  invoice: Stripe.Invoice,
  interval: "month" | "year"
): PeriodBounds {
  const firstLinePeriod = invoice.lines?.data?.[0]?.period;
  const fromLine = unixBoundsOrNull(
    firstLinePeriod?.start,
    firstLinePeriod?.end
  );
  if (fromLine) return fromLine;

  const fromInvoice = unixBoundsOrNull(
    invoice.period_start,
    invoice.period_end
  );
  if (fromInvoice) return fromInvoice;

  return defaultPeriod(interval);
}

function extractSubscriptionPeriod(
  sub: Stripe.Subscription,
  interval: "month" | "year"
): PeriodBounds {
  const firstItem = sub.items?.data?.[0];
  const fromItem = unixBoundsOrNull(
    firstItem?.current_period_start,
    firstItem?.current_period_end
  );
  if (fromItem) return fromItem;

  const legacySub = sub as unknown as LegacySubscriptionPeriodFields;
  const fromLegacy = unixBoundsOrNull(
    legacySub.current_period_start,
    legacySub.current_period_end
  );
  if (fromLegacy) return fromLegacy;

  return defaultPeriod(interval);
}

function deriveInvoiceNumber(
  stripeInvoiceNumber: string | null | undefined,
  stripeInvoiceId: string | null
): string {
  const cleanedNumber = stripeInvoiceNumber?.trim();
  if (cleanedNumber) return cleanedNumber;

  if (stripeInvoiceId) {
    const suffix = stripeInvoiceId
      .replace(/^in_/, "")
      .replace(/[^A-Za-z0-9]/g, "")
      .toUpperCase()
      .slice(0, 18);
    if (suffix.length > 0) {
      return `INV-${suffix}`;
    }
  }

  return `INV-${Date.now()}`;
}

function mapStripeSubscriptionStatus(
  rawStatus: Stripe.Subscription.Status,
  fallback: SubscriptionStatus
): SubscriptionStatus {
  switch (rawStatus) {
    case "active":
      return "ACTIVE";
    case "trialing":
      return "TRIALING";
    case "past_due":
    case "unpaid":
    case "incomplete":
      return "PAST_DUE";
    case "canceled":
    case "incomplete_expired":
      return "EXPIRED";
    case "paused":
      return "CANCELLED";
    default:
      return fallback;
  }
}

async function resolveSubscriptionAndDealership(
  admin: AdminClient,
  hints: {
    stripeSubscriptionId?: string | null;
    stripeCustomerId?: string | null;
    dealershipId?: string | null;
  }
): Promise<ResolvedSubscriptionContext> {
  let sub: SubscriptionRow | null = null;

  if (hints.stripeSubscriptionId) {
    const { data } = await admin
      .from("subscriptions")
      .select("*")
      .eq("stripe_subscription_id", hints.stripeSubscriptionId)
      .maybeSingle();
    sub = data ?? null;
  }

  if (!sub && hints.stripeCustomerId) {
    const { data } = await admin
      .from("subscriptions")
      .select("*")
      .eq("stripe_customer_id", hints.stripeCustomerId)
      .maybeSingle();
    sub = data ?? null;
  }

  const candidateDealershipId = isUuid(hints.dealershipId)
    ? hints.dealershipId
    : null;

  if (!sub && candidateDealershipId) {
    const { data } = await admin
      .from("subscriptions")
      .select("*")
      .eq("dealership_id", candidateDealershipId)
      .maybeSingle();
    sub = data ?? null;
  }

  const dealershipId = sub?.dealership_id ?? candidateDealershipId;
  if (!dealershipId) {
    return {
      subscription: null,
      dealershipId: null,
      operatingName: null,
      province: null,
    };
  }

  const { data: dealership } = await admin
    .from("dealerships")
    .select("id, operating_name, province")
    .eq("id", dealershipId)
    .maybeSingle();

  return {
    subscription: sub,
    dealershipId: dealership?.id ?? null,
    operatingName: dealership?.operating_name ?? null,
    province: dealership?.province ?? null,
  };
}

async function resolvePlanRow(
  admin: AdminClient,
  hints: {
    planId?: string | null;
    planSlug?: string | null;
    stripePriceId?: string | null;
    fallbackPlanId?: string | null;
  }
): Promise<PlanRow | null> {
  if (isUuid(hints.planId)) {
    const { data } = await admin
      .from("plans")
      .select("*")
      .eq("id", hints.planId)
      .maybeSingle();
    if (data) return data;
  }

  if (hints.planSlug) {
    const { data } = await admin
      .from("plans")
      .select("*")
      .eq("slug", hints.planSlug)
      .maybeSingle();
    if (data) return data;
  }

  if (hints.stripePriceId) {
    const { data } = await admin
      .from("plans")
      .select("*")
      .eq("stripe_price_id", hints.stripePriceId)
      .maybeSingle();
    if (data) return data;
  }

  if (isUuid(hints.fallbackPlanId)) {
    const { data } = await admin
      .from("plans")
      .select("*")
      .eq("id", hints.fallbackPlanId)
      .maybeSingle();
    if (data) return data;
  }

  return null;
}

async function upsertPaymentByStripeInvoiceId(
  admin: AdminClient,
  params: {
    subscriptionId: string;
    dealershipId: string;
    stripeInvoiceId: string | null;
    stripeInvoiceNumber: string | null | undefined;
    stripePaymentIntentId: string | null;
    amountCents: number;
    status: "PAID" | "FAILED";
    description: string;
    invoicePdfUrl: string | null;
    paidAt: string | null;
  }
): Promise<string> {
  const safeAmountCents = Math.max(0, Math.trunc(params.amountCents));

  if (params.stripeInvoiceId) {
    const { data: existing } = await admin
      .from("payments")
      .select("id, invoice_number")
      .eq("stripe_invoice_id", params.stripeInvoiceId)
      .maybeSingle();

    if (existing) {
      const { error } = await admin
        .from("payments")
        .update({
          subscription_id: params.subscriptionId,
          dealership_id: params.dealershipId,
          amount_cents: safeAmountCents,
          status: params.status,
          description: params.description,
          stripe_payment_intent_id: params.stripePaymentIntentId,
          invoice_pdf_url: params.invoicePdfUrl,
          paid_at: params.paidAt,
          refunded_at: null,
        })
        .eq("id", existing.id);

      if (error) {
        throw new ExternalServiceError(
          "Failed to update billing payment record.",
          "EXTERNAL_SERVICE_ERROR",
          error
        );
      }

      return existing.id;
    }
  }

  const invoiceNumber = deriveInvoiceNumber(
    params.stripeInvoiceNumber,
    params.stripeInvoiceId
  );

  const { data: inserted, error } = await admin
    .from("payments")
    .insert({
      subscription_id: params.subscriptionId,
      dealership_id: params.dealershipId,
      invoice_number: invoiceNumber,
      amount_cents: safeAmountCents,
      currency: "CAD",
      status: params.status,
      description: params.description,
      stripe_invoice_id: params.stripeInvoiceId,
      stripe_payment_intent_id: params.stripePaymentIntentId,
      invoice_pdf_url: params.invoicePdfUrl,
      paid_at: params.paidAt,
      refunded_at: null,
    })
    .select("id")
    .single();

  if (error || !inserted) {
    throw new ExternalServiceError(
      "Failed to insert billing payment record.",
      "EXTERNAL_SERVICE_ERROR",
      error
    );
  }

  return inserted.id;
}

async function notifyDealershipAdmins(
  admin: AdminClient,
  params: {
    dealershipId: string;
    title: string;
    description: string;
    metadata: Record<string, Json>;
  }
): Promise<void> {
  const [{ data: seatRows }, { data: adminProfileRows }] = await Promise.all([
    admin
      .from("dealership_members")
      .select("user_id")
      .eq("dealership_id", params.dealershipId)
      .eq("seat_role", "DEALER_ADMIN")
      .eq("is_active", true),
    admin
      .from("profiles")
      .select("id, email")
      .eq("dealership_id", params.dealershipId)
      .eq("role", "DEALER_ADMIN")
      .eq("account_status", "ACTIVE"),
  ]);

  const recipientIds = new Set<string>();
  for (const row of seatRows ?? []) recipientIds.add(row.user_id);
  for (const row of adminProfileRows ?? []) recipientIds.add(row.id);

  if (recipientIds.size === 0) return;

  const { data: profiles } = await admin
    .from("profiles")
    .select("id, email")
    .in("id", Array.from(recipientIds));

  const emailById = new Map((profiles ?? []).map((p) => [p.id, p.email]));

  for (const userId of recipientIds) {
    const { data: notif } = await admin
      .from("notifications")
      .insert({
        user_id: userId,
        type: "BILLING",
        title: params.title,
        description: params.description,
        metadata: params.metadata,
      })
      .select("id")
      .single();

    await admin.from("notification_deliveries").insert({
      notification_id: notif?.id ?? null,
      user_id: userId,
      channel: "EMAIL",
      provider: "dunning_sandbox",
      recipient_address: emailById.get(userId) ?? null,
      status: "SANDBOX_LOGGED",
    });
  }
}

async function appendSystemAuditLog(
  admin: AdminClient,
  params: {
    action: string;
    entityId: string;
    province: string | null;
    details: string;
    beforeJson?: Json;
    afterJson?: Json;
  }
): Promise<void> {
  const { error } = await admin.from("audit_logs").insert({
    actor_id: null,
    actor_name: "Stripe Webhook",
    actor_role: "SYSTEM",
    action: params.action,
    entity_type: "subscription",
    entity_id: params.entityId,
    before_json: params.beforeJson ?? null,
    after_json: params.afterJson ?? null,
    details: params.details,
    provincial_jurisdiction: params.province,
  });

  if (error) {
    throw new ExternalServiceError(
      "Failed to write Stripe webhook audit log entry.",
      "EXTERNAL_SERVICE_ERROR",
      error
    );
  }
}

async function handleCheckoutSessionCompleted(
  admin: AdminClient,
  event: Stripe.Event
): Promise<Omit<StripeWebhookProcessResult, "received" | "eventId" | "eventType" | "duplicate">> {
  const session = event.data.object as Stripe.Checkout.Session;
  if (session.mode !== "subscription") {
    return { handled: false, reason: "non_subscription_checkout" };
  }

  const stripeCustomerId = extractStripeId(session.customer);
  const expandedSub =
    typeof session.subscription === "object" && session.subscription !== null
      ? session.subscription
      : null;
  const stripeSubscriptionId = extractStripeId(session.subscription);
  const subObj =
    expandedSub ??
    (stripeSubscriptionId
      ? await retrieveStripeSubscription(stripeSubscriptionId)
      : null);

  const metadata = mergeMetadata(subObj?.metadata, session.metadata);
  const dealershipIdHint =
    metadata.dealership_id ?? session.client_reference_id ?? null;

  const resolved = await resolveSubscriptionAndDealership(admin, {
    stripeSubscriptionId,
    stripeCustomerId,
    dealershipId: dealershipIdHint,
  });

  if (!resolved.dealershipId) {
    logger.warn("Stripe checkout.session.completed missing dealership context", {
      meta: { eventId: event.id, sessionId: session.id },
    });
    return { handled: false, reason: "dealership_not_resolved" };
  }

  const subPriceId = extractStripeId(subObj?.items?.data?.[0]?.price);
  const plan = await resolvePlanRow(admin, {
    planId: metadata.plan_id,
    planSlug: metadata.plan_slug,
    stripePriceId: subPriceId,
    fallbackPlanId: resolved.subscription?.plan_id ?? null,
  });

  if (!plan) {
    logger.warn("Stripe checkout.session.completed could not resolve CAD plan", {
      meta: {
        eventId: event.id,
        dealershipId: resolved.dealershipId,
      },
    });
    return {
      handled: false,
      reason: "plan_not_resolved",
      dealershipId: resolved.dealershipId,
    };
  }

  const interval = plan.billing_interval === "year" ? "year" : "month";
  const period = subObj
    ? extractSubscriptionPeriod(subObj, interval)
    : defaultPeriod(interval);

  const { data: upsertedSub, error: upsertError } = await admin
    .from("subscriptions")
    .upsert(
      {
        dealership_id: resolved.dealershipId,
        plan_id: plan.id,
        status: "ACTIVE",
        stripe_customer_id:
          stripeCustomerId ?? resolved.subscription?.stripe_customer_id ?? null,
        stripe_subscription_id:
          stripeSubscriptionId ??
          resolved.subscription?.stripe_subscription_id ??
          null,
        current_period_start: period.startIso,
        current_period_end: period.endIso,
        bids_used: 0,
        auto_renew: true,
        cancelled_at: null,
      },
      { onConflict: "dealership_id" }
    )
    .select("*")
    .single();

  if (upsertError || !upsertedSub) {
    throw new ExternalServiceError(
      "Failed to activate subscription after Stripe Checkout.",
      "EXTERNAL_SERVICE_ERROR",
      upsertError
    );
  }

  await appendSystemAuditLog(admin, {
    action: "SUBSCRIPTION_CHECKOUT_COMPLETED",
    entityId: upsertedSub.id,
    province: resolved.province,
    beforeJson: resolved.subscription
      ? {
          planId: resolved.subscription.plan_id,
          status: resolved.subscription.status,
          bidsUsed: resolved.subscription.bids_used,
        }
      : null,
    afterJson: {
      dealershipId: resolved.dealershipId,
      planSlug: plan.slug,
      status: upsertedSub.status,
      bidsUsed: upsertedSub.bids_used,
      stripeEventId: event.id,
    },
    details: `Activated ${plan.slug} CAD subscription for ${
      resolved.operatingName ?? resolved.dealershipId
    } via Stripe Checkout`,
  });

  return {
    handled: true,
    dealershipId: resolved.dealershipId,
    subscriptionStatus: upsertedSub.status,
  };
}

async function handleInvoicePaid(
  admin: AdminClient,
  event: Stripe.Event
): Promise<Omit<StripeWebhookProcessResult, "received" | "eventId" | "eventType" | "duplicate">> {
  const invoice = event.data.object as Stripe.Invoice;
  const currency = (invoice.currency ?? "CAD").toUpperCase();
  if (currency !== "CAD") {
    logger.warn("Ignored non-CAD Stripe invoice.paid event", {
      meta: { eventId: event.id, currency },
    });
    return { handled: false, reason: "unsupported_currency" };
  }

  const stripeCustomerId = extractStripeId(invoice.customer);
  const stripeSubscriptionId = extractInvoiceSubscriptionId(invoice);
  const metadata = extractInvoiceMetadata(invoice);
  const stripePriceId = extractInvoicePriceId(invoice);

  const resolved = await resolveSubscriptionAndDealership(admin, {
    stripeSubscriptionId,
    stripeCustomerId,
    dealershipId: metadata.dealership_id ?? null,
  });

  if (!resolved.dealershipId) {
    logger.warn("Stripe invoice.paid could not resolve dealership", {
      meta: { eventId: event.id, stripeInvoiceId: invoice.id },
    });
    return { handled: false, reason: "dealership_not_resolved" };
  }

  const plan = await resolvePlanRow(admin, {
    planId: metadata.plan_id,
    planSlug: metadata.plan_slug,
    stripePriceId,
    fallbackPlanId: resolved.subscription?.plan_id ?? null,
  });

  if (!plan) {
    return {
      handled: false,
      reason: "plan_not_resolved",
      dealershipId: resolved.dealershipId,
    };
  }

  const interval = plan.billing_interval === "year" ? "year" : "month";
  const period = extractInvoicePeriod(invoice, interval);

  const { data: activeSub, error: subError } = await admin
    .from("subscriptions")
    .upsert(
      {
        dealership_id: resolved.dealershipId,
        plan_id: plan.id,
        status: "ACTIVE",
        stripe_customer_id:
          stripeCustomerId ?? resolved.subscription?.stripe_customer_id ?? null,
        stripe_subscription_id:
          stripeSubscriptionId ??
          resolved.subscription?.stripe_subscription_id ??
          null,
        current_period_start: period.startIso,
        current_period_end: period.endIso,
        bids_used: 0,
        auto_renew: true,
        cancelled_at: null,
      },
      { onConflict: "dealership_id" }
    )
    .select("*")
    .single();

  if (subError || !activeSub) {
    throw new ExternalServiceError(
      "Failed to sync paid subscription quota and period.",
      "EXTERNAL_SERVICE_ERROR",
      subError
    );
  }

  const stripeInvoiceId =
    typeof invoice.id === "string" && invoice.id.trim().length > 0
      ? invoice.id.trim()
      : null;
  const amountCents =
    typeof invoice.amount_paid === "number" && invoice.amount_paid >= 0
      ? Math.trunc(invoice.amount_paid)
      : plan.price_cents;
  const paidAtSec = invoice.status_transitions?.paid_at;
  const paidAtIso =
    typeof paidAtSec === "number" && paidAtSec > 0
      ? new Date(paidAtSec * 1000).toISOString()
      : new Date().toISOString();
  const description =
    invoice.lines?.data?.[0]?.description?.trim() ||
    `${plan.name} Plan (${interval === "year" ? "Annual" : "Monthly"} CAD)`;

  const paymentId = await upsertPaymentByStripeInvoiceId(admin, {
    subscriptionId: activeSub.id,
    dealershipId: resolved.dealershipId,
    stripeInvoiceId,
    stripeInvoiceNumber: invoice.number,
    stripePaymentIntentId: extractInvoicePaymentIntentId(invoice),
    amountCents,
    status: "PAID",
    description,
    invoicePdfUrl: invoice.invoice_pdf ?? invoice.hosted_invoice_url ?? null,
    paidAt: paidAtIso,
  });

  await appendSystemAuditLog(admin, {
    action: "SUBSCRIPTION_INVOICE_PAID",
    entityId: activeSub.id,
    province: resolved.province,
    beforeJson: resolved.subscription
      ? {
          status: resolved.subscription.status,
          bidsUsed: resolved.subscription.bids_used,
        }
      : null,
    afterJson: {
      dealershipId: resolved.dealershipId,
      paymentId,
      stripeInvoiceId,
      amountCents,
      status: activeSub.status,
      bidsUsed: activeSub.bids_used,
      stripeEventId: event.id,
    },
    details: `Recorded PAID CAD invoice (${amountCents} cents) and reset monthly bid quota for ${
      resolved.operatingName ?? resolved.dealershipId
    }`,
  });

  return {
    handled: true,
    dealershipId: resolved.dealershipId,
    subscriptionStatus: activeSub.status,
  };
}

async function handleInvoicePaymentFailed(
  admin: AdminClient,
  event: Stripe.Event
): Promise<Omit<StripeWebhookProcessResult, "received" | "eventId" | "eventType" | "duplicate">> {
  const invoice = event.data.object as Stripe.Invoice;
  const currency = (invoice.currency ?? "CAD").toUpperCase();
  if (currency !== "CAD") {
    logger.warn("Ignored non-CAD Stripe invoice.payment_failed event", {
      meta: { eventId: event.id, currency },
    });
    return { handled: false, reason: "unsupported_currency" };
  }

  const stripeCustomerId = extractStripeId(invoice.customer);
  const stripeSubscriptionId = extractInvoiceSubscriptionId(invoice);
  const metadata = extractInvoiceMetadata(invoice);

  const resolved = await resolveSubscriptionAndDealership(admin, {
    stripeSubscriptionId,
    stripeCustomerId,
    dealershipId: metadata.dealership_id ?? null,
  });

  if (!resolved.subscription || !resolved.dealershipId) {
    logger.warn("Stripe invoice.payment_failed could not resolve subscription", {
      meta: { eventId: event.id, stripeInvoiceId: invoice.id },
    });
    return { handled: false, reason: "subscription_not_found" };
  }

  const { error: updateErr } = await admin
    .from("subscriptions")
    .update({ status: "PAST_DUE" })
    .eq("id", resolved.subscription.id);

  if (updateErr) {
    throw new ExternalServiceError(
      "Failed to mark subscription PAST_DUE after payment failure.",
      "EXTERNAL_SERVICE_ERROR",
      updateErr
    );
  }

  const stripeInvoiceId =
    typeof invoice.id === "string" && invoice.id.trim().length > 0
      ? invoice.id.trim()
      : null;
  const amountDueCents =
    typeof invoice.amount_due === "number" && invoice.amount_due >= 0
      ? Math.trunc(invoice.amount_due)
      : 0;
  const description =
    invoice.lines?.data?.[0]?.description?.trim() ||
    "Subscription Renewal Payment Failed (CAD)";

  const paymentId = await upsertPaymentByStripeInvoiceId(admin, {
    subscriptionId: resolved.subscription.id,
    dealershipId: resolved.dealershipId,
    stripeInvoiceId,
    stripeInvoiceNumber: invoice.number,
    stripePaymentIntentId: extractInvoicePaymentIntentId(invoice),
    amountCents: amountDueCents,
    status: "FAILED",
    description,
    invoicePdfUrl: invoice.invoice_pdf ?? invoice.hosted_invoice_url ?? null,
    paidAt: null,
  });

  await notifyDealershipAdmins(admin, {
    dealershipId: resolved.dealershipId,
    title: "Action Required: Subscription Payment Failed",
    description:
      "Your recent CAD subscription payment failed. Bidding access is paused until you update your payment method in Billing & Invoices.",
    metadata: {
      dealershipId: resolved.dealershipId,
      subscriptionId: resolved.subscription.id,
      stripeInvoiceId,
      amountDueCents,
      actionUrl: "/dealer/billing",
    },
  });

  await appendSystemAuditLog(admin, {
    action: "SUBSCRIPTION_PAYMENT_FAILED",
    entityId: resolved.subscription.id,
    province: resolved.province,
    beforeJson: { status: resolved.subscription.status },
    afterJson: {
      dealershipId: resolved.dealershipId,
      paymentId,
      stripeInvoiceId,
      amountDueCents,
      status: "PAST_DUE",
      stripeEventId: event.id,
    },
    details: `Marked subscription PAST_DUE and sent dunning notice for ${
      resolved.operatingName ?? resolved.dealershipId
    }`,
  });

  return {
    handled: true,
    dealershipId: resolved.dealershipId,
    subscriptionStatus: "PAST_DUE",
  };
}

async function handleSubscriptionDeleted(
  admin: AdminClient,
  event: Stripe.Event
): Promise<Omit<StripeWebhookProcessResult, "received" | "eventId" | "eventType" | "duplicate">> {
  const stripeSub = event.data.object as Stripe.Subscription;
  const stripeCustomerId = extractStripeId(stripeSub.customer);

  const resolved = await resolveSubscriptionAndDealership(admin, {
    stripeSubscriptionId: stripeSub.id,
    stripeCustomerId,
    dealershipId: stripeSub.metadata?.dealership_id ?? null,
  });

  if (!resolved.subscription || !resolved.dealershipId) {
    logger.warn(
      "Stripe customer.subscription.deleted could not resolve subscription",
      { meta: { eventId: event.id, stripeSubscriptionId: stripeSub.id } }
    );
    return { handled: false, reason: "subscription_not_found" };
  }

  const cancelledAtIso =
    typeof stripeSub.canceled_at === "number" && stripeSub.canceled_at > 0
      ? new Date(stripeSub.canceled_at * 1000).toISOString()
      : new Date().toISOString();

  const { error: updateErr } = await admin
    .from("subscriptions")
    .update({
      status: "EXPIRED",
      auto_renew: false,
      cancelled_at: cancelledAtIso,
    })
    .eq("id", resolved.subscription.id);

  if (updateErr) {
    throw new ExternalServiceError(
      "Failed to mark deleted Stripe subscription EXPIRED.",
      "EXTERNAL_SERVICE_ERROR",
      updateErr
    );
  }

  await notifyDealershipAdmins(admin, {
    dealershipId: resolved.dealershipId,
    title: "Subscription Expired — Bidding Paused",
    description:
      "Your dealership CAD subscription has been cancelled or expired. Select a wholesale plan to resume placing sealed bids.",
    metadata: {
      dealershipId: resolved.dealershipId,
      subscriptionId: resolved.subscription.id,
      stripeSubscriptionId: stripeSub.id,
      actionUrl: "/dealer/subscription",
    },
  });

  await appendSystemAuditLog(admin, {
    action: "SUBSCRIPTION_EXPIRED",
    entityId: resolved.subscription.id,
    province: resolved.province,
    beforeJson: {
      status: resolved.subscription.status,
      autoRenew: resolved.subscription.auto_renew,
    },
    afterJson: {
      dealershipId: resolved.dealershipId,
      status: "EXPIRED",
      autoRenew: false,
      cancelledAt: cancelledAtIso,
      stripeEventId: event.id,
    },
    details: `Marked subscription EXPIRED following Stripe subscription deletion for ${
      resolved.operatingName ?? resolved.dealershipId
    }`,
  });

  return {
    handled: true,
    dealershipId: resolved.dealershipId,
    subscriptionStatus: "EXPIRED",
  };
}

async function handleSubscriptionUpdated(
  admin: AdminClient,
  event: Stripe.Event
): Promise<Omit<StripeWebhookProcessResult, "received" | "eventId" | "eventType" | "duplicate">> {
  const stripeSub = event.data.object as Stripe.Subscription;
  const stripeCustomerId = extractStripeId(stripeSub.customer);

  const resolved = await resolveSubscriptionAndDealership(admin, {
    stripeSubscriptionId: stripeSub.id,
    stripeCustomerId,
    dealershipId: stripeSub.metadata?.dealership_id ?? null,
  });

  if (!resolved.subscription || !resolved.dealershipId) {
    return { handled: false, reason: "subscription_not_found" };
  }

  const nextStatus = mapStripeSubscriptionStatus(
    stripeSub.status,
    resolved.subscription.status
  );
  const subPriceId = extractStripeId(stripeSub.items?.data?.[0]?.price);
  const plan = await resolvePlanRow(admin, {
    planId: stripeSub.metadata?.plan_id,
    planSlug: stripeSub.metadata?.plan_slug,
    stripePriceId: subPriceId,
    fallbackPlanId: resolved.subscription.plan_id,
  });

  const interval = plan?.billing_interval === "year" ? "year" : "month";
  const period = extractSubscriptionPeriod(stripeSub, interval);
  const cancelledAtIso =
    typeof stripeSub.canceled_at === "number" && stripeSub.canceled_at > 0
      ? new Date(stripeSub.canceled_at * 1000).toISOString()
      : nextStatus === "ACTIVE" || nextStatus === "TRIALING"
        ? null
        : resolved.subscription.cancelled_at;

  const updatePayload: Database["public"]["Tables"]["subscriptions"]["Update"] = {
    status: nextStatus,
    auto_renew: !stripeSub.cancel_at_period_end,
    cancelled_at: cancelledAtIso,
    stripe_customer_id:
      stripeCustomerId ?? resolved.subscription.stripe_customer_id,
    stripe_subscription_id:
      stripeSub.id || resolved.subscription.stripe_subscription_id,
    ...(plan ? { plan_id: plan.id } : {}),
    ...(period.fromStripe
      ? {
          current_period_start: period.startIso,
          current_period_end: period.endIso,
        }
      : {}),
  };

  const { error: updateErr } = await admin
    .from("subscriptions")
    .update(updatePayload)
    .eq("id", resolved.subscription.id);

  if (updateErr) {
    throw new ExternalServiceError(
      "Failed to synchronize subscription state from Stripe.",
      "EXTERNAL_SERVICE_ERROR",
      updateErr
    );
  }

  await appendSystemAuditLog(admin, {
    action: "SUBSCRIPTION_UPDATED",
    entityId: resolved.subscription.id,
    province: resolved.province,
    beforeJson: {
      status: resolved.subscription.status,
      planId: resolved.subscription.plan_id,
      autoRenew: resolved.subscription.auto_renew,
    },
    afterJson: {
      dealershipId: resolved.dealershipId,
      status: nextStatus,
      planId: plan?.id ?? resolved.subscription.plan_id,
      autoRenew: !stripeSub.cancel_at_period_end,
      stripeEventId: event.id,
    },
    details: `Synchronized subscription status (${nextStatus}) for ${
      resolved.operatingName ?? resolved.dealershipId
    }`,
  });

  return {
    handled: true,
    dealershipId: resolved.dealershipId,
    subscriptionStatus: nextStatus,
  };
}

/**
 * Processes a signature-verified Stripe event atomically and idempotently using
 * `stripe_webhook_events(event_id PRIMARY KEY)`.
 */
export async function processStripeWebhookEvent(
  event: Stripe.Event
): Promise<StripeWebhookProcessResult> {
  const admin = createAdminSupabaseClient();

  const payloadSummary: Json = {
    type: event.type,
    apiVersion: event.api_version ?? null,
    created: event.created,
    livemode: event.livemode,
  };

  // Atomic idempotency claim prevents duplicate renewals or quota resets under retries.
  const { error: claimError } = await admin
    .from("stripe_webhook_events")
    .insert({
      event_id: event.id,
      event_type: event.type,
      payload_summary: payloadSummary,
    });

  if (claimError) {
    if (claimError.code === "23505") {
      return {
        received: true,
        eventId: event.id,
        eventType: event.type,
        duplicate: true,
        handled: false,
        reason: "duplicate_event",
      };
    }

    throw new ExternalServiceError(
      "Unable to persist Stripe webhook idempotency record.",
      "EXTERNAL_SERVICE_ERROR",
      claimError
    );
  }

  try {
    let outcome: Omit<
      StripeWebhookProcessResult,
      "received" | "eventId" | "eventType" | "duplicate"
    >;

    switch (event.type) {
      case "checkout.session.completed":
        outcome = await handleCheckoutSessionCompleted(admin, event);
        break;
      case "invoice.paid":
        outcome = await handleInvoicePaid(admin, event);
        break;
      case "invoice.payment_failed":
        outcome = await handleInvoicePaymentFailed(admin, event);
        break;
      case "customer.subscription.deleted":
        outcome = await handleSubscriptionDeleted(admin, event);
        break;
      case "customer.subscription.updated":
        outcome = await handleSubscriptionUpdated(admin, event);
        break;
      default:
        outcome = { handled: false, reason: "unhandled_event_type" };
        break;
    }

    return {
      received: true,
      eventId: event.id,
      eventType: event.type,
      duplicate: false,
      ...outcome,
    };
  } catch (err) {
    // Release claim on transient failure so Stripe automatic retries can re-process safely.
    await admin
      .from("stripe_webhook_events")
      .delete()
      .eq("event_id", event.id);
    throw err;
  }
}
