import { z } from "zod";
import type { SessionContext } from "@/lib/server/auth";
import { ExternalServiceError, ForbiddenError } from "@/lib/server/errors";
import { logger } from "@/lib/server/logger";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { Database, Json } from "@/lib/supabase/database.types";
import { sanitizeCsvCell } from "@/lib/server/services/admin-analytics.service";
import type {
  AdminAuditActionGroup,
  AdminAuditLogResponse,
  AuditChainIntegrity,
  AuditLogItem,
  AuditLogSummaryCounts,
} from "@/lib/types/admin";

type AuditLogRow = Database["public"]["Tables"]["audit_logs"]["Row"];

const emptyToUndefined = (val: unknown): unknown =>
  val === "" || val === null || val === undefined ? undefined : val;

const ACTION_GROUP_MAP: Record<Exclude<AdminAuditActionGroup, "ALL">, string[]> = {
  OVERRIDES: [
    "AUCTION_EXTENDED",
    "AUCTION_TIME_EXTENSION",
    "AUCTION_FORCE_CLOSED",
    "AUCTION_HALTED",
    "AUCTION_EMERGENCY_KILL",
    "AUCTION_CLOSED_UNSEALED",
    "MATCH_ACCEPTANCE_EXPIRED",
  ],
  BIDS: [
    "SEALED_BID_PLACED",
    "SEALED_BID_REVISED",
    "DEALER_BID_ACCEPTED",
  ],
  APPROVALS: [
    "LISTING_APPROVED",
    "LISTING_REJECTED",
    "LISTING_EDITS_REQUESTED",
    "DEALERSHIP_APPROVED",
    "DEALERSHIP_REJECTED",
    "DEALERSHIP_SUSPENDED",
    "DEALERSHIP_REVOKED",
    "KYC_VERIFIED",
    "KYC_REJECTED",
  ],
  DISPUTES: [
    "DISPUTE_OPENED",
    "DISPUTE_RESOLVED",
    "DISPUTE_SETTLED",
    "MATCH_OUTCOME_LOGGED",
  ],
};

export const adminAuditLogQuerySchema = z.object({
  page: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().min(1).max(10_000).default(1)
  ),
  pageSize: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().min(1).max(100).default(15)
  ),
  action: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      const upper = String(val).trim().toUpperCase();
      return upper === "ALL" ? undefined : upper;
    },
    z.string().max(80).optional()
  ),
  actionGroup: z.preprocess(
    (val) =>
      emptyToUndefined(val) === undefined
        ? "ALL"
        : String(val).trim().toUpperCase(),
    z
      .enum(["ALL", "OVERRIDES", "BIDS", "APPROVALS", "DISPUTES"])
      .default("ALL")
  ),
  entityType: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      const upper = String(val).trim().toUpperCase();
      return upper === "ALL" ? undefined : upper;
    },
    z
      .string()
      .regex(/^[A-Z0-9_]{1,60}$/, "Invalid entityType filter.")
      .optional()
  ),
  province: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      const upper = String(val).trim().toUpperCase();
      return upper === "ALL" ? undefined : upper;
    },
    z
      .string()
      .regex(/^[A-Z]{2}$/, "Province filter must be a 2-letter code.")
      .optional()
  ),
  dateFrom: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}/, "dateFrom must begin with YYYY-MM-DD.")
      .max(40)
      .optional()
  ),
  dateTo: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}/, "dateTo must begin with YYYY-MM-DD.")
      .max(40)
      .optional()
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

export type AdminAuditLogQuery = z.output<typeof adminAuditLogQuerySchema>;

const chainVerifySchema = z.object({
  valid: z.boolean(),
  total_rows: z.coerce.number().int().nonnegative(),
  verified_rows: z.coerce.number().int().nonnegative(),
  invalid_rows: z.coerce.number().int().nonnegative(),
  integrity_percent: z.coerce.number(),
  latest_hash: z.string().nullable(),
  first_broken_id: z.coerce.number().int().nullable(),
});

