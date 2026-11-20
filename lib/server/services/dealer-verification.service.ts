import { z } from "zod";
import {
  isValidPostalCode,
  normalizePostalCode,
  PROVINCE_CODES,
} from "@/lib/canada";
import { geocodeCanadianPostalCode } from "@/lib/server/adapters/geo.adapter";
import type { SessionContext } from "@/lib/server/auth";
import {
  AppError,
  ConflictError,
  ExternalServiceError,
  ForbiddenError,
  NotFoundError,
} from "@/lib/server/errors";
import { logger } from "@/lib/server/logger";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";
import type {
  AdminDealerApplication,
  AdminDealerCounts,
  AdminDealerDecisionAction,
  AdminDealerDecisionResult,
  AdminDealersResponse,
} from "@/lib/types/admin";
import type {
  DealerOnboardingApplication,
  DealerOnboardingStatusResponse,
} from "@/lib/types/dealer";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type DealershipRow = Database["public"]["Tables"]["dealerships"]["Row"];
type AdminClient = ReturnType<typeof createAdminSupabaseClient>;

const emptyToNull = (val: unknown): unknown =>
  typeof val === "string" && val.trim() === "" ? null : val;

export const submitDealershipApplicationSchema = z.object({
  dealershipName: z
    .string()
    .trim()
    .min(2, "Dealership trade name is required.")
    .max(120, "Dealership trade name is too long."),
  legalEntityName: z
    .string()
    .trim()
    .min(2, "Registered legal entity name is required.")
    .max(160, "Legal entity name is too long."),
  businessNumber: z.preprocess(
    emptyToNull,
    z.string().trim().max(40).nullable().optional()
  ),
  regulator: z.enum(["OMVIC", "AMVIC", "VSA", "OPC"]),
  licenseNumber: z
    .string()
    .trim()
    .min(3, "Master dealer license number is required.")
    .max(60, "License number is too long.")
    .transform((val) => val.toUpperCase()),
  licenseExpiry: z.preprocess(
    emptyToNull,
    z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD expiry date format.")
      .nullable()
      .optional()
  ),
  streetAddress: z
    .string()
    .trim()
    .min(4, "Physical street address is required.")
    .max(180),
  city: z.string().trim().min(2, "City is required.").max(100),
  province: z
    .string()
    .trim()
    .transform((val) => val.toUpperCase())
    .refine(
      (val) => PROVINCE_CODES.some((code) => code === val),
      "Select a valid Canadian province or territory."
    ),
  postalCode: z
    .string()
    .trim()
    .refine(
      (val) => isValidPostalCode(val),
      "Enter a valid Canadian postal code (e.g. L3R 5H6)."
    )
    .transform((val) => normalizePostalCode(val)),
  serviceRadiusKm: z.coerce
    .number()
    .int("Service radius must be a whole number in km.")
    .min(10, "Minimum service radius is 10 km.")
    .max(1000, "Maximum service radius is 1,000 km."),
  contactName: z
    .string()
    .trim()
    .min(2, "Authorized purchasing officer name is required.")
    .max(120),
  contactTitle: z.preprocess(
    emptyToNull,
    z.string().trim().max(120).nullable().optional()
  ),
  contactEmail: z
    .string()
    .trim()
    .email("Enter a valid work email address.")
    .max(160),
  contactPhone: z
    .string()
    .trim()
    .min(7, "Direct work phone number is required.")
    .max(32),
  agreeOmvicEthics: z.literal(true, {
    message: "You must certify provincial motor vehicle wholesale compliance.",
  }),
});

export type SubmitDealershipApplicationInput = z.output<
  typeof submitDealershipApplicationSchema
>;

const emptyToUndefined = (val: unknown): unknown =>
  val === "" || val === null || val === undefined ? undefined : val;

export const adminDealersQuerySchema = z.object({
  status: z.preprocess(
    (val) =>
      val === "" || val === null || val === undefined
        ? undefined
        : String(val).trim().toUpperCase(),
    z
      .enum([
        "ALL",
        "PENDING",
        "VERIFIED",
        "REJECTED",
        "SUSPENDED",
        "REVOKED",
        "DISQUALIFIED",
      ])
      .optional()
  ),
  regulator: z.preprocess(
    (val) =>
      val === "" || val === null || val === undefined
        ? undefined
        : String(val).trim().toUpperCase(),
    z.enum(["ALL", "OMVIC", "AMVIC", "VSA", "OPC"]).optional()
  ),
  search: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(120).optional()
  ),
});

