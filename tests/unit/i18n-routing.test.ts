import { describe, expect, it } from "vitest";
import enMessages from "@/messages/en.json";
import frMessages from "@/messages/fr.json";
import {
  isProtectedRoute,
  isRoleAllowedForPath,
  sanitizeNextPath,
  stripLocalePrefix,
  withLocalePrefix,
} from "@/lib/auth-routing";
import { ApiError } from "@/lib/api-client";
import { getLocalizedErrorMessage } from "@/lib/api-errors";
import {
  CANONICAL_ERROR_CODES,
  ERROR_CODE_DEFAULT_MESSAGES,
  getLocalizedErrorCodeMessage,
} from "@/lib/server/errors";
import { resolveRequestLocale } from "@/lib/server/http";
import {
  ALL_NOTIFICATION_TEMPLATE_KEYS,
  renderNotificationTemplate,
} from "@/lib/server/adapters/notification.adapter";

function collectLeafKeys(
  obj: Record<string, unknown>,
  prefix = ""
): Array<{ key: string; value: unknown }> {
  const entries: Array<{ key: string; value: unknown }> = [];
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === "object" && !Array.isArray(v)) {
      entries.push(...collectLeafKeys(v as Record<string, unknown>, fullKey));
    } else {
      entries.push({ key: fullKey, value: v });
    }
  }
  return entries;
}

