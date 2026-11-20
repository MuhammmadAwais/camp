import Stripe from "stripe";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ServerEnv } from "@/lib/server/env";
import {
  AppError,
  ExternalServiceError,
  ForbiddenError,
  NotFoundError,
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
  constructWebhookEvent,
  createBillingPortalSession,
  createCheckoutSession,
  isStripeConfigured,
  isStripeWebhookConfigured,
  retrieveStripeSubscription,
} from "@/lib/server/adapters/billing.adapter";
import {
  adminSubscriptionsQuerySchema,
  dealerInvoicesQuerySchema,
  formatDealerInvoicesCsv,
  getDealerSubscription,
  launchDealerBillingPortal,
  launchDealerCheckout,
  listAdminSubscriptions,
  listDealerInvoices,
} from "@/lib/server/services/billing.service";
import { processStripeWebhookEvent } from "@/lib/server/services/stripe-webhook.service";

const WEBHOOK_SECRET = "whsec_unit_test_secret_1234567890";
const DEALERSHIP_ID = "11111111-1111-4111-8111-111111111101";
const PLAN_ID = "55555555-5555-4555-8555-555555555501";
const SUB_ID = "66666666-6666-4666-8666-666666666601";

function baseEnv(overrides: Partial<ServerEnv> = {}): ServerEnv {
  return {
    supabaseUrl: "https://example.supabase.co",
    supabasePublishableKey: "anon-key",
    supabaseSecretKey: "service-role-key",
    appUrl: "http://localhost:3000",
    enableMockApi: false,
    storageDriver: "supabase",
    kycMode: "sandbox",
    stripeSecretKey: undefined,
    stripeWebhookSecret: WEBHOOK_SECRET,
    ...overrides,
  };
}

