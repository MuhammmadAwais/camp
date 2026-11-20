import { z } from "zod";
import {
  createBillingPortalSession,
  createCheckoutSession,
  isStripeConfigured,
} from "@/lib/server/adapters/billing.adapter";
import type { SessionContext } from "@/lib/server/auth";
import { getServerEnv } from "@/lib/server/env";
import {
  ExternalServiceError,
  ForbiddenError,
  NotFoundError,
} from "@/lib/server/errors";
import { sanitizeCsvCell } from "@/lib/server/services/admin-analytics.service";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { Database, Json } from "@/lib/supabase/database.types";
import type {
  AdminDealerRegulator,
  AdminDealerStatus,
  AdminSubscriptionItem,
  AdminSubscriptionsResponse,
} from "@/lib/types/admin";
import type {
  DealerActiveSubscription,
  DealerBillingInvoicesResponse,
  DealerBillingPortalResponse,
  DealerCheckoutResponse,
  DealerInvoiceItem,
  DealerInvoiceStatus,
  DealerSubscriptionResponse,
  SubscriptionPlanItem,
} from "@/lib/types/dealer";

type PlanRow = Database["public"]["Tables"]["plans"]["Row"];
type SubscriptionRow = Database["public"]["Tables"]["subscriptions"]["Row"];
type PaymentRow = Database["public"]["Tables"]["payments"]["Row"];

const emptyToUndefined = (val: unknown): unknown =>
  val === "" || val === null || val === undefined ? undefined : val;

export const checkoutPayloadSchema = z
  .object({
    planId: z.string().uuid("Invalid plan identifier.").optional(),
    planSlug: z.string().trim().min(1).max(80).optional(),
  })
  .refine(
    (data) => Boolean(data.planId || data.planSlug),
    "Specify either planId or planSlug."
  );

export type CheckoutPayloadInput = z.output<typeof checkoutPayloadSchema>;

export const dealerInvoicesQuerySchema = z.object({
  year: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      const upper = String(val).trim().toUpperCase();
      return upper === "ALL" ? undefined : upper;
    },
    z.string().regex(/^\d{4}$/, "Year must be 4 digits.").optional()
  ),
  status: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      const upper = String(val).trim().toUpperCase();
      return upper === "ALL" ? undefined : upper;
    },
    z.enum(["PAID", "FAILED", "REFUNDED", "OPEN"]).optional()
  ),
  search: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(120).optional()
  ),
  format: z.preprocess(
    (val) =>
      emptyToUndefined(val) === undefined
        ? "json"
        : String(val).trim().toLowerCase(),
    z.enum(["json", "csv"]).default("json")
  ),
});

export type DealerInvoicesQuery = z.output<typeof dealerInvoicesQuerySchema>;

export const adminSubscriptionsQuerySchema = z.object({
  status: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      const upper = String(val).trim().toUpperCase();
      return upper === "ALL" ? undefined : upper;
    },
    z
      .enum(["ACTIVE", "TRIALING", "PAST_DUE", "EXPIRED", "CANCELLED"])
      .optional()
  ),
  province: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      const upper = String(val).trim().toUpperCase();
      return upper === "ALL" ? undefined : upper;
    },
    z.string().regex(/^[A-Z]{2}$/, "Invalid province code.").optional()
  ),
  search: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(120).optional()
  ),
});

export type AdminSubscriptionsQuery = z.output<
  typeof adminSubscriptionsQuerySchema
>;

function parsePlanFeatures(raw: Json): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function mapPlanRow(row: PlanRow): SubscriptionPlanItem {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    billingInterval: row.billing_interval === "year" ? "year" : "month",
    priceCents: row.price_cents,
    currency: "CAD",
    monthlyBidQuota: row.monthly_bid_quota,
    maxRadiusKm: row.max_radius_km,
    maxTeamSeats: row.max_team_seats,
    stripePriceId: row.stripe_price_id,
    features: parsePlanFeatures(row.features_json),
  };
}

