import { vi } from "vitest";
import type { ProfileRow, ServerSupabaseClient, SessionContext } from "@/lib/server/auth";
import type { createAdminSupabaseClient } from "@/lib/supabase/admin";

export type MockQueryResult = {
  data?: unknown;
  error?: { code?: string; message: string } | null;
  count?: number | null;
};

export type MockFilter = {
  type: "eq" | "neq" | "in" | "gte" | "lte" | "gt" | "lt";
  column: string;
  value: unknown;
};

export type MockQueryState = {
  table: string;
  op: "select" | "insert" | "update" | "upsert" | "delete";
  payload?: unknown;
  options?: unknown;
  filters: MockFilter[];
  orders: Array<{ column: string; options?: unknown }>;
  limitValue?: number;
};

export type TableQueryHandler = (
  state: MockQueryState
) => MockQueryResult | Promise<MockQueryResult>;

export type RpcHandler = (
  fn: string,
  args?: Record<string, unknown>
) => MockQueryResult | Promise<MockQueryResult>;

export type AdminSupabaseClient = ReturnType<typeof createAdminSupabaseClient>;

export function createQueryBuilder(table: string, handler: TableQueryHandler) {
  const state: MockQueryState = {
    table,
    op: "select",
    filters: [],
    orders: [],
  };

  const execute = (): Promise<MockQueryResult> =>
    Promise.resolve(handler(state)).then((res) => ({
      data: res.data ?? null,
      error: res.error ?? null,
      ...(res.count !== undefined ? { count: res.count } : {}),
    }));

  const builder = {
    select(_columns?: string, options?: unknown) {
      if (state.op === "select") {
        state.options = options;
      }
      return builder;
    },
    insert(payload: unknown, options?: unknown) {
      state.op = "insert";
      state.payload = payload;
      state.options = options;
      return builder;
    },
    update(payload: unknown) {
      state.op = "update";
      state.payload = payload;
      return builder;
    },
    upsert(payload: unknown, options?: unknown) {
      state.op = "upsert";
      state.payload = payload;
      state.options = options;
      return builder;
    },
    delete() {
      state.op = "delete";
      return builder;
    },
    eq(column: string, value: unknown) {
      state.filters.push({ type: "eq", column, value });
      return builder;
    },
    neq(column: string, value: unknown) {
      state.filters.push({ type: "neq", column, value });
      return builder;
    },
    in(column: string, value: unknown[]) {
      state.filters.push({ type: "in", column, value });
      return builder;
    },
    gte(column: string, value: unknown) {
      state.filters.push({ type: "gte", column, value });
      return builder;
    },
    lte(column: string, value: unknown) {
      state.filters.push({ type: "lte", column, value });
      return builder;
    },
    gt(column: string, value: unknown) {
      state.filters.push({ type: "gt", column, value });
      return builder;
    },
    lt(column: string, value: unknown) {
      state.filters.push({ type: "lt", column, value });
      return builder;
    },
    order(column: string, options?: unknown) {
      state.orders.push({ column, options });
      return builder;
    },
    limit(value: number) {
      state.limitValue = value;
      return builder;
    },
    single() {
      return execute();
    },
    maybeSingle() {
      return execute();
    },
    then<TResult1 = MockQueryResult, TResult2 = never>(
      onfulfilled?: ((value: MockQueryResult) => TResult1 | PromiseLike<TResult1>) | null,
      onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
    ): Promise<TResult1 | TResult2> {
      return execute().then(onfulfilled, onrejected);
    },
  };

  return builder;
}

export function createMockSupabaseClient(
  tableHandler: TableQueryHandler,
  rpcHandler: RpcHandler = () => ({ data: null, error: null })
): {
  supabase: ServerSupabaseClient;
  admin: AdminSupabaseClient;
  signOutMock: ReturnType<typeof vi.fn>;
  fromSpy: ReturnType<typeof vi.fn>;
  rpcSpy: ReturnType<typeof vi.fn>;
} {
  const signOutMock = vi.fn().mockResolvedValue({ error: null });
  const fromSpy = vi.fn((table: string) =>
    createQueryBuilder(table, tableHandler)
  );
  const rpcSpy = vi.fn((fn: string, args?: Record<string, unknown>) =>
    Promise.resolve(rpcHandler(fn, args))
  );

  const client = {
    from: fromSpy,
    rpc: rpcSpy,
    auth: {
      signOut: signOutMock,
    },
  };

  return {
    supabase: client as unknown as ServerSupabaseClient,
    admin: client as unknown as AdminSupabaseClient,
    signOutMock,
    fromSpy,
    rpcSpy,
  };
}

export function makeProfileRow(overrides: Partial<ProfileRow> = {}): ProfileRow {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    email: "seller@autonexa.ca",
    first_name: "Sarah",
    last_name: "Jenkins",
    phone_e164: "+14165550100",
    postal_code: "M5V 2T6",
    province: "ON",
    city: "Toronto",
    location: null,
    role: "SELLER",
    kyc_status: "VERIFIED",
    dealership_id: null,
    language_pref: "en",
    email_verified: true,
    phone_verified: true,
    marketing_opt_in: false,
    mfa_enabled: false,
    avatar_url: null,
    job_title: null,
    regulator_board_id: null,
    account_status: "ACTIVE",
    deletion_requested_at: null,
    notification_preferences: {
      auctionClosing: true,
      outbidAlert: true,
      escrowDisbursement: true,
      complianceReview: true,
      emailEnabled: true,
      smsEnabled: true,
    },
    created_at: "2026-11-01T00:00:00.000Z",
    updated_at: "2026-11-01T00:00:00.000Z",
    ...overrides,
  };
}

export function makeSessionContext(
  overrides: Partial<SessionContext> & { profile?: Partial<ProfileRow> } = {}
): SessionContext {
  const { profile: profileOverrides, ...restOverrides } = overrides;
  const role = restOverrides.role ?? "SELLER";
  const userId =
    restOverrides.userId ?? "00000000-0000-4000-8000-000000000001";
  const email = restOverrides.email ?? "seller@autonexa.ca";
  const profile = makeProfileRow({
    id: userId,
    email,
    role,
    dealership_id: restOverrides.dealershipId ?? null,
    kyc_status: restOverrides.kycStatus ?? "VERIFIED",
    ...profileOverrides,
  });

  const { supabase } = createMockSupabaseClient(() => ({ data: null }));

  return {
    userId,
    email,
    role,
    kycStatus: restOverrides.kycStatus ?? "VERIFIED",
    dealershipId: restOverrides.dealershipId ?? null,
    dealershipStatus: restOverrides.dealershipStatus ?? null,
    seatRole: restOverrides.seatRole ?? null,
    seatActive: restOverrides.seatActive ?? false,
    aal: restOverrides.aal ?? "aal1",
    profile,
    supabase: restOverrides.supabase ?? supabase,
  };
}