function toRecordOrNull(value: Json | null): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function mapAuditRow(row: AuditLogRow): AuditLogItem {
  return {
    id: row.id,
    timestamp: row.created_at,
    actorId: row.actor_id,
    actorName: row.actor_name?.trim() || "System Process",
    actorRole: row.actor_role,
    action: row.action,
    entityType: row.entity_type.toUpperCase(),
    entityId: row.entity_id,
    ipAddress: row.ip_address?.trim() || "Internal RPC / Server",
    provincialJurisdiction: row.provincial_jurisdiction?.trim() || "ON",
    details: row.details?.trim() || row.action,
    immutableHash: row.immutable_hash ?? "",
    beforeJson: toRecordOrNull(row.before_json),
    afterJson: toRecordOrNull(row.after_json),
  };
}

function normalizeDateFrom(value: string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? `${value}T00:00:00.000Z`
    : value;
}

function normalizeDateTo(value: string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? `${value}T23:59:59.999Z`
    : value;
}

function sanitizePostgrestLikeTerm(search: string): string {
  return search.replace(/[,()*\\\r\n%_]/g, " ").trim();
}

function computeSummaryAndFacets(
  rows: ReadonlyArray<{
    action: string;
    entity_type: string;
    provincial_jurisdiction: string | null;
  }>,
  totalFromChain?: number
) {
  const overridesSet = new Set(ACTION_GROUP_MAP.OVERRIDES);
  const bidsSet = new Set(ACTION_GROUP_MAP.BIDS);
  const approvalsSet = new Set(ACTION_GROUP_MAP.APPROVALS);
  const disputesSet = new Set(ACTION_GROUP_MAP.DISPUTES);

  const actionsSet = new Set<string>();
  const entityTypesSet = new Set<string>();
  const provincesSet = new Set<string>();

  let overrides = 0;
  let bids = 0;
  let approvals = 0;
  let disputes = 0;

  for (const r of rows) {
    const actionUpper = r.action.toUpperCase();
    actionsSet.add(actionUpper);
    if (r.entity_type) entityTypesSet.add(r.entity_type.toUpperCase());
    if (r.provincial_jurisdiction) {
      provincesSet.add(r.provincial_jurisdiction.toUpperCase());
    }

    if (overridesSet.has(actionUpper)) overrides += 1;
    if (bidsSet.has(actionUpper)) bids += 1;
    if (approvalsSet.has(actionUpper)) approvals += 1;
    if (disputesSet.has(actionUpper)) disputes += 1;
  }

  const counts: AuditLogSummaryCounts = {
    total: totalFromChain ?? rows.length,
    overrides,
    bids,
    approvals,
    disputes,
  };

  return {
    counts,
    facets: {
      actions: Array.from(actionsSet).sort(),
      entityTypes: Array.from(entityTypesSet).sort(),
      provinces: Array.from(provincesSet).sort(),
    },
  };
}

function applyAuditFilters<
  TQuery extends {
    eq: (col: string, val: string) => TQuery;
    in: (col: string, vals: readonly string[]) => TQuery;
    ilike: (col: string, pattern: string) => TQuery;
    gte: (col: string, val: string) => TQuery;
    lte: (col: string, val: string) => TQuery;
    or: (filters: string) => TQuery;
  },
>(baseQuery: TQuery, query: AdminAuditLogQuery): TQuery {
  let builder = baseQuery;

  if (query.action) {
    builder = builder.eq("action", query.action);
  } else if (query.actionGroup !== "ALL") {
    builder = builder.in("action", ACTION_GROUP_MAP[query.actionGroup]);
  }

  if (query.entityType) {
    builder = builder.ilike("entity_type", query.entityType);
  }

  if (query.province) {
    builder = builder.eq("provincial_jurisdiction", query.province);
  }

  if (query.dateFrom) {
    builder = builder.gte("created_at", normalizeDateFrom(query.dateFrom));
  }

  if (query.dateTo) {
    builder = builder.lte("created_at", normalizeDateTo(query.dateTo));
  }

  if (query.search) {
    const safe = sanitizePostgrestLikeTerm(query.search);
    if (safe.length > 0) {
      const pattern = `*${safe}*`;
      builder = builder.or(
        `actor_name.ilike.${pattern},entity_id.ilike.${pattern},details.ilike.${pattern},action.ilike.${pattern},immutable_hash.ilike.${pattern},ip_address.ilike.${pattern}`
      );
    }
  }

  return builder;
}

/**
 * Queries paginated, filterable, cryptographically verified immutable audit log
 * entries with SHA-256 chain verification and facet metadata (FR-AD-09, H8).
 */