function mapActiveSubscription(
  sub: SubscriptionRow | null,
  plan: PlanRow | null
): DealerActiveSubscription | null {
  if (!sub || !plan) return null;
  return {
    id: sub.id,
    planId: sub.plan_id,
    planSlug: plan.slug,
    planName: plan.name,
    billingInterval: plan.billing_interval === "year" ? "year" : "month",
    priceCents: plan.price_cents,
    status: sub.status,
    bidsUsed: sub.bids_used,
    monthlyBidQuota: plan.monthly_bid_quota,
    maxRadiusKm: plan.max_radius_km,
    maxTeamSeats: plan.max_team_seats,
    currentPeriodStart: sub.current_period_start,
    currentPeriodEnd: sub.current_period_end,
    autoRenew: sub.auto_renew,
    cancelledAt: sub.cancelled_at,
    stripeCustomerLinked: Boolean(sub.stripe_customer_id),
  };
}

function normalizeInvoiceStatus(raw: string): DealerInvoiceStatus {
  if (raw === "PAID" || raw === "FAILED" || raw === "REFUNDED" || raw === "OPEN") {
    return raw;
  }
  return "OPEN";
}

function resolveAppBaseUrl(requestOrigin?: string | null): string {
  const candidate =
    requestOrigin || getServerEnv().appUrl || "http://localhost:3000";
  try {
    return new URL(candidate).origin;
  } catch {
    return "http://localhost:3000";
  }
}

function assertDealerAdminOrAdmin(ctx: SessionContext): void {
  if (ctx.role !== "ADMIN" && ctx.seatRole !== "DEALER_ADMIN") {
    throw new ForbiddenError(
      "Only dealership administrators (DEALER_ADMIN) can manage billing and subscriptions."
    );
  }
}

/**
 * Loads active CAD subscription plans and the dealership's current quota & plan status.
 */
export async function getDealerSubscription(
  ctx: SessionContext & { dealershipId: string }
): Promise<DealerSubscriptionResponse> {
  const admin = createAdminSupabaseClient();

  const [plansRes, dealershipRes, subRes] = await Promise.all([
    admin
      .from("plans")
      .select("*")
      .eq("is_active", true)
      .order("price_cents", { ascending: true }),
    admin
      .from("dealerships")
      .select("id, operating_name, status")
      .eq("id", ctx.dealershipId)
      .maybeSingle(),
    admin
      .from("subscriptions")
      .select("*")
      .eq("dealership_id", ctx.dealershipId)
      .maybeSingle(),
  ]);

  if (plansRes.error) {
    throw new ExternalServiceError(
      "Unable to load CAD subscription plan catalog.",
      "EXTERNAL_SERVICE_ERROR",
      plansRes.error
    );
  }

  if (dealershipRes.error || !dealershipRes.data) {
    throw new NotFoundError("Dealership record not found.");
  }

  const allPlans = plansRes.data ?? [];
  const activePlanRow =
    subRes.data &&
    (allPlans.find((p) => p.id === subRes.data?.plan_id) ??
      (
        await admin
          .from("plans")
          .select("*")
          .eq("id", subRes.data.plan_id)
          .maybeSingle()
      ).data);

  return {
    plans: allPlans.map(mapPlanRow),
    currentSubscription: mapActiveSubscription(
      subRes.data ?? null,
      activePlanRow ?? null
    ),
    dealershipName: dealershipRes.data.operating_name,
    dealershipStatus: dealershipRes.data.status,
    canManageBilling:
      ctx.role === "ADMIN" || ctx.seatRole === "DEALER_ADMIN",
    stripeConfigured: isStripeConfigured(),
    serverTime: new Date().toISOString(),
  };
}

/**
 * Initiates a Stripe CAD Checkout session for upgrading/changing subscription tiers.
 */