describe("i18n routing helpers & EN/FR dictionary parity (Prompt B10.1 & B10.2)", () => {
  it("strips /en and /fr locale prefixes cleanly without corrupting root", () => {
    expect(stripLocalePrefix("/")).toEqual({ locale: null, pathname: "/" });
    expect(stripLocalePrefix("/en")).toEqual({ locale: "en", pathname: "/" });
    expect(stripLocalePrefix("/fr")).toEqual({ locale: "fr", pathname: "/" });
    expect(stripLocalePrefix("/fr/seller/dashboard")).toEqual({
      locale: "fr",
      pathname: "/seller/dashboard",
    });
    expect(stripLocalePrefix("/en/admin/moderation")).toEqual({
      locale: "en",
      pathname: "/admin/moderation",
    });
    expect(stripLocalePrefix("/dealer/register")).toEqual({
      locale: null,
      pathname: "/dealer/register",
    });
  });

  it("prefixes localized routes idempotently without double prefixes", () => {
    expect(withLocalePrefix("/", "en")).toBe("/en");
    expect(withLocalePrefix("/", "fr")).toBe("/fr");
    expect(withLocalePrefix("/seller/dashboard", "fr")).toBe(
      "/fr/seller/dashboard"
    );
    expect(withLocalePrefix("/en/seller/dashboard", "fr")).toBe(
      "/fr/seller/dashboard"
    );
    expect(withLocalePrefix("/fr/login", "fr")).toBe("/fr/login");
  });

  it("enforces protected routes and RBAC rules consistently across locales", () => {
    expect(isProtectedRoute("/fr/seller/dashboard")).toBe(true);
    expect(isProtectedRoute("/en/admin/audit-log")).toBe(true);
    expect(isProtectedRoute("/fr/dealer/register")).toBe(false);
    expect(isProtectedRoute("/en/login")).toBe(false);

    expect(isRoleAllowedForPath("/fr/seller/dashboard", "SELLER")).toBe(true);
    expect(isRoleAllowedForPath("/fr/seller/dashboard", "DEALER_ADMIN")).toBe(
      false
    );
    expect(isRoleAllowedForPath("/fr/admin/moderation", "SELLER")).toBe(false);
    expect(isRoleAllowedForPath("/fr/admin/moderation", "ADMIN")).toBe(true);
    expect(isRoleAllowedForPath("/en/dealer/billing", "DEALER_AGENT")).toBe(
      false
    );
    expect(isRoleAllowedForPath("/fr/dealer/billing", "DEALER_ADMIN")).toBe(
      true
    );
  });

  it("sanitizes relative next destinations and avoids double locale nesting", () => {
    expect(sanitizeNextPath("/fr/seller/dashboard?tab=live")).toBe(
      "/seller/dashboard?tab=live"
    );
    expect(sanitizeNextPath("https://evil.example/steal")).toBeNull();
    expect(sanitizeNextPath("//evil.example")).toBeNull();
  });

  it("maintains strict recursive key parity and non-empty strings across all portal namespaces in en.json and fr.json", () => {
    const requiredNamespaces = [
      "common",
      "nav",
      "sidebar",
      "headers",
      "marketing",
      "auth",
      "legal",
      "seller",
      "dealer",
      "admin",
      "userMenu",
      "settings",
      "notFound",
      "apiErrors",
    ];
    for (const ns of requiredNamespaces) {
      expect(enMessages, `EN missing namespace ${ns}`).toHaveProperty(ns);
      expect(frMessages, `FR missing namespace ${ns}`).toHaveProperty(ns);
    }

    const enEntries = collectLeafKeys(enMessages);
    const frEntries = collectLeafKeys(frMessages);

    const enMap = new Map(enEntries.map((e) => [e.key, e.value]));
    const frMap = new Map(frEntries.map((e) => [e.key, e.value]));

    expect(Array.from(frMap.keys()).sort()).toEqual(
      Array.from(enMap.keys()).sort()
    );

    for (const [key, val] of enMap) {
      expect(typeof val, `EN key ${key} must be string`).toBe("string");
      expect((val as string).trim().length, `EN key ${key} empty`).toBeGreaterThan(0);
    }
    for (const [key, val] of frMap) {
      expect(typeof val, `FR key ${key} must be string`).toBe("string");
      expect((val as string).trim().length, `FR key ${key} empty`).toBeGreaterThan(0);
    }
  });

  it("localizes all canonical API ErrorCode messages in both English and French and resolves request locale from cookies/headers", () => {
    for (const code of CANONICAL_ERROR_CODES) {
      const entry = ERROR_CODE_DEFAULT_MESSAGES[code];
      expect(entry.en.trim().length).toBeGreaterThan(0);
      expect(entry.fr.trim().length).toBeGreaterThan(0);
      expect(entry.fr).not.toBe(entry.en);

      expect(getLocalizedErrorCodeMessage(code, "en")).toBe(entry.en);
      expect(getLocalizedErrorCodeMessage(code, "fr")).toBe(entry.fr);
      expect(enMessages.apiErrors[code]).toBe(entry.en);
      expect(frMessages.apiErrors[code]).toBe(entry.fr);
    }

    const apiErr = new ApiError({
      success: false,
      status: 401,
      error: ERROR_CODE_DEFAULT_MESSAGES.UNAUTHENTICATED.en,
      code: "UNAUTHENTICATED",
    });
    expect(getLocalizedErrorMessage(apiErr, "en")).toBe(
      ERROR_CODE_DEFAULT_MESSAGES.UNAUTHENTICATED.en
    );
    expect(getLocalizedErrorMessage(apiErr, "fr")).toBe(
      ERROR_CODE_DEFAULT_MESSAGES.UNAUTHENTICATED.fr
    );

    const frCookieReq = new Request("https://autonexa.ca/api/seller/listings", {
      headers: { cookie: "NEXT_LOCALE=fr" },
    });
    const enDefaultReq = new Request("https://autonexa.ca/api/seller/listings");
    const acceptFrReq = new Request("https://autonexa.ca/api/seller/listings", {
      headers: { "accept-language": "fr-CA,fr;q=0.9,en;q=0.8" },
    });
    expect(resolveRequestLocale(frCookieReq)).toBe("fr");
    expect(resolveRequestLocale(enDefaultReq)).toBe("en");
    expect(resolveRequestLocale(acceptFrReq)).toBe("fr");
  });

  it("renders all 20 server-side notification/email templates in both EN and FR with CASL/LCAP compliance and zero sealed-bid leakage", () => {
    const unsubUrl = "https://autonexa.ca/api/notifications/unsubscribe?token=test";
    const sampleVars = {
      vehicleLabel: "2022 Porsche Macan GTS",
      dealershipName: "Pfaff Porsche Markham",
      distanceKm: 18,
      bidCount: 4,
      hours: 6,
      voucherCode: "ANX-7741",
      agreedAmountCents: 6150000,
      reason: "Odometer photo blurry",
      otpCode: "482910",
      inviteRoleLabel: "Wholesale Buyer",
    };

    expect(ALL_NOTIFICATION_TEMPLATE_KEYS.length).toBeGreaterThanOrEqual(20);

    for (const key of ALL_NOTIFICATION_TEMPLATE_KEYS) {
      const enRendered = renderNotificationTemplate(
        key,
        "en",
        sampleVars,
        unsubUrl
      );
      const frRendered = renderNotificationTemplate(
        key,
        "fr",
        sampleVars,
        unsubUrl
      );

      expect(enRendered.title.trim().length, `EN title empty for ${key}`).toBeGreaterThan(0);
      expect(frRendered.title.trim().length, `FR title empty for ${key}`).toBeGreaterThan(0);
      expect(enRendered.description.trim().length, `EN description empty for ${key}`).toBeGreaterThan(0);
      expect(frRendered.description.trim().length, `FR description empty for ${key}`).toBeGreaterThan(0);
      expect(frRendered.title, `FR title identical to EN for ${key}`).not.toBe(
        enRendered.title
      );
      expect(
        frRendered.description,
        `FR description identical to EN for ${key}`
      ).not.toBe(enRendered.description);

      // CASL / LCAP compliance footer verification
      expect(enRendered.emailHtml).toContain("CASL Compliance");
      expect(frRendered.emailHtml).toContain("Conformité LCAP");
      expect(enRendered.emailText).toContain(unsubUrl);
      expect(frRendered.emailText).toContain(unsubUrl);
      expect(enRendered.smsBody.trim().length).toBeGreaterThan(0);
      expect(frRendered.smsBody.trim().length).toBeGreaterThan(0);
    }

    // Sealed-Bid Secrecy Invariant (H1 / BR-04): losing/competing dealers must NEVER see agreedAmountCents ($61,500 / 61 500)
    for (const secretKey of [
      "AUCTION_CLOSED_DEALER",
      "MATCH_NOT_SELECTED_DEALER",
    ] as const) {
      for (const locale of ["en", "fr"] as const) {
        const payload = renderNotificationTemplate(
          secretKey,
          locale,
          sampleVars,
          unsubUrl
        );
        const combined = `${payload.title} ${payload.description} ${payload.emailText} ${payload.smsBody}`;
        expect(combined).not.toContain("61,500");
        expect(combined).not.toContain("61 500");
        expect(combined).not.toContain("61500");
      }
    }
  });
});
