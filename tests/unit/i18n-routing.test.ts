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

describe("i18n routing helpers & EN/FR dictionary parity (Prompt B10.1)", () => {
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

  it("maintains strict recursive key parity and non-empty strings between en.json and fr.json", () => {
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
});