export async function launchDealerCheckout(
  ctx: SessionContext & { dealershipId: string },
  input: CheckoutPayloadInput,
  requestMeta: { ipAddress: string | null; origin: string | null }
): Promise<DealerCheckoutResponse> {
  assertDealerAdminOrAdmin(ctx);

  const admin = createAdminSupabaseClient();
  let planQuery = admin.from("plans").select("*").eq("is_active", true);
  if (input.planId) {
    planQuery = planQuery.eq("id", input.planId);
  } else if (input.planSlug) {
    planQuery = planQuery.eq("slug", input.planSlug);
  }

  const [planRes, dealershipRes, subRes] = await Promise.all([
    planQuery.maybeSingle(),
    admin
      .from("dealerships")
      .select("id, operating_name, contact_email, province")
      .eq("id", ctx.dealershipId)
      .single(),
    admin
      .from("subscriptions")
      .select("id, stripe_customer_id")
      .eq("dealership_id", ctx.dealershipId)
      .maybeSingle(),
  ]);

  if (planRes.error || !planRes.data) {
    throw new NotFoundError("Selected subscription plan was not found.");
  }

  if (dealershipRes.error || !dealershipRes.data) {
    throw new NotFoundError("Dealership profile not found.");
  }

  const plan = planRes.data;
  const dealership = dealershipRes.data;
  const baseUrl = resolveAppBaseUrl(requestMeta.origin);

  const checkout = await createCheckoutSession({
    dealershipId: dealership.id,
    dealershipName: dealership.operating_name,
    customerEmail: dealership.contact_email || ctx.email,
    stripeCustomerId: subRes.data?.stripe_customer_id ?? null,
    planId: plan.id,
    planSlug: plan.slug,
    planName: plan.name,
    billingInterval: plan.billing_interval === "year" ? "year" : "month",
    priceCents: plan.price_cents,
    stripePriceId: plan.stripe_price_id,
    successUrl: `${baseUrl}/dealer/billing?checkout=success`,
    cancelUrl: `${baseUrl}/dealer/subscription?checkout=cancelled`,
  });

  if (
    subRes.data &&
    !subRes.data.stripe_customer_id &&
    checkout.stripeCustomerId
  ) {
    await admin
      .from("subscriptions")
      .update({ stripe_customer_id: checkout.stripeCustomerId })
      .eq("id", subRes.data.id);
  }

  const actorName =
    `${ctx.profile.first_name} ${ctx.profile.last_name}`.trim() || ctx.email;

  await admin.from("audit_logs").insert({
    actor_id: ctx.userId,
    actor_name: actorName,
    actor_role: ctx.role,
    action: "SUBSCRIPTION_CHECKOUT_INITIATED",
    entity_type: "subscription",
    entity_id: subRes.data?.id ?? dealership.id,
    provincial_jurisdiction: dealership.province,
    ip_address: requestMeta.ipAddress,
    details: `Initiated Stripe CAD checkout for plan ${plan.slug} (${plan.price_cents} cents)`,
    after_json: {
      dealershipId: dealership.id,
      planSlug: plan.slug,
      priceCents: plan.price_cents,
      stripeSessionId: checkout.sessionId,
    },
  });

  return {
    checkoutUrl: checkout.checkoutUrl,
    sessionId: checkout.sessionId,
    planSlug: plan.slug,
    serverTime: new Date().toISOString(),
  };
}

/**
 * Opens a Stripe Customer Billing Portal session for managing cards and receipts.
 */