export type AdminDealersQuery = z.output<typeof adminDealersQuerySchema>;

export const decideDealershipSchema = z
  .object({
    action: z.enum(["APPROVE", "REJECT", "SUSPEND", "REVOKE"]),
    notes: z.string().trim().max(1000).optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.action !== "APPROVE" &&
      (!data.notes || data.notes.trim().length < 5)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["notes"],
        message: "Provide an audit finding or reason (at least 5 characters).",
      });
    }
  });

export type DecideDealershipInput = z.output<typeof decideDealershipSchema>;

const voidBidsRpcResultSchema = z.object({
  dealership_id: z.string().uuid(),
  previous_status: z.string(),
  new_status: z.string(),
  voided_bids_count: z.number().int().min(0),
  affected_listing_ids: z.array(z.string().uuid()),
});

function assertAdmin(ctx: SessionContext): void {
  if (ctx.role !== "ADMIN") {
    throw new ForbiddenError(
      "Only platform administrators can manage dealership licensing."
    );
  }
}

function mapOnboardingApplication(
  row: DealershipRow
): DealerOnboardingApplication {
  return {
    id: row.id,
    dealershipName: row.operating_name,
    legalEntityName: row.legal_name,
    regulator: row.regulator,
    licenseNumber: row.license_number,
    licenseExpiry: row.license_expiry,
    businessNumber: row.business_number,
    status: row.status,
    streetAddress: row.street_address,
    city: row.city,
    province: row.province,
    postalCode: row.postal_code,
    serviceRadiusKm: row.service_radius_km,
    contactName: row.contact_name,
    contactTitle: row.contact_title,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    verificationNotes: row.verification_notes,
    verifiedAt: row.verified_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function extractPlanName(rawPlans: unknown): string | null {
  const candidate = Array.isArray(rawPlans) ? rawPlans[0] : rawPlans;
  if (typeof candidate !== "object" || candidate === null) return null;
  const name = (candidate as Record<string, unknown>).name;
  return typeof name === "string" ? name : null;
}

async function hydrateAdminDealers(
  admin: AdminClient,
  rows: DealershipRow[]
): Promise<AdminDealerApplication[]> {
  if (rows.length === 0) return [];

  const dealerIds = rows.map((row) => row.id);
  const [bidsRes, membersRes, subsRes] = await Promise.all([
    admin
      .from("bids")
      .select("dealership_id")
      .in("dealership_id", dealerIds)
      .eq("status", "ACTIVE"),
    admin
      .from("dealership_members")
      .select("dealership_id")
      .in("dealership_id", dealerIds)
      .eq("is_active", true),
    admin
      .from("subscriptions")
      .select("dealership_id, status, plans ( name )")
      .in("dealership_id", dealerIds),
  ]);

  const activeBidsCountByDealer = new Map<string, number>();
  for (const bid of bidsRes.data ?? []) {
    activeBidsCountByDealer.set(
      bid.dealership_id,
      (activeBidsCountByDealer.get(bid.dealership_id) ?? 0) + 1
    );
  }

  const teamMembersCountByDealer = new Map<string, number>();
  for (const member of membersRes.data ?? []) {
    teamMembersCountByDealer.set(
      member.dealership_id,
      (teamMembersCountByDealer.get(member.dealership_id) ?? 0) + 1
    );
  }

  const subscriptionByDealer = new Map<
    string,
    { status: string; planName: string | null }
  >();
  for (const sub of subsRes.data ?? []) {
    subscriptionByDealer.set(sub.dealership_id, {
      status: sub.status,
      planName: extractPlanName(sub.plans),
    });
  }

  return rows.map((row) => {
    const sub = subscriptionByDealer.get(row.id);
    return {
      id: row.id,
      dealershipName: row.operating_name,
      legalEntityName: row.legal_name,
      businessNumber: row.business_number,
      regulator: row.regulator,
      licenseNumber: row.license_number,
      licenseExpiry: row.license_expiry,
      licenseDocPath: row.license_doc_path,
      address: row.street_address,
      city: row.city,
      province: row.province,
      postalCode: row.postal_code,
      contactName: row.contact_name,
      contactTitle: row.contact_title,
      contactEmail: row.contact_email,
      contactPhone: row.contact_phone,
      serviceRadiusKm: row.service_radius_km,
      submittedAt: row.created_at,
      verifiedAt: row.verified_at,
      status: row.status,
      notes: row.verification_notes,
      activeBidsCount: activeBidsCountByDealer.get(row.id) ?? 0,
      teamMembersCount: teamMembersCountByDealer.get(row.id) ?? 0,
      subscriptionStatus: sub?.status ?? null,
      planName: sub?.planName ?? null,
    };
  });
}

function computeDealerCounts(rows: ReadonlyArray<DealershipRow>): AdminDealerCounts {
  return {
    ALL: rows.length,
    PENDING: rows.filter((r) => r.status === "PENDING").length,
    VERIFIED: rows.filter((r) => r.status === "VERIFIED").length,
    REJECTED: rows.filter((r) => r.status === "REJECTED").length,
    SUSPENDED: rows.filter((r) => r.status === "SUSPENDED").length,
    REVOKED: rows.filter((r) => r.status === "REVOKED").length,
  };
}

function throwLicenseConflictError(): never {
  throw new AppError({
    status: 409,
    code: "CONFLICT",
    message:
      "A dealership with this regulator and license number is already registered.",
    fields: {
      licenseNumber:
        "This dealer license number is already registered with that regulator.",
    },
  });
}

/**
 * Loads the authenticated user's existing dealership application (if any) and profile prefill data.
 */
export async function getMyDealershipOnboarding(
  ctx: SessionContext
): Promise<DealerOnboardingStatusResponse> {
  const admin = createAdminSupabaseClient();
  let application: DealerOnboardingApplication | null = null;

  if (ctx.dealershipId) {
    const { data: row, error } = await admin
      .from("dealerships")
      .select("*")
      .eq("id", ctx.dealershipId)
      .maybeSingle();

    if (error) {
      throw new ExternalServiceError(
        "Unable to load dealership onboarding status.",
        "EXTERNAL_SERVICE_ERROR",
        error
      );
    }

    if (row) {
      application = mapOnboardingApplication(row);
    }
  }

  const canEdit =
    !application ||
    application.status === "PENDING" ||
    application.status === "REJECTED";

  return {
    application,
    prefill: {
      firstName: ctx.profile.first_name,
      lastName: ctx.profile.last_name,
      email: ctx.email,
      phone: ctx.profile.phone_e164 ?? "",
      postalCode: ctx.profile.postal_code ?? "",
      province: ctx.profile.province ?? "ON",
      city: ctx.profile.city ?? "",
      role: ctx.role,
    },
    canEdit,
    serverTime: new Date().toISOString(),
  };
}

/**
 * Submits or updates a PENDING dealership licensing onboarding application (BR-13).
 * Never grants VERIFIED status or elevates `profiles.role` without Admin approval.
 */
export async function submitDealershipApplication(
  ctx: SessionContext,
  input: SubmitDealershipApplicationInput,
  requestMeta: { ipAddress: string | null }
): Promise<{
  application: DealerOnboardingApplication;
  created: boolean;
  message: string;
}> {
  const admin = createAdminSupabaseClient();
  const geo = await geocodeCanadianPostalCode(input.postalCode, {
    preferredProvince: input.province,
    preferredCity: input.city,
  });

  const resolvedCity = input.city.trim() || geo.city;
  let existingRow: DealershipRow | null = null;

  if (ctx.dealershipId) {
    const { data, error } = await admin
      .from("dealerships")
      .select("*")
      .eq("id", ctx.dealershipId)
      .maybeSingle();

    if (error) {
      throw new ExternalServiceError(
        "Unable to verify current dealership status.",
        "EXTERNAL_SERVICE_ERROR",
        error
      );
    }
    existingRow = data;
  }

  let savedRow: DealershipRow;
  let wasCreated = false;

  if (existingRow) {
    const canModifyExisting =
      ctx.role === "ADMIN" ||
      ctx.role === "DEALER_ADMIN" ||
      ctx.seatRole === "DEALER_ADMIN";

    if (!canModifyExisting) {
      throw new ForbiddenError(
        "Only a dealership principal administrator can update licensing details."
      );
    }

    if (existingRow.status === "VERIFIED") {
      throw new ConflictError(
        "Your dealership licence is already verified and active.",
        "ALREADY_VERIFIED"
      );
    }

    if (
      existingRow.status === "SUSPENDED" ||
      existingRow.status === "REVOKED"
    ) {
      throw new ForbiddenError(
        "Suspended or revoked dealerships cannot self-resubmit. Contact AutoNexa Compliance.",
        "DEALERSHIP_DISQUALIFIED"
      );
    }

    const { data: updated, error: updateErr } = await admin
      .from("dealerships")
      .update({
        operating_name: input.dealershipName,
        legal_name: input.legalEntityName,
        business_number: input.businessNumber ?? null,
        regulator: input.regulator,
        license_number: input.licenseNumber,
        license_expiry: input.licenseExpiry ?? null,
        status: "PENDING",
        street_address: input.streetAddress,
        city: resolvedCity,
        province: input.province,
        postal_code: geo.postalCode,
        location: geo.locationWkt,
        service_radius_km: input.serviceRadiusKm,
        contact_name: input.contactName,
        contact_title: input.contactTitle ?? null,
        contact_email: input.contactEmail.toLowerCase(),
        contact_phone: input.contactPhone,
        verification_notes: null,
        verified_by: null,
        verified_at: null,
      })
      .eq("id", existingRow.id)
      .select("*")
      .single();

    if (updateErr || !updated) {
      if (updateErr?.code === "23505") {
        throwLicenseConflictError();
      }
      throw new ExternalServiceError(
        "Unable to update dealership licensing application.",
        "EXTERNAL_SERVICE_ERROR",
        updateErr
      );
    }

    savedRow = updated;
  } else {
    const { data: inserted, error: insertErr } = await admin
      .from("dealerships")
      .insert({
        operating_name: input.dealershipName,
        legal_name: input.legalEntityName,
        business_number: input.businessNumber ?? null,
        regulator: input.regulator,
        license_number: input.licenseNumber,
        license_expiry: input.licenseExpiry ?? null,
        status: "PENDING",
        street_address: input.streetAddress,
        city: resolvedCity,
        province: input.province,
        postal_code: geo.postalCode,
        location: geo.locationWkt,
        service_radius_km: input.serviceRadiusKm,
        contact_name: input.contactName,
        contact_title: input.contactTitle ?? null,
        contact_email: input.contactEmail.toLowerCase(),
        contact_phone: input.contactPhone,
      })
      .select("*")
      .single();

    if (insertErr || !inserted) {
      if (insertErr?.code === "23505") {
        throwLicenseConflictError();
      }
      throw new ExternalServiceError(
        "Unable to submit dealership licensing application.",
        "EXTERNAL_SERVICE_ERROR",
        insertErr
      );
    }

    try {
      const [profileRes, memberRes] = await Promise.all([
        admin
          .from("profiles")
          .update({ dealership_id: inserted.id })
          .eq("id", ctx.userId),
        admin.from("dealership_members").upsert(
          {
            dealership_id: inserted.id,
            user_id: ctx.userId,
            seat_role: "DEALER_ADMIN",
            is_active: true,
          },
          { onConflict: "dealership_id,user_id" }
        ),
      ]);

      if (profileRes.error || memberRes.error) {
        await admin.from("dealerships").delete().eq("id", inserted.id);
        throw new ExternalServiceError(
          "Unable to link user account to dealership application.",
          "EXTERNAL_SERVICE_ERROR",
          profileRes.error ?? memberRes.error
        );
      }
    } catch (err) {
      if (err instanceof AppError) throw err;
      await admin.from("dealerships").delete().eq("id", inserted.id);
      throw err;
    }

    savedRow = inserted;
    wasCreated = true;
  }

  const actorName =
    `${ctx.profile.first_name} ${ctx.profile.last_name}`.trim() || ctx.email;

  await Promise.all([
    admin.from("audit_logs").insert({
      actor_id: ctx.userId,
      actor_name: actorName,
      actor_role: ctx.role,
      action: "DEALERSHIP_APPLICATION_SUBMITTED",
      entity_type: "dealership",
      entity_id: savedRow.id,
      provincial_jurisdiction: savedRow.province,
      ip_address: requestMeta.ipAddress,
      details: `${savedRow.operating_name} (${savedRow.regulator} #${savedRow.license_number}) submitted for admin verification`,
      after_json: {
        operatingName: savedRow.operating_name,
        regulator: savedRow.regulator,
        licenseNumber: savedRow.license_number,
        status: savedRow.status,
        serviceRadiusKm: savedRow.service_radius_km,
        postalCode: savedRow.postal_code,
      },
    }),
    admin.from("notifications").insert({
      user_id: ctx.userId,
      type: "SYSTEM",
      title: "Dealership licensing application submitted",
      description: `Your application for ${savedRow.operating_name} (${savedRow.regulator} #${savedRow.license_number}) is queued for AutoNexa compliance review.`,
      metadata: {
        dealershipId: savedRow.id,
        status: savedRow.status,
      },
    }),
  ]);

  return {
    application: mapOnboardingApplication(savedRow),
    created: wasCreated,
    message: wasCreated
      ? "Dealership licensing application submitted for compliance verification."
      : "Dealership licensing application updated and queued for compliance verification.",
  };
}

/**
 * Lists Canadian dealership applications for Admin compliance review (FR-AD-02).
 */
export async function listDealerApplications(
  ctx: SessionContext,
  filters: AdminDealersQuery
): Promise<AdminDealersResponse> {
  assertAdmin(ctx);

  const admin = createAdminSupabaseClient();
  const { data: rows, error } = await admin
    .from("dealerships")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new ExternalServiceError(
      "Unable to load dealership verification queue.",
      "EXTERNAL_SERVICE_ERROR",
      error
    );
  }

  const allRows = rows ?? [];
  const counts = computeDealerCounts(allRows);
  const searchLower = filters.search?.toLowerCase();

  const filteredRows = allRows.filter((row) => {
    if (filters.regulator && filters.regulator !== "ALL") {
      if (row.regulator !== filters.regulator) return false;
    }

    if (filters.status && filters.status !== "ALL") {
      if (filters.status === "DISQUALIFIED") {
        if (
          row.status !== "REJECTED" &&
          row.status !== "SUSPENDED" &&
          row.status !== "REVOKED"
        ) {
          return false;
        }
      } else if (row.status !== filters.status) {
        return false;
      }
    }

    if (searchLower) {
      const matched =
        row.operating_name.toLowerCase().includes(searchLower) ||
        row.legal_name.toLowerCase().includes(searchLower) ||
        row.license_number.toLowerCase().includes(searchLower) ||
        row.city.toLowerCase().includes(searchLower) ||
        row.province.toLowerCase().includes(searchLower) ||
        row.contact_name.toLowerCase().includes(searchLower) ||
        row.contact_email.toLowerCase().includes(searchLower);
      if (!matched) return false;
    }

    return true;
  });

  const items = await hydrateAdminDealers(admin, filteredRows);

  return {
    items,
    counts,
    serverTime: new Date().toISOString(),
  };
}

/**
 * Loads a single dealership application dossier for Admin review.
 */
export async function getAdminDealerApplication(
  ctx: SessionContext,
  dealershipId: string
): Promise<AdminDealerApplication> {
  assertAdmin(ctx);
  if (!UUID_REGEX.test(dealershipId)) {
    throw new NotFoundError("Dealership application not found.");
  }

  const admin = createAdminSupabaseClient();
  const { data: row, error } = await admin
    .from("dealerships")
    .select("*")
    .eq("id", dealershipId)
    .maybeSingle();

  if (error) {
    throw new ExternalServiceError(
      "Unable to load dealership application.",
      "EXTERNAL_SERVICE_ERROR",
      error
    );
  }

  if (!row) {
    throw new NotFoundError("Dealership application not found.");
  }

  const [hydrated] = await hydrateAdminDealers(admin, [row]);
  return hydrated;
}

async function syncApprovedDealerAccountsAndSubscription(
  admin: AdminClient,
  dealership: DealershipRow,
  nowMs: number,
  nowIso: string
): Promise<string[]> {
  const [profilesRes, membersRes] = await Promise.all([
    admin
      .from("profiles")
      .select("id, email, role")
      .eq("dealership_id", dealership.id)
      .order("created_at", { ascending: true }),
    admin
      .from("dealership_members")
      .select("user_id, seat_role, is_active")
      .eq("dealership_id", dealership.id),
  ]);

  const linkedProfiles = profilesRes.data ?? [];
  const members = membersRes.data ?? [];
  const adminSeatUsers = new Set(
    members
      .filter((m) => m.is_active && m.seat_role === "DEALER_ADMIN")
      .map((m) => m.user_id)
  );

  // If no DEALER_ADMIN seat row exists yet, designate the matching contact email or oldest linked user.
  let fallbackAdminUserId: string | null = null;
  if (adminSeatUsers.size === 0 && linkedProfiles.length > 0) {
    const contactMatch = linkedProfiles.find(
      (p) => p.email.toLowerCase() === dealership.contact_email.toLowerCase()
    );
    fallbackAdminUserId = contactMatch?.id ?? linkedProfiles[0].id;
    adminSeatUsers.add(fallbackAdminUserId);
  }

  const notifyUserIds: string[] = [];

  for (const profile of linkedProfiles) {
    notifyUserIds.push(profile.id);
    if (profile.role === "ADMIN") continue;

    const targetRole: Database["public"]["Enums"]["user_role"] =
      adminSeatUsers.has(profile.id) || profile.role !== "DEALER_AGENT"
        ? "DEALER_ADMIN"
        : "DEALER_AGENT";

    if (profile.role !== targetRole) {
      await admin
        .from("profiles")
        .update({
          role: targetRole,
          dealership_id: dealership.id,
        })
        .eq("id", profile.id);
    }

    if (profile.id === fallbackAdminUserId) {
      await admin.from("dealership_members").upsert(
        {
          dealership_id: dealership.id,
          user_id: profile.id,
          seat_role: "DEALER_ADMIN",
          is_active: true,
        },
        { onConflict: "dealership_id,user_id" }
      );
    }

    // Explicitly synchronize auth.users.raw_app_meta_data for immediate JWT claims.
    try {
      const { data: userLookup } = await admin.auth.admin.getUserById(profile.id);
      const currentAppMeta =
        userLookup.user?.app_metadata &&
        typeof userLookup.user.app_metadata === "object"
          ? userLookup.user.app_metadata
          : {};

      await admin.auth.admin.updateUserById(profile.id, {
        app_metadata: {
          ...currentAppMeta,
          role: targetRole,
          dealership_id: dealership.id,
        },
      });
    } catch (authSyncErr) {
      logger.warn("Auth metadata sync fallback during dealer approval", {
        meta: {
          userId: profile.id,
          dealershipId: dealership.id,
          error:
            authSyncErr instanceof Error ? authSyncErr.message : String(authSyncErr),
        },
      });
    }
  }

  // Provision a 30-day TRIALING subscription on Basic if the dealership does not have one yet.
  const { data: existingSub } = await admin
    .from("subscriptions")
    .select("id")
    .eq("dealership_id", dealership.id)
    .maybeSingle();

  if (!existingSub) {
    const { data: basicPlan } = await admin
      .from("plans")
      .select("id, slug")
      .eq("is_active", true)
      .order("price_cents", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (basicPlan) {
      const periodEndIso = new Date(
        nowMs + 30 * 24 * 60 * 60 * 1000
      ).toISOString();

      const { error: subInsertErr } = await admin.from("subscriptions").upsert(
        {
          dealership_id: dealership.id,
          plan_id: basicPlan.id,
          status: "TRIALING",
          current_period_start: nowIso,
          current_period_end: periodEndIso,
          bids_used: 0,
          auto_renew: true,
        },
        { onConflict: "dealership_id", ignoreDuplicates: true }
      );

      if (subInsertErr) {
        logger.warn("Trial subscription bootstrap warning on dealer approval", {
          meta: { dealershipId: dealership.id, code: subInsertErr.code },
        });
      }
    }
  }

  return notifyUserIds;
}

/**
 * Applies an Admin licensing decision (`APPROVE`, `REJECT`, `SUSPEND`, `REVOKE`).
 *
 * - `APPROVE`: Sets `VERIFIED`, promotes principal account(s) to `DEALER_ADMIN`,
 *   synchronizes JWT `app_metadata`, and provisions a trial subscription if absent.
 * - `REJECT`: Rejects `PENDING` / `REJECTED` applications with mandatory rationale.
 * - `SUSPEND` / `REVOKE`: Executes atomic `transition_dealership_status_and_void_bids`
 *   to void all `ACTIVE` bids and decrement affected `listings.bid_count` (BR-14).
 */
export async function decideDealership(
  ctx: SessionContext,
  dealershipId: string,
  input: DecideDealershipInput,
  requestMeta: { ipAddress: string | null }
): Promise<AdminDealerDecisionResult> {
  assertAdmin(ctx);
  if (!UUID_REGEX.test(dealershipId)) {
    throw new NotFoundError("Dealership application not found.");
  }

  const admin = createAdminSupabaseClient();
  const { data: existing, error: fetchErr } = await admin
    .from("dealerships")
    .select("*")
    .eq("id", dealershipId)
    .maybeSingle();

  if (fetchErr) {
    throw new ExternalServiceError(
      "Unable to load dealership application for review.",
      "EXTERNAL_SERVICE_ERROR",
      fetchErr
    );
  }

  if (!existing) {
    throw new NotFoundError("Dealership application not found.");
  }

  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();
  const action: AdminDealerDecisionAction = input.action;
  const trimmedNotes = input.notes?.trim() || null;

  let auditAction: string;
  let voidedBidsCount = 0;
  let affectedListingIds: string[] = [];
  let notifyUserIds: string[] = [];
  let notifTitle: string;
  let notifDescription: string;
  let message: string;

  if (action === "APPROVE") {
    if (existing.status === "REVOKED") {
      throw new ConflictError(
        "Revoked dealerships cannot be reinstated via standard verification.",
        "INVALID_STATUS_TRANSITION"
      );
    }

    const notesToStore =
      trimmedNotes ??
      existing.verification_notes ??
      `Verified against ${existing.regulator} dealer registry.`;

    const { error: approveErr } = await admin
      .from("dealerships")
      .update({
        status: "VERIFIED",
        verified_by: ctx.userId,
        verified_at: nowIso,
        verification_notes: notesToStore,
      })
      .eq("id", dealershipId);

    if (approveErr) {
      throw new ExternalServiceError(
        "Unable to approve dealership verification.",
        "EXTERNAL_SERVICE_ERROR",
        approveErr
      );
    }

    notifyUserIds = await syncApprovedDealerAccountsAndSubscription(
      admin,
      existing,
      nowMs,
      nowIso
    );

    auditAction = "DEALERSHIP_APPROVED";
    notifTitle = "Dealership licence verified!";
    notifDescription = `${existing.operating_name} (${existing.regulator} #${existing.license_number}) is verified. Your dealership now has live sealed-bid trading floor access.`;
    message = `${existing.operating_name} verified! Trading floor bidding access activated.`;
  } else if (action === "REJECT") {
    if (
      existing.status === "VERIFIED" ||
      existing.status === "SUSPENDED" ||
      existing.status === "REVOKED"
    ) {
      throw new ConflictError(
        `Cannot reject dealership in status ${existing.status}. Use Suspend or Revoke instead.`,
        "INVALID_STATUS_TRANSITION"
      );
    }

    const { error: rejectErr } = await admin
      .from("dealerships")
      .update({
        status: "REJECTED",
        verified_by: ctx.userId,
        verification_notes: trimmedNotes,
      })
      .eq("id", dealershipId);

    if (rejectErr) {
      throw new ExternalServiceError(
        "Unable to reject dealership application.",
        "EXTERNAL_SERVICE_ERROR",
        rejectErr
      );
    }

    const { data: linkedProfiles } = await admin
      .from("profiles")
      .select("id")
      .eq("dealership_id", dealershipId);
    notifyUserIds = (linkedProfiles ?? []).map((p) => p.id);

    auditAction = "DEALERSHIP_REJECTED";
    notifTitle = "Dealership licensing application requires revision";
    notifDescription = `Compliance review note for ${existing.operating_name}: ${trimmedNotes}`;
    message = `${existing.operating_name} application rejected and compliance notice recorded.`;
  } else {
    const targetStatus: Database["public"]["Enums"]["dealership_status"] =
      action === "SUSPEND" ? "SUSPENDED" : "REVOKED";

    if (existing.status === "REVOKED" && targetStatus === "SUSPENDED") {
      throw new ConflictError(
        "Revoked dealerships cannot be downgraded to SUSPENDED.",
        "INVALID_STATUS_TRANSITION"
      );
    }

    const { data: rpcRaw, error: rpcErr } = await admin.rpc(
      "transition_dealership_status_and_void_bids",
      {
        p_dealership_id: dealershipId,
        p_new_status: targetStatus,
        p_admin_id: ctx.userId,
        p_notes: trimmedNotes ?? undefined,
      }
    );

    if (rpcErr) {
      throw new ExternalServiceError(
        "Unable to suspend dealership and void active bids.",
        "EXTERNAL_SERVICE_ERROR",
        rpcErr
      );
    }

    const parsedRpc = voidBidsRpcResultSchema.safeParse(rpcRaw);
    if (!parsedRpc.success) {
      throw new ExternalServiceError(
        "Unexpected response from dealership suspension routine.",
        "EXTERNAL_SERVICE_ERROR"
      );
    }

    voidedBidsCount = parsedRpc.data.voided_bids_count;
    affectedListingIds = parsedRpc.data.affected_listing_ids;

    const { data: linkedProfiles } = await admin
      .from("profiles")
      .select("id")
      .eq("dealership_id", dealershipId);
    notifyUserIds = (linkedProfiles ?? []).map((p) => p.id);

    auditAction =
      action === "SUSPEND" ? "DEALERSHIP_SUSPENDED" : "DEALERSHIP_REVOKED";
    notifTitle =
      action === "SUSPEND"
        ? "Dealership bidding privileges suspended"
        : "Dealership licence revoked on AutoNexa";
    notifDescription = `${existing.operating_name} (${existing.regulator} #${existing.license_number}) was ${targetStatus.toLowerCase()}: ${trimmedNotes}`;
    message =
      voidedBidsCount > 0
        ? `${existing.operating_name} ${targetStatus.toLowerCase()}. Voided ${voidedBidsCount} active bid(s) across ${affectedListingIds.length} listing(s).`
        : `${existing.operating_name} status updated to ${targetStatus}.`;
  }

  const { data: updatedRow, error: reloadErr } = await admin
    .from("dealerships")
    .select("*")
    .eq("id", dealershipId)
    .single();

  if (reloadErr || !updatedRow) {
    throw new ExternalServiceError(
      "Dealership updated but reload failed.",
      "EXTERNAL_SERVICE_ERROR",
      reloadErr
    );
  }

  const [dealer] = await hydrateAdminDealers(admin, [updatedRow]);
  const actorName =
    `${ctx.profile.first_name} ${ctx.profile.last_name}`.trim() || ctx.email;

  await Promise.all([
    admin.from("audit_logs").insert({
      actor_id: ctx.userId,
      actor_name: actorName,
      actor_role: ctx.role,
      action: auditAction,
      entity_type: "dealership",
      entity_id: dealershipId,
      provincial_jurisdiction: updatedRow.province,
      ip_address: requestMeta.ipAddress,
      details: message,
      before_json: {
        status: existing.status,
        verificationNotes: existing.verification_notes,
      },
      after_json: {
        status: updatedRow.status,
        verificationNotes: updatedRow.verification_notes,
        voidedBidsCount,
        affectedListingIds,
      },
    }),
    ...(notifyUserIds.length > 0
      ? [
          admin.from("notifications").insert(
            notifyUserIds.map((userId) => ({
              user_id: userId,
              type: "SYSTEM" as const,
              title: notifTitle,
              description: notifDescription,
              metadata: {
                dealershipId,
                status: updatedRow.status,
                voidedBidsCount,
              },
            }))
          ),
        ]
      : []),
  ]);

  return {
    dealer,
    action,
    voidedBidsCount,
    affectedListingIds,
    auditAction,
    message,
    serverTime: nowIso,
  };
}