export async function listAdminAuditLogs(
  ctx: SessionContext,
  query: AdminAuditLogQuery
): Promise<AdminAuditLogResponse> {
  if (ctx.role !== "ADMIN") {
    throw new ForbiddenError(
      "Only platform administrators can inspect the immutable audit trail."
    );
  }

  const admin = createAdminSupabaseClient();
  const from = (query.page - 1) * query.pageSize;
  const to = from + query.pageSize - 1;

  let rowsQuery = admin
    .from("audit_logs")
    .select("*", { count: "exact" })
    .order("id", { ascending: false });

  rowsQuery = applyAuditFilters(rowsQuery, query);

  const [rowsResult, chainResult, metadataResult] = await Promise.all([
    rowsQuery.range(from, to),
    admin.rpc("verify_audit_log_chain"),
    admin
      .from("audit_logs")
      .select("action, entity_type, provincial_jurisdiction")
      .order("id", { ascending: false })
      .limit(10_000),
  ]);

  if (rowsResult.error) {
    logger.error("Failed to fetch paginated admin audit logs", {
      route: "GET /api/admin/audit-log",
      actorId: ctx.userId,
      meta: { error: rowsResult.error },
    });
    throw new ExternalServiceError(
      "Unable to query the audit log ledger.",
      "EXTERNAL_SERVICE_ERROR",
      rowsResult.error
    );
  }

  const parsedChain = chainResult.data
    ? chainVerifySchema.safeParse(chainResult.data)
    : null;

  const integrity: AuditChainIntegrity =
    parsedChain && parsedChain.success
      ? {
          valid: parsedChain.data.valid,
          totalRows: parsedChain.data.total_rows,
          verifiedRows: parsedChain.data.verified_rows,
          invalidRows: parsedChain.data.invalid_rows,
          integrityPercent: parsedChain.data.integrity_percent,
          latestHash: parsedChain.data.latest_hash,
          firstBrokenId: parsedChain.data.first_broken_id,
        }
      : {
          valid: false,
          totalRows: rowsResult.count ?? 0,
          verifiedRows: 0,
          invalidRows: 0,
          integrityPercent: 0,
          latestHash: null,
          firstBrokenId: null,
        };

  const totalItems = rowsResult.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / query.pageSize));
  const { counts, facets } = computeSummaryAndFacets(
    metadataResult.data ?? [],
    integrity.totalRows
  );

  return {
    items: (rowsResult.data ?? []).map(mapAuditRow),
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      totalItems,
      totalPages,
    },
    integrity,
    counts,
    facets,
    serverTime: new Date().toISOString(),
  };
}

/**
 * Exports up to 5,000 filtered immutable audit log entries as an RFC 4180
 * formula-injection-safe CSV document for compliance & PIPEDA review.
 */
export async function exportAdminAuditLogsCsv(
  ctx: SessionContext,
  query: AdminAuditLogQuery
): Promise<string> {
  if (ctx.role !== "ADMIN") {
    throw new ForbiddenError(
      "Only platform administrators can export the immutable audit trail."
    );
  }

  const admin = createAdminSupabaseClient();
  let exportQuery = admin
    .from("audit_logs")
    .select("*")
    .order("id", { ascending: false })
    .limit(5_000);

  exportQuery = applyAuditFilters(exportQuery, query);

  const { data, error } = await exportQuery;

  if (error) {
    logger.error("Failed to export admin audit logs CSV", {
      route: "GET /api/admin/audit-log?format=csv",
      actorId: ctx.userId,
      meta: { error },
    });
    throw new ExternalServiceError(
      "Unable to export the immutable audit trail.",
      "EXTERNAL_SERVICE_ERROR",
      error
    );
  }

  const headers = [
    "id",
    "timestamp_utc",
    "action",
    "actor_id",
    "actor_name",
    "actor_role",
    "entity_type",
    "entity_id",
    "province",
    "ip_address",
    "details",
    "immutable_hash",
  ];

  const rows = (data ?? []).map((row) =>
    [
      row.id,
      row.created_at,
      row.action,
      row.actor_id ?? "",
      row.actor_name ?? "",
      row.actor_role,
      row.entity_type.toUpperCase(),
      row.entity_id,
      row.provincial_jurisdiction ?? "",
      row.ip_address ?? "",
      row.details ?? "",
      row.immutable_hash ?? "",
    ]
      .map(sanitizeCsvCell)
      .join(",")
  );

  return [headers.map(sanitizeCsvCell).join(","), ...rows].join("\r\n");
}