export async function launchDealerBillingPortal(
  ctx: SessionContext & { dealershipId: string },
  requestMeta: { ipAddress: string | null; origin: string | null }
): Promise<DealerBillingPortalResponse> {
  assertDealerAdminOrAdmin(ctx);

  const admin = createAdminSupabaseClient();
  const [dealershipRes, subRes] = await Promise.all([
    admin
      .from("dealerships")
      .select("id, operating_name, contact_email, province")
      .eq("id", ctx.dealershipId)
      .single(),
    admin
      .from("subscriptions")
      .select("id, stripe_customer_id")
      .eq("dealership_id", ctx.dealershipId)
      .maybeSingle(),
  ]);

  if (dealershipRes.error || !dealershipRes.data) {
    throw new NotFoundError("Dealership profile not found.");
  }

  const dealership = dealershipRes.data;
  const baseUrl = resolveAppBaseUrl(requestMeta.origin);

  const portal = await createBillingPortalSession({
    dealershipId: dealership.id,
    dealershipName: dealership.operating_name,
    customerEmail: dealership.contact_email || ctx.email,
    stripeCustomerId: subRes.data?.stripe_customer_id ?? null,
    returnUrl: `${baseUrl}/dealer/billing`,
  });

  if (
    subRes.data &&
    !subRes.data.stripe_customer_id &&
    portal.stripeCustomerId
  ) {
    await admin
      .from("subscriptions")
      .update({ stripe_customer_id: portal.stripeCustomerId })
      .eq("id", subRes.data.id);
  }

  const actorName =
    `${ctx.profile.first_name} ${ctx.profile.last_name}`.trim() || ctx.email;

  await admin.from("audit_logs").insert({
    actor_id: ctx.userId,
    actor_name: actorName,
    actor_role: ctx.role,
    action: "BILLING_PORTAL_OPENED",
    entity_type: "subscription",
    entity_id: subRes.data?.id ?? dealership.id,
    provincial_jurisdiction: dealership.province,
    ip_address: requestMeta.ipAddress,
    details: `Opened Stripe Customer Billing Portal for ${dealership.operating_name}`,
  });

  return {
    portalUrl: portal.portalUrl,
    serverTime: new Date().toISOString(),
  };
}

function inferInvoicePlanLabel(description: string, fallbackName: string): string {
  const lower = description.toLowerCase();
  if (lower.includes("enterprise")) return "Enterprise";
  if (lower.includes("pro")) return "Pro";
  if (lower.includes("basic")) return "Basic";
  return fallbackName || "Wholesale";
}

function mapPaymentToInvoice(
  row: PaymentRow,
  fallbackPlanName: string
): DealerInvoiceItem {
  const billingDateIso = row.paid_at ?? row.created_at;
  return {
    id: row.id,
    invoiceNumber: row.invoice_number,
    amountCents: row.amount_cents,
    currency: "CAD",
    status: normalizeInvoiceStatus(row.status),
    description: row.description,
    planName: inferInvoicePlanLabel(row.description, fallbackPlanName),
    billingDateIso,
    year: billingDateIso.slice(0, 4),
    stripeInvoiceId: row.stripe_invoice_id,
    invoicePdfUrl: row.invoice_pdf_url,
    paidAt: row.paid_at,
  };
}

/**
 * Lists tenant-isolated billing invoices and subscription quota summary for
 * the authenticated DEALER_ADMIN's dealership (FR-DL-11).
 */