describe("Stripe Webhook Idempotency & CAD Billing Suites", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetServerEnv.mockReturnValue(baseEnv());
  });

  describe("billing.adapter webhook signature & configuration", () => {
    it("throws 503 BILLING_NOT_CONFIGURED when secrets are absent", async () => {
      mockGetServerEnv.mockReturnValue(
        baseEnv({ stripeWebhookSecret: undefined, stripeSecretKey: undefined })
      );
      expect(isStripeWebhookConfigured()).toBe(false);
      expect(isStripeConfigured()).toBe(false);

      expect(() =>
        constructWebhookEvent("{}", "t=1700000000,v1=deadbeef")
      ).toThrowError(AppError);

      await expect(
        createCheckoutSession({
          dealershipId: DEALERSHIP_ID,
          dealershipName: "Pfaff",
          customerEmail: "d@pfaff.ca",
          stripeCustomerId: null,
          planId: PLAN_ID,
          planSlug: "pro-monthly",
          planName: "Pro",
          billingInterval: "month",
          priceCents: 49_900,
          stripePriceId: null,
          successUrl: "https://autonexa.ca/ok",
          cancelUrl: "https://autonexa.ca/cancel",
        })
      ).rejects.toMatchObject({ status: 503, code: "BILLING_NOT_CONFIGURED" });

      await expect(
        createBillingPortalSession({
          dealershipId: DEALERSHIP_ID,
          dealershipName: "Pfaff",
          customerEmail: "d@pfaff.ca",
          stripeCustomerId: null,
          returnUrl: "https://autonexa.ca/billing",
        })
      ).rejects.toMatchObject({ status: 503, code: "BILLING_NOT_CONFIGURED" });
    });

    it("creates Stripe checkout/portal sessions with mocked Stripe SDK resources", async () => {
      mockGetServerEnv.mockReturnValue(
        baseEnv({ stripeSecretKey: "sk_test_unit_mock" })
      );
      expect(isStripeConfigured()).toBe(true);

      const protoTarget = new Stripe("sk_test_unit_mock");
      const custSpy = vi
        .spyOn(Object.getPrototypeOf(protoTarget.customers) as { create: () => unknown }, "create")
        .mockResolvedValue({ id: "cus_mock_1" } as unknown as Stripe.Response<Stripe.Customer>);
      const chkSpy = vi
        .spyOn(
          Object.getPrototypeOf(protoTarget.checkout.sessions) as { create: () => unknown },
          "create"
        )
        .mockResolvedValue({
          id: "cs_mock_1",
          url: "https://checkout.stripe.com/c/pay/cs_mock_1",
        } as unknown as Stripe.Response<Stripe.Checkout.Session>);
      const portalSpy = vi
        .spyOn(
          Object.getPrototypeOf(protoTarget.billingPortal.sessions) as { create: () => unknown },
          "create"
        )
        .mockResolvedValue({
          url: "https://billing.stripe.com/p/session_1",
        } as unknown as Stripe.Response<Stripe.BillingPortal.Session>);
      const subSpy = vi
        .spyOn(
          Object.getPrototypeOf(protoTarget.subscriptions) as { retrieve: () => unknown },
          "retrieve"
        )
        .mockRejectedValueOnce(new Error("Stripe unavailable"));

      const chkOut = await createCheckoutSession({
        dealershipId: DEALERSHIP_ID,
        dealershipName: "Pfaff",
        customerEmail: "d@pfaff.ca",
        stripeCustomerId: null,
        planId: PLAN_ID,
        planSlug: "pro-monthly",
        planName: "Pro",
        billingInterval: "month",
        priceCents: 49_900,
        stripePriceId: null,
        successUrl: "https://autonexa.ca/ok",
        cancelUrl: "https://autonexa.ca/cancel",
      });
      expect(chkOut.sessionId).toBe("cs_mock_1");
      expect(custSpy).toHaveBeenCalledTimes(1);

      const portalOut = await createBillingPortalSession({
        dealershipId: DEALERSHIP_ID,
        dealershipName: "Pfaff",
        customerEmail: "d@pfaff.ca",
        stripeCustomerId: "cus_mock_1",
        returnUrl: "https://autonexa.ca/billing",
      });
      expect(portalOut.portalUrl).toContain("billing.stripe.com");
      expect(chkSpy).toHaveBeenCalledTimes(1);
      expect(portalSpy).toHaveBeenCalledTimes(1);

      expect(await retrieveStripeSubscription("sub_err")).toBeNull();
      expect(subSpy).toHaveBeenCalledTimes(1);
    });

    it("verifies valid HMAC webhook signatures and rejects missing/tampered ones", async () => {
      try {
        constructWebhookEvent("{}", null);
        throw new Error("Expected BadRequestError");
      } catch (err) {
        expect(err).toMatchObject({ status: 400, code: "INVALID_STRIPE_SIGNATURE" });
      }

      try {
        constructWebhookEvent("{}", "t=1700000000,v1=000000000000");
        throw new Error("Expected BadRequestError");
      } catch (err) {
        expect(err).toMatchObject({ status: 400, code: "INVALID_STRIPE_SIGNATURE" });
      }

      const payload = JSON.stringify({
        id: "evt_valid_1",
        object: "event",
        type: "invoice.paid",
        data: { object: { id: "in_1" } },
      });
      const sig = Stripe.webhooks.generateTestHeaderString({
        payload,
        secret: WEBHOOK_SECRET,
      });

      const evt = constructWebhookEvent(payload, sig);
      expect(evt.id).toBe("evt_valid_1");
      expect(await retrieveStripeSubscription("sub_123")).toBeNull();
    });
  });

  describe("processStripeWebhookEvent()", () => {
    it("deduplicates replay events on 23505 and propagates non-23505 claim failures", async () => {
      const queries: MockQueryState[] = [];
      const { admin } = createMockSupabaseClient((state) => {
        queries.push(state);
        if (state.table === "stripe_webhook_events" && state.op === "insert") {
          return { error: { code: "23505", message: "duplicate key" } };
        }
        return { data: null };
      });
      mockCreateAdminClient.mockReturnValue(admin);

      const dup = await processStripeWebhookEvent({
        id: "evt_dup_1",
        type: "invoice.paid",
        created: 1700000000,
        livemode: false,
        data: { object: { id: "in_1" } },
      } as unknown as Stripe.Event);
      expect(dup).toMatchObject({ duplicate: true, handled: false, reason: "duplicate_event" });
      expect(queries.map((q) => q.table)).toEqual(["stripe_webhook_events"]);

      const { admin: claimErrAdmin } = createMockSupabaseClient(() => ({
        error: { code: "42P01", message: "insert failed" },
      }));
      mockCreateAdminClient.mockReturnValue(claimErrAdmin);
      await expect(
        processStripeWebhookEvent({
          id: "evt_err_1",
          type: "invoice.paid",
          created: 1700000000,
          livemode: false,
          data: { object: { id: "in_1" } },
        } as unknown as Stripe.Event)
      ).rejects.toBeInstanceOf(ExternalServiceError);
    });

    it("handles checkout.session.completed edge cases (non-subscription, unresolved dealership/plan, active)", async () => {
      const { admin } = createMockSupabaseClient((state) => {
        if (state.table === "dealerships" && state.filters.some((f) => f.value === DEALERSHIP_ID)) {
          return { data: { id: DEALERSHIP_ID, operating_name: "Pfaff Motors", province: "ON" } };
        }
        if (state.table === "plans" && state.filters.some((f) => f.value === "enterprise-monthly")) {
          return {
            data: {
              id: PLAN_ID,
              slug: "enterprise-monthly",
              name: "Enterprise",
              billing_interval: "month",
              price_cents: 119_900,
            },
          };
        }
        if (state.table === "subscriptions" && state.op === "upsert") {
          return { data: { id: SUB_ID, status: "ACTIVE", bids_used: 0 } };
        }
        return { data: null };
      });
      mockCreateAdminClient.mockReturnValue(admin);

      expect(
        await processStripeWebhookEvent({
          id: "evt_pay_mode",
          type: "checkout.session.completed",
          created: 1700000000,
          livemode: false,
          data: { object: { id: "cs_1", mode: "payment" } },
        } as unknown as Stripe.Event)
      ).toMatchObject({ handled: false, reason: "non_subscription_checkout" });

      expect(
        await processStripeWebhookEvent({
          id: "evt_no_dealer",
          type: "checkout.session.completed",
          created: 1700000000,
          livemode: false,
          data: { object: { id: "cs_2", mode: "subscription", metadata: {} } },
        } as unknown as Stripe.Event)
      ).toMatchObject({ handled: false, reason: "dealership_not_resolved" });

      expect(
        await processStripeWebhookEvent({
          id: "evt_no_plan",
          type: "checkout.session.completed",
          created: 1700000000,
          livemode: false,
          data: {
            object: {
              id: "cs_3",
              mode: "subscription",
              client_reference_id: DEALERSHIP_ID,
              metadata: { plan_slug: "unknown-plan" },
            },
          },
        } as unknown as Stripe.Event)
      ).toMatchObject({ handled: false, reason: "plan_not_resolved" });

      const okRes = await processStripeWebhookEvent({
        id: "evt_chk_ok",
        type: "checkout.session.completed",
        created: 1700000000,
        livemode: false,
        data: {
          object: {
            id: "cs_4",
            mode: "subscription",
            customer: "cus_1",
            subscription: {
              id: "sub_obj_1",
              items: { data: [{ current_period_start: 1700000000, current_period_end: 1702592000 }] },
              metadata: {},
            },
            metadata: { dealership_id: DEALERSHIP_ID, plan_slug: "enterprise-monthly" },
          },
        },
      } as unknown as Stripe.Event);
      expect(okRes).toMatchObject({ handled: true, subscriptionStatus: "ACTIVE" });
    });

    it("handles invoice.paid insert & existing-invoice update, plus non-CAD rejection", async () => {
      const updatedPayments: MockQueryState[] = [];
      const { admin } = createMockSupabaseClient((state) => {
        if (state.table === "payments" && state.op === "select") {
          return { data: { id: "pay_existing", invoice_number: "INV-EXIST" } };
        }
        if (state.table === "payments" && state.op === "update") {
          updatedPayments.push(state);
          return { data: null };
        }
        if (state.table === "subscriptions" && state.op === "select") {
          return {
            data: {
              id: SUB_ID,
              dealership_id: DEALERSHIP_ID,
              plan_id: PLAN_ID,
              status: "PAST_DUE",
              bids_used: 18,
              stripe_customer_id: "cus_1",
              stripe_subscription_id: "sub_1",
            },
          };
        }
        if (state.table === "dealerships") {
          return { data: { id: DEALERSHIP_ID, operating_name: "Pfaff Motors", province: "ON" } };
        }
        if (state.table === "plans") {
          return {
            data: {
              id: PLAN_ID,
              slug: "pro-monthly",
              name: "Pro",
              billing_interval: "month",
              price_cents: 49_900,
            },
          };
        }
        if (state.table === "subscriptions" && state.op === "upsert") {
          return { data: { id: SUB_ID, status: "ACTIVE", bids_used: 0 } };
        }
        return { data: null };
      });
      mockCreateAdminClient.mockReturnValue(admin);

      const usdRes = await processStripeWebhookEvent({
        id: "evt_usd",
        type: "invoice.paid",
        created: 1700000000,
        livemode: false,
        data: { object: { id: "in_usd", currency: "usd" } },
      } as unknown as Stripe.Event);
      expect(usdRes).toMatchObject({ handled: false, reason: "unsupported_currency" });

      const paidRes = await processStripeWebhookEvent({
        id: "evt_cad_update",
        type: "invoice.paid",
        created: 1700000000,
        livemode: false,
        data: {
          object: {
            id: "in_cad_exist",
            currency: "cad",
            amount_paid: 49_900,
            customer: "cus_1",
            subscription: "sub_1",
            payment_intent: "pi_legacy_1",
            period_start: 1700000000,
            period_end: 1702592000,
            lines: { data: [] },
            status_transitions: { paid_at: 1700000100 },
          },
        },
      } as unknown as Stripe.Event);
      expect(paidRes).toMatchObject({ handled: true, subscriptionStatus: "ACTIVE" });
      expect(updatedPayments).toHaveLength(1);
    });

    it("handles invoice.payment_failed, subscription.deleted, and all subscription.updated status mappings", async () => {
      const notifs: MockQueryState[] = [];
      const { admin } = createMockSupabaseClient((state) => {
        if (state.table === "notifications" && state.op === "insert") {
          notifs.push(state);
          return { data: { id: "notif_1" } };
        }
        if (state.table === "subscriptions" && state.op === "select") {
          return {
            data: {
              id: SUB_ID,
              dealership_id: DEALERSHIP_ID,
              plan_id: PLAN_ID,
              status: "ACTIVE",
              bids_used: 4,
              auto_renew: true,
              cancelled_at: null,
              stripe_customer_id: "cus_1",
              stripe_subscription_id: "sub_1",
            },
          };
        }
        if (state.table === "dealerships") {
          return { data: { id: DEALERSHIP_ID, operating_name: "Pfaff Motors", province: "ON" } };
        }
        if (state.table === "plans") {
          return {
            data: {
              id: PLAN_ID,
              slug: "pro-monthly",
              name: "Pro",
              billing_interval: "year",
              price_cents: 479_000,
            },
          };
        }
        if (state.table === "payments" && state.op === "insert") {
          return { data: { id: "pay_fail_1" } };
        }
        if (state.table === "dealership_members") return { data: [{ user_id: "u1" }] };
        if (state.table === "profiles") {
          return { data: [{ id: "u1", email: "dealer@autonexa.ca" }] };
        }
        return { data: null };
      });
      mockCreateAdminClient.mockReturnValue(admin);

      const failRes = await processStripeWebhookEvent({
        id: "evt_fail_1",
        type: "invoice.payment_failed",
        created: 1700000000,
        livemode: false,
        data: {
          object: {
            id: "in_fail_1",
            currency: "cad",
            amount_due: 49_900,
            customer: "cus_1",
            parent: { subscription_details: { subscription: "sub_1", metadata: {} } },
            lines: { data: [{ description: "Renewal Failed", metadata: {} }] },
          },
        },
      } as unknown as Stripe.Event);
      expect(failRes).toMatchObject({ handled: true, subscriptionStatus: "PAST_DUE" });

      const delRes = await processStripeWebhookEvent({
        id: "evt_del_1",
        type: "customer.subscription.deleted",
        created: 1700000000,
        livemode: false,
        data: { object: { id: "sub_1", customer: "cus_1", canceled_at: 1700000050 } },
      } as unknown as Stripe.Event);
      expect(delRes).toMatchObject({ handled: true, subscriptionStatus: "EXPIRED" });
      expect(notifs).toHaveLength(2);

      for (const [stripeStatus, expected] of [
        ["active", "ACTIVE"],
        ["trialing", "TRIALING"],
        ["past_due", "PAST_DUE"],
        ["canceled", "EXPIRED"],
        ["paused", "CANCELLED"],
      ] as const) {
        const res = await processStripeWebhookEvent({
          id: `evt_upd_${stripeStatus}`,
          type: "customer.subscription.updated",
          created: 1700000000,
          livemode: false,
          data: {
            object: {
              id: "sub_1",
              customer: "cus_1",
              status: stripeStatus,
              cancel_at_period_end: stripeStatus === "paused",
              current_period_start: 1700000000,
              current_period_end: 1731536000,
            },
          },
        } as unknown as Stripe.Event);
        expect(res).toMatchObject({ handled: true, subscriptionStatus: expected });
      }
    });

    it("releases claim on transient update error", async () => {
      const deletedCalls: MockQueryState[] = [];
      const { admin } = createMockSupabaseClient((state) => {
        if (state.table === "stripe_webhook_events" && state.op === "delete") {
          deletedCalls.push(state);
        }
        if (state.table === "subscriptions" && state.op === "select") {
          return { data: { id: SUB_ID, dealership_id: DEALERSHIP_ID, plan_id: PLAN_ID, status: "ACTIVE" } };
        }
        if (state.table === "dealerships") {
          return { data: { id: DEALERSHIP_ID, operating_name: "Pfaff", province: "ON" } };
        }
        if (state.table === "subscriptions" && state.op === "update") {
          return { error: { message: "transient connection failure" } };
        }
        return { data: null };
      });
      mockCreateAdminClient.mockReturnValue(admin);

      await expect(
        processStripeWebhookEvent({
          id: "evt_transient_err",
          type: "invoice.payment_failed",
          created: 1700000000,
          livemode: false,
          data: { object: { id: "in_err", currency: "cad", customer: "cus_1" } },
        } as unknown as Stripe.Event)
      ).rejects.toBeInstanceOf(ExternalServiceError);
      expect(deletedCalls).toHaveLength(1);

      const { admin: fallbackAdmin } = createMockSupabaseClient(() => ({ data: null }));
      mockCreateAdminClient.mockReturnValue(fallbackAdmin);

      expect(
        await processStripeWebhookEvent({
          id: "evt_unhandled",
          type: "charge.succeeded",
          created: 1700000000,
          livemode: false,
          data: { object: {} },
        } as unknown as Stripe.Event)
      ).toMatchObject({ handled: false, reason: "unhandled_event_type" });

      expect(
        await processStripeWebhookEvent({
          id: "evt_fail_usd",
          type: "invoice.payment_failed",
          created: 1700000000,
          livemode: false,
          data: { object: { id: "in_u", currency: "usd" } },
        } as unknown as Stripe.Event)
      ).toMatchObject({ handled: false, reason: "unsupported_currency" });

      expect(
        await processStripeWebhookEvent({
          id: "evt_del_missing",
          type: "customer.subscription.deleted",
          created: 1700000000,
          livemode: false,
          data: { object: { id: "sub_missing", customer: "cus_missing" } },
        } as unknown as Stripe.Event)
      ).toMatchObject({ handled: false, reason: "subscription_not_found" });

      expect(
        await processStripeWebhookEvent({
          id: "evt_upd_missing",
          type: "customer.subscription.updated",
          created: 1700000000,
          livemode: false,
          data: { object: { id: "sub_missing", customer: "cus_missing", status: "unpaid" } },
        } as unknown as Stripe.Event)
      ).toMatchObject({ handled: false, reason: "subscription_not_found" });
    });
  });

  describe("billing.service schemas, queries, checkout & CSV export", () => {
    it("parses invoice and admin subscription query schemas cleanly", () => {
      expect(
        dealerInvoicesQuerySchema.parse({ year: "ALL", status: "all", search: "", format: "" })
      ).toEqual({ format: "json" });
      expect(
        dealerInvoicesQuerySchema.parse({ year: "2026", status: "paid", search: "INV", format: "CSV" })
      ).toEqual({ year: "2026", status: "PAID", search: "INV", format: "csv" });

      expect(
        adminSubscriptionsQuerySchema.parse({ status: "all", province: "ALL" })
      ).toEqual({});
      expect(
        adminSubscriptionsQuerySchema.parse({ status: "active", province: "qc", search: "Montreal" })
      ).toEqual({ status: "ACTIVE", province: "QC", search: "Montreal" });
    });

    it("covers getDealerSubscription errors, launchDealerCheckout success & portal errors", async () => {
      mockGetServerEnv.mockReturnValue(
        baseEnv({ stripeSecretKey: "sk_test_unit_mock" })
      );
      const protoTarget = new Stripe("sk_test_unit_mock");
      vi.spyOn(
        Object.getPrototypeOf(protoTarget.customers) as { create: () => unknown },
        "create"
      ).mockResolvedValue({
        id: "cus_new_1",
      } as unknown as Stripe.Response<Stripe.Customer>);
      vi.spyOn(
        Object.getPrototypeOf(protoTarget.checkout.sessions) as { create: () => unknown },
        "create"
      ).mockResolvedValue({
        id: "cs_new_1",
        url: "https://checkout.stripe.com/c/pay/cs_new_1",
      } as unknown as Stripe.Response<Stripe.Checkout.Session>);

      const { admin } = createMockSupabaseClient((state) => {
        if (state.table === "plans") {
          return {
            data: {
              id: PLAN_ID,
              slug: "pro-monthly",
              name: "Pro",
              billing_interval: "month",
              price_cents: 49_900,
              monthly_bid_quota: 50,
              max_radius_km: 250,
              max_team_seats: 10,
              stripe_price_id: null,
              features_json: [],
            },
          };
        }
        if (state.table === "dealerships") {
          return {
            data: { id: DEALERSHIP_ID, operating_name: "Pfaff Motors", contact_email: "d@pfaff.ca", province: "ON", status: "VERIFIED" },
          };
        }
        if (state.table === "subscriptions") {
          return { data: { id: SUB_ID, stripe_customer_id: null } };
        }
        return { data: null };
      });
      mockCreateAdminClient.mockReturnValue(admin);

      const dealerAdminCtx = makeSessionContext({
        role: "DEALER_ADMIN",
        dealershipId: DEALERSHIP_ID,
        seatRole: "DEALER_ADMIN",
      }) as ReturnType<typeof makeSessionContext> & { dealershipId: string };

      const checkoutRes = await launchDealerCheckout(
        dealerAdminCtx,
        { planId: PLAN_ID },
        { ipAddress: "127.0.0.1", origin: "https://autonexa.ca" }
      );
      expect(checkoutRes.sessionId).toBe("cs_new_1");

      const { admin: missingPlanAdmin } = createMockSupabaseClient(() => ({ data: null }));
      mockCreateAdminClient.mockReturnValue(missingPlanAdmin);
      await expect(
        launchDealerCheckout(
          dealerAdminCtx,
          { planSlug: "missing" },
          { ipAddress: null, origin: null }
        )
      ).rejects.toBeInstanceOf(NotFoundError);

      await expect(
        launchDealerBillingPortal(dealerAdminCtx, { ipAddress: null, origin: null })
      ).rejects.toBeInstanceOf(NotFoundError);

      const { admin: subErrAdmin } = createMockSupabaseClient((state) => {
        if (state.table === "plans") return { error: { message: "plans error" } };
        return { data: null };
      });
      mockCreateAdminClient.mockReturnValue(subErrAdmin);
      await expect(getDealerSubscription(dealerAdminCtx)).rejects.toBeInstanceOf(
        ExternalServiceError
      );
    });

    it("filters invoices, neutralizes CSV formulas, and enforces Admin gate on MRR", async () => {
      const { admin } = createMockSupabaseClient((state) => {
        if (state.table === "dealerships") {
          return {
            data: { id: DEALERSHIP_ID, operating_name: "Pfaff Motors" },
          };
        }
        if (state.table === "subscriptions") {
          return {
            data: {
              id: SUB_ID,
              plan_id: PLAN_ID,
              status: "ACTIVE",
              bids_used: 5,
              current_period_start: "2026-11-01T00:00:00.000Z",
              current_period_end: "2027-11-01T00:00:00.000Z",
              auto_renew: true,
              cancelled_at: null,
              stripe_customer_id: "cus_1",
            },
          };
        }
        if (state.table === "plans") {
          return {
            data: {
              id: PLAN_ID,
              slug: "enterprise-annual",
              name: "Enterprise",
              billing_interval: "year",
              price_cents: 999_000,
              monthly_bid_quota: 250,
              max_radius_km: 500,
              max_team_seats: 25,
              stripe_price_id: null,
              features_json: [],
            },
          };
        }
        if (state.table === "payments") {
          return {
            data: [
              {
                id: "pay_1",
                dealership_id: DEALERSHIP_ID,
                invoice_number: "INV-2026-001",
                amount_cents: 999_000,
                currency: "CAD",
                status: "PAID",
                description: "=SUM(A1) Enterprise Annual",
                stripe_invoice_id: "in_paid_1",
                invoice_pdf_url: null,
                paid_at: "2026-11-05T12:00:00.000Z",
                created_at: "2026-11-05T12:00:00.000Z",
              },
              {
                id: "pay_2",
                dealership_id: DEALERSHIP_ID,
                invoice_number: "INV-2025-999",
                amount_cents: 49_900,
                currency: "CAD",
                status: "UNKNOWN",
                description: "Basic Monthly",
                stripe_invoice_id: "in_fail_2",
                invoice_pdf_url: null,
                paid_at: null,
                created_at: "2025-12-01T12:00:00.000Z",
              },
            ],
          };
        }
        return { data: null };
      });
      mockCreateAdminClient.mockReturnValue(admin);

      const dealerAdminCtx = makeSessionContext({
        role: "DEALER_ADMIN",
        dealershipId: DEALERSHIP_ID,
        seatRole: "DEALER_ADMIN",
      }) as ReturnType<typeof makeSessionContext> & { dealershipId: string };

      const filtered = await listDealerInvoices(dealerAdminCtx, {
        year: "2026",
        status: "PAID",
        search: "enterprise",
      });
      expect(filtered.items).toHaveLength(1);
      expect(filtered.summary.totalPaidCents).toBe(999_000);
      expect(formatDealerInvoicesCsv(filtered)).toContain("'=SUM(A1) Enterprise Annual");

      await expect(
        listAdminSubscriptions(dealerAdminCtx, {})
      ).rejects.toBeInstanceOf(ForbiddenError);

      const { admin: portalAdmin } = createMockSupabaseClient((state) => {
        if (state.table === "dealerships") {
          return {
            data: { id: DEALERSHIP_ID, operating_name: "Pfaff Motors", contact_email: "", province: "ON" },
          };
        }
        if (state.table === "subscriptions") {
          return { data: { id: SUB_ID, stripe_customer_id: null } };
        }
        return { data: null };
      });
      mockCreateAdminClient.mockReturnValue(portalAdmin);
      mockGetServerEnv.mockReturnValue(baseEnv({ stripeSecretKey: "sk_test_unit_mock" }));
      const protoPortal = new Stripe("sk_test_unit_mock");
      vi.spyOn(
        Object.getPrototypeOf(protoPortal.customers) as { create: () => unknown },
        "create"
      ).mockResolvedValue({ id: "cus_portal_new" } as unknown as Stripe.Response<Stripe.Customer>);
      vi.spyOn(
        Object.getPrototypeOf(protoPortal.billingPortal.sessions) as { create: () => unknown },
        "create"
      ).mockResolvedValue({ url: "https://billing.stripe.com/session/ok" } as unknown as Stripe.Response<Stripe.BillingPortal.Session>);

      const portalRes = await launchDealerBillingPortal(dealerAdminCtx, {
        ipAddress: "127.0.0.1",
        origin: null,
      });
      expect(portalRes.portalUrl).toContain("billing.stripe.com");

      const { admin: adminSubsMock } = createMockSupabaseClient((state) => {
        if (state.table === "subscriptions") {
          return {
            data: [
              {
                id: SUB_ID,
                dealership_id: DEALERSHIP_ID,
                plan_id: PLAN_ID,
                status: "ACTIVE",
                bids_used: 3,
                current_period_start: "2026-11-01T00:00:00.000Z",
                current_period_end: "2027-11-01T00:00:00.000Z",
                auto_renew: true,
                stripe_customer_id: "cus_1",
              },
              {
                id: "sub_2",
                dealership_id: "11111111-1111-4111-8111-111111111102",
                plan_id: "plan_month",
                status: "PAST_DUE",
                bids_used: 9,
                current_period_start: "2026-11-01T00:00:00.000Z",
                current_period_end: "2026-12-01T00:00:00.000Z",
                auto_renew: false,
                stripe_customer_id: null,
              },
            ],
          };
        }
        if (state.table === "dealerships") {
          return {
            data: [
              { id: DEALERSHIP_ID, operating_name: "Pfaff Motors", regulator: "OMVIC", license_number: "OMV-1", province: "ON", status: "VERIFIED" },
              { id: "11111111-1111-4111-8111-111111111102", operating_name: "Oakville Auto", regulator: "OMVIC", license_number: "OMV-2", province: "ON", status: "VERIFIED" },
            ],
          };
        }
        if (state.table === "plans") {
          return {
            data: [
              { id: PLAN_ID, slug: "enterprise-annual", name: "Enterprise", billing_interval: "year", price_cents: 999_000, monthly_bid_quota: 250, max_radius_km: 500, max_team_seats: 25, stripe_price_id: null, features_json: [] },
              { id: "plan_month", slug: "basic-monthly", name: "Basic", billing_interval: "month", price_cents: 19_900, monthly_bid_quota: 20, max_radius_km: 100, max_team_seats: 3, stripe_price_id: null, features_json: [] },
            ],
          };
        }
        if (state.table === "dealership_members") return { data: [{ dealership_id: DEALERSHIP_ID }] };
        if (state.table === "payments") {
          return {
            data: [
              { dealership_id: DEALERSHIP_ID, amount_cents: 999_000, status: "PAID" },
              { dealership_id: "11111111-1111-4111-8111-111111111102", amount_cents: 19_900, status: "FAILED" },
            ],
          };
        }
        return { data: null };
      });
      mockCreateAdminClient.mockReturnValue(adminSubsMock);

      const adminCtx = makeSessionContext({ role: "ADMIN" });
      const allAdminSubs = await listAdminSubscriptions(adminCtx, { status: "ACTIVE", province: "ON", search: "pfaff" });
      expect(allAdminSubs.summary.activeCount).toBe(1);
      expect(allAdminSubs.summary.mrrCents).toBe(Math.round(999_000 / 12));

      const pastDueSubs = await listAdminSubscriptions(adminCtx, { status: "PAST_DUE" });
      expect(pastDueSubs.summary.pastDueCount).toBe(1);
    });
  });
});
