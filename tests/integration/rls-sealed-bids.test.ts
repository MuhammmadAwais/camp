import fs from "node:fs";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { beforeAll, describe, expect, it } from "vitest";
import type { Database } from "@/lib/supabase/database.types";

function loadWorkspaceEnv(): void {
  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eqIndex = line.indexOf("=");
    if (eqIndex <= 0) continue;
    const key = line.slice(0, eqIndex).trim();
    let val = line.slice(eqIndex + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }
}

loadWorkspaceEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "";
const SUPABASE_SECRET_KEY =
  process.env.SUPABASE_SECRET_KEY ??
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  "";

const HAS_SUPABASE_ENV = Boolean(
  SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_SECRET_KEY
);

const ACTIVE_MACAN_LISTING_ID = "22222222-2222-4222-8222-222222222201";
const UNSEALED_F150_LISTING_ID = "22222222-2222-4222-8222-222222222204";
const PFAFF_DEALERSHIP_ID = "11111111-1111-4111-8111-111111111101";
const OAKVILLE_DEALERSHIP_ID = "11111111-1111-4111-8111-111111111102";

async function createAuthenticatedUserClient(
  admin: SupabaseClient<Database>,
  email: string
): Promise<SupabaseClient<Database>> {
  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink(
    {
      type: "magiclink",
      email,
    }
  );
  if (linkErr || !linkData?.properties?.hashed_token) {
    throw new Error(`Unable to generate auth link for ${email}: ${linkErr?.message}`);
  }

  const jar = new Map<string, string>();
  const ssrClient = createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return Array.from(jar.entries()).map(([name, value]) => ({ name, value }));
      },
      setAll(cookies) {
        for (const c of cookies) {
          if (!c.value) jar.delete(c.name);
          else jar.set(c.name, c.value);
        }
      },
    },
  });

  const { data: verified, error: verifyErr } = await ssrClient.auth.verifyOtp({
    token_hash: linkData.properties.hashed_token,
    type: "email",
  });
  if (verifyErr || !verified.session?.access_token) {
    throw new Error(`Unable to verify OTP for ${email}: ${verifyErr?.message}`);
  }

  return createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: {
        Authorization: `Bearer ${verified.session.access_token}`,
      },
    },
  });
}

describe.skipIf(!HAS_SUPABASE_ENV)(
  "Postgres RLS Sealed-Bid Isolation Integration Suite (AC-04 / H1 / NFR-11)",
  () => {
    let adminClient: SupabaseClient<Database>;
    let sellerClient: SupabaseClient<Database>;
    let dealerAClient: SupabaseClient<Database>;
    let dealerBClient: SupabaseClient<Database>;

    beforeAll(async () => {
      adminClient = createClient<Database>(SUPABASE_URL, SUPABASE_SECRET_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
      });

      [sellerClient, dealerAClient, dealerBClient] = await Promise.all([
        createAuthenticatedUserClient(adminClient, "seller@autonexa.ca"),
        createAuthenticatedUserClient(adminClient, "dealer@autonexa.ca"),
        createAuthenticatedUserClient(adminClient, "dealer2@autonexa.ca"),
      ]);
    });

    it("confirms service_role sees real sealed bids on ACTIVE Porsche Macan", async () => {
      const { data: activeBids, error } = await adminClient
        .from("bids")
        .select("id, listing_id, dealership_id, amount_cents")
        .eq("listing_id", ACTIVE_MACAN_LISTING_ID);

      expect(error).toBeNull();
      expect(activeBids?.length).toBeGreaterThanOrEqual(1);
      expect(
        activeBids?.some((b) => b.dealership_id === PFAFF_DEALERSHIP_ID)
      ).toBe(true);
    });

    it("blocks Seller from reading ANY bids rows while listing is ACTIVE (0 rows leaked)", async () => {
      const { data: leakedBids, error } = await sellerClient
        .from("bids")
        .select("*")
        .eq("listing_id", ACTIVE_MACAN_LISTING_ID);

      expect(error).toBeNull();
      expect(leakedBids).toEqual([]);
    });

    it("allows Seller to view bid_count without amounts via public_auction_telemetry", async () => {
      const { data: telemetry, error } = await sellerClient
        .from("public_auction_telemetry")
        .select("listing_id, status, bid_count, auction_ends_at")
        .eq("listing_id", ACTIVE_MACAN_LISTING_ID)
        .single();

      expect(error).toBeNull();
      expect(telemetry?.status).toBe("ACTIVE");
      expect(telemetry?.bid_count).toBeGreaterThanOrEqual(1);
    });

    it("isolates competing Dealer B from reading Dealer A's sealed bid on ACTIVE auction", async () => {
      const { data: dealerBSeenBids, error } = await dealerBClient
        .from("bids")
        .select("id, dealership_id, amount_cents")
        .eq("listing_id", ACTIVE_MACAN_LISTING_ID);

      expect(error).toBeNull();
      for (const bid of dealerBSeenBids ?? []) {
        expect(bid.dealership_id).toBe(OAKVILLE_DEALERSHIP_ID);
        expect(bid.dealership_id).not.toBe(PFAFF_DEALERSHIP_ID);
      }
      expect(dealerBSeenBids).toEqual([]);
    });

    it("permits Dealer A to read only their own dealership's sealed bid", async () => {
      const { data: ownBids, error } = await dealerAClient
        .from("bids")
        .select("id, dealership_id, amount_cents")
        .eq("listing_id", ACTIVE_MACAN_LISTING_ID);

      expect(error).toBeNull();
      expect(ownBids?.length).toBeGreaterThanOrEqual(1);
      for (const bid of ownBids ?? []) {
        expect(bid.dealership_id).toBe(PFAFF_DEALERSHIP_ID);
        expect(Number.isInteger(bid.amount_cents)).toBe(true);
      }
    });

    it("reveals unsealed bids to the owning Seller only after UNSEALED transition", async () => {
      const { data: unsealedBids, error } = await sellerClient
        .from("bids")
        .select("id, dealership_id, amount_cents, status")
        .eq("listing_id", UNSEALED_F150_LISTING_ID);

      expect(error).toBeNull();
      expect(unsealedBids?.length).toBeGreaterThanOrEqual(1);
      for (const bid of unsealedBids ?? []) {
        expect(Number.isInteger(bid.amount_cents)).toBe(true);
      }
    });

    it("rejects direct client INSERT into bids and DELETE on immutable audit_logs", async () => {
      const { error: directBidErr } = await dealerBClient.from("bids").insert({
        listing_id: ACTIVE_MACAN_LISTING_ID,
        dealership_id: OAKVILLE_DEALERSHIP_ID,
        placed_by_user_id: "9af692ae-d1e3-4a1b-b414-8c2a97dbbee8",
        amount_cents: 4_900_000,
        idempotency_key: `rls-bypass-test-${Date.now()}`,
      });
      expect(directBidErr).not.toBeNull();

      const { error: auditDelErr } = await sellerClient
        .from("audit_logs")
        .delete()
        .eq("id", 1);
      expect(auditDelErr).not.toBeNull();
    });
  }
);