export async function listDealerInvoices(
  ctx: SessionContext & { dealershipId: string },
  query: Pick<DealerInvoicesQuery, "year" | "status" | "search">
): Promise<DealerBillingInvoicesResponse> {
  assertDealerAdminOrAdmin(ctx);

  const admin = createAdminSupabaseClient();

  const [dealershipRes, subRes, paymentsRes] = await Promise.all([
    admin
      .from("dealerships")
      .select("id, operating_name")
      .eq("id", ctx.dealershipId)
      .single(),
    admin
      .from("subscriptions")
      .select("*")
      .eq("dealership_id", ctx.dealershipId)
      .maybeSingle(),
    admin
      .from("payments")
      .select("*")
      .eq("dealership_id", ctx.dealershipId)
      .order("paid_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false }),
  ]);

  if (dealershipRes.error || !dealershipRes.data) {
    throw new NotFoundError("Dealership record not found.");
  }

  if (paymentsRes.error) {
    throw new ExternalServiceError(
      "Unable to load dealership invoices.",
      "EXTERNAL_SERVICE_ERROR",
      paymentsRes.error
    );
  }

  const planRow = subRes.data
    ? (
        await admin
          .from("plans")
          .select("*")
          .eq("id", subRes.data.plan_id)
          .maybeSingle()
      ).data
    : null;

  const activeSub = mapActiveSubscription(subRes.data ?? null, planRow ?? null);
  const allInvoices = (paymentsRes.data ?? []).map((row) =>
    mapPaymentToInvoice(row, activeSub?.planName ?? "Wholesale")
  );

  const q = query.search?.toLowerCase().trim() ?? "";
  const filtered = allInvoices.filter((inv) => {
    if (query.year && inv.year !== query.year) return false;
    if (query.status && inv.status !== query.status) return false;
    if (q) {
      return (
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.description.toLowerCase().includes(q) ||
        inv.planName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalPaidCents = filtered
    .filter((i) => i.status === "PAID")
    .reduce((sum, i) => sum + i.amountCents, 0);

  const bidsUsed = activeSub?.bidsUsed ?? 0;
  const bidsTotal = activeSub?.monthlyBidQuota ?? 0;

  return {
    items: filtered,
    subscription: activeSub,
    summary: {
      totalInvoicesCount: filtered.length,
      totalPaidCents,
      bidsUsed,
      bidsTotal,
      remainingBids: Math.max(0, bidsTotal - bidsUsed),
    },
    dealershipName: dealershipRes.data.operating_name,
    stripeConfigured: isStripeConfigured(),
    serverTime: new Date().toISOString(),
  };
}

/**
 * Formats tenant-isolated dealership billing invoices as RFC 4180 CSV.
 */
export function formatDealerInvoicesCsv(
  data: DealerBillingInvoicesResponse
): string {
  const headers = [
    "invoice_number",
    "billing_date_utc",
    "status",
    "plan_name",
    "description",
    "amount_cents",
    "amount_cad",
    "currency",
    "stripe_invoice_id",
  ];

  const rows = data.items.map((inv) =>
    [
      inv.invoiceNumber,
      inv.billingDateIso,
      inv.status,
      inv.planName,
      inv.description,
      inv.amountCents,
      (inv.amountCents / 100).toFixed(2),
      inv.currency,
      inv.stripeInvoiceId ?? "",
    ]
      .map(sanitizeCsvCell)
      .join(",")
  );

  return [headers.map(sanitizeCsvCell).join(","), ...rows].join("\r\n");
}

/**
 * Lists all dealership subscriptions, active seat utilization, and MRR metrics
 * across Canada for Admin SaaS visibility (FR-AD-05).
 */
export async function listAdminSubscriptions(
  ctx: SessionContext,
  query: AdminSubscriptionsQuery
): Promise<AdminSubscriptionsResponse> {
  if (ctx.role !== "ADMIN") {
    throw new ForbiddenError(
      "Only platform administrators may view marketplace subscriptions."
    );
  }

  const admin = createAdminSupabaseClient();

  const [subsRes, dealershipsRes, plansRes, membersRes, paymentsRes] =
    await Promise.all([
      admin
        .from("subscriptions")
        .select("*")
        .order("created_at", { ascending: false }),
      admin
        .from("dealerships")
        .select("id, operating_name, regulator, license_number, province, status"),
      admin.from("plans").select("*"),
      admin
        .from("dealership_members")
        .select("dealership_id")
        .eq("is_active", true),
      admin
        .from("payments")
        .select("dealership_id, amount_cents, status"),
    ]);

  if (subsRes.error) {
    throw new ExternalServiceError(
      "Unable to load dealership subscriptions.",
      "EXTERNAL_SERVICE_ERROR",
      subsRes.error
    );
  }

  const dealershipMap = new Map(
    (dealershipsRes.data ?? []).map((d) => [d.id, d])
  );
  const planMap = new Map((plansRes.data ?? []).map((p) => [p.id, p]));

  const seatsByDealer = new Map<string, number>();
  for (const m of membersRes.data ?? []) {
    seatsByDealer.set(
      m.dealership_id,
      (seatsByDealer.get(m.dealership_id) ?? 0) + 1
    );
  }

  const paidByDealer = new Map<string, { paidCents: number; count: number }>();
  for (const p of paymentsRes.data ?? []) {
    const prev = paidByDealer.get(p.dealership_id) ?? {
      paidCents: 0,
      count: 0,
    };
    paidByDealer.set(p.dealership_id, {
      paidCents:
        prev.paidCents + (p.status === "PAID" ? p.amount_cents : 0),
      count: prev.count + 1,
    });
  }

  const searchLower = query.search?.toLowerCase().trim() ?? "";

  const allItems: AdminSubscriptionItem[] = (subsRes.data ?? [])
    .map((sub) => {
      const dealership = dealershipMap.get(sub.dealership_id);
      const plan = planMap.get(sub.plan_id);
      if (!dealership || !plan) return null;

      const billingInterval =
        plan.billing_interval === "year" ? ("year" as const) : ("month" as const);
      const monthlyEquivCents =
        billingInterval === "year"
          ? Math.round(plan.price_cents / 12)
          : plan.price_cents;
      const paidMeta = paidByDealer.get(sub.dealership_id) ?? {
        paidCents: 0,
        count: 0,
      };

      return {
        subscriptionId: sub.id,
        dealershipId: sub.dealership_id,
        dealershipName: dealership.operating_name,
        regulator: dealership.regulator as AdminDealerRegulator,
        licenseNumber: dealership.license_number,
        province: dealership.province,
        dealershipStatus: dealership.status as AdminDealerStatus,
        planId: plan.id,
        planSlug: plan.slug,
        planName: plan.name,
        billingInterval,
        priceCents: plan.price_cents,
        monthlyEquivCents,
        subscriptionStatus: sub.status,
        bidsUsed: sub.bids_used,
        monthlyBidQuota: plan.monthly_bid_quota,
        activeSeatsCount: seatsByDealer.get(sub.dealership_id) ?? 0,
        maxTeamSeats: plan.max_team_seats,
        totalPaidCents: paidMeta.paidCents,
        invoicesCount: paidMeta.count,
        currentPeriodStart: sub.current_period_start,
        currentPeriodEnd: sub.current_period_end,
        autoRenew: sub.auto_renew,
        stripeCustomerLinked: Boolean(sub.stripe_customer_id),
      } satisfies AdminSubscriptionItem;
    })
    .filter((item): item is AdminSubscriptionItem => item !== null)
    .filter((item) => {
      if (query.status && item.subscriptionStatus !== query.status) return false;
      if (query.province && item.province !== query.province) return false;
      if (searchLower) {
        return (
          item.dealershipName.toLowerCase().includes(searchLower) ||
          item.licenseNumber.toLowerCase().includes(searchLower) ||
          item.planName.toLowerCase().includes(searchLower)
        );
      }
      return true;
    });

  const activeCount = allItems.filter(
    (i) => i.subscriptionStatus === "ACTIVE" || i.subscriptionStatus === "TRIALING"
  ).length;
  const pastDueCount = allItems.filter(
    (i) => i.subscriptionStatus === "PAST_DUE"
  ).length;
  const mrrCents = allItems
    .filter(
      (i) =>
        i.subscriptionStatus === "ACTIVE" || i.subscriptionStatus === "TRIALING"
    )
    .reduce((sum, i) => sum + i.monthlyEquivCents, 0);
  const totalCollectedCents = allItems.reduce(
    (sum, i) => sum + i.totalPaidCents,
    0
  );

  return {
    items: allItems,
    summary: {
      totalSubscriptionsCount: allItems.length,
      activeCount,
      pastDueCount,
      mrrCents,
      totalCollectedCents,
    },
    serverTime: new Date().toISOString(),
  };
}
