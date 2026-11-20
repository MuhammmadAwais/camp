import { randomBytes } from "node:crypto";
import { z } from "zod";
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
  DealerSeatRole,
  DealerTeamMember,
  DealerTeamMutationResponse,
  DealerTeamResponse,
  DealerTeamSummary,
} from "@/lib/types/dealer";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const DEFAULT_MAX_TEAM_SEATS = 3;

type DealerContext = SessionContext & { dealershipId: string };
type AdminClient = ReturnType<typeof createAdminSupabaseClient>;
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

const emptyToNull = (val: unknown): unknown =>
  typeof val === "string" && val.trim() === "" ? null : val;

export const inviteDealerMemberSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters.")
    .max(120, "Full name cannot exceed 120 characters."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid corporate email address.")
    .max(160, "Email address is too long."),
  seatRole: z.enum(["DEALER_ADMIN", "DEALER_BUYER", "DEALER_INSPECTOR"]),
  jobTitle: z.preprocess(
    emptyToNull,
    z.string().trim().max(100).nullable().optional()
  ),
});

export type InviteDealerMemberInput = z.output<typeof inviteDealerMemberSchema>;

export const updateDealerMemberRoleSchema = z.object({
  seatRole: z.enum(["DEALER_ADMIN", "DEALER_BUYER", "DEALER_INSPECTOR"]),
});

export type UpdateDealerMemberRoleInput = z.output<
  typeof updateDealerMemberRoleSchema
>;

function assertDealerTeamAdmin(ctx: DealerContext): void {
  if (ctx.role !== "DEALER_ADMIN" && ctx.role !== "ADMIN") {
    throw new ForbiddenError(
      "Only dealership administrators can manage team seats and permissions."
    );
  }
}

function toProfileRoleForSeat(
  seatRole: DealerSeatRole
): Database["public"]["Enums"]["user_role"] {
  return seatRole === "DEALER_ADMIN" ? "DEALER_ADMIN" : "DEALER_AGENT";
}

function splitFullName(fullName: string): {
  firstName: string;
  lastName: string;
} {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { firstName: "Team", lastName: "Member" };
  }
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  }
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

function formatJoinedDate(iso: string): string {
  const parsed = Date.parse(iso);
  if (!Number.isFinite(parsed)) return "Recently";
  return new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(parsed));
}

function formatLastActivity(iso: string | null): string {
  if (!iso) return "Invited";
  const parsed = Date.parse(iso);
  if (!Number.isFinite(parsed)) return "Active";

  const diffMins = Math.floor((Date.now() - parsed) / 60_000);
  if (diffMins < 2) return "Just now";
  if (diffMins < 60) return `${diffMins} mins ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) {
    return diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 30) return `${diffDays} days ago`;

  return formatJoinedDate(iso);
}

function extractPlanMeta(rawPlans: unknown): {
  planName: string;
  maxTeamSeats: number;
} {
  const candidate = Array.isArray(rawPlans) ? rawPlans[0] : rawPlans;
  if (typeof candidate !== "object" || candidate === null) {
    return { planName: "Starter", maxTeamSeats: DEFAULT_MAX_TEAM_SEATS };
  }
  const rec = candidate as Record<string, unknown>;
  const name = typeof rec.name === "string" ? rec.name : "Starter";
  const maxSeats =
    typeof rec.max_team_seats === "number" && rec.max_team_seats > 0
      ? rec.max_team_seats
      : DEFAULT_MAX_TEAM_SEATS;
  return { planName: name, maxTeamSeats: maxSeats };
}

async function syncUserAuthMetadata(
  admin: AdminClient,
  userId: string,
  metadata: {
    role: Database["public"]["Enums"]["user_role"];
    dealership_id: string | null;
  }
): Promise<void> {
  try {
    const { data: userLookup } = await admin.auth.admin.getUserById(userId);
    const existingAppMeta =
      userLookup.user?.app_metadata &&
      typeof userLookup.user.app_metadata === "object"
        ? userLookup.user.app_metadata
        : {};

    await admin.auth.admin.updateUserById(userId, {
      app_metadata: {
        ...existingAppMeta,
        role: metadata.role,
        dealership_id: metadata.dealership_id,
      },
    });
  } catch (err) {
    logger.warn("Auth metadata sync warning during team management", {
      meta: {
        userId,
        dealershipId: metadata.dealership_id,
        error: err instanceof Error ? err.message : String(err),
      },
    });
  }
}

async function loadTeamState(
  admin: AdminClient,
  dealershipId: string,
  currentUserId: string
): Promise<{
  members: DealerTeamMember[];
  summary: DealerTeamSummary;
  dealershipName: string;
  dealershipProvince: string;
  dealershipCity: string;
  dealershipPostalCode: string;
}> {
  const [dealershipRes, membersRes, subRes] = await Promise.all([
    admin
      .from("dealerships")
      .select("id, operating_name, province, city, postal_code")
      .eq("id", dealershipId)
      .maybeSingle(),
    admin
      .from("dealership_members")
      .select("*")
      .eq("dealership_id", dealershipId)
      .eq("is_active", true)
      .order("joined_at", { ascending: true }),
    admin
      .from("subscriptions")
      .select("status, plans ( name, max_team_seats )")
      .eq("dealership_id", dealershipId)
      .maybeSingle(),
  ]);

  if (dealershipRes.error || !dealershipRes.data) {
    throw new NotFoundError("Dealership not found.");
  }

  if (membersRes.error) {
    throw new ExternalServiceError(
      "Unable to load dealership team members.",
      "EXTERNAL_SERVICE_ERROR",
      membersRes.error
    );
  }

  const memberRows = membersRes.data ?? [];
  const userIds = Array.from(new Set(memberRows.map((m) => m.user_id)));
  const profileMap = new Map<string, ProfileRow>();

  if (userIds.length > 0) {
    const { data: profiles, error: profilesErr } = await admin
      .from("profiles")
      .select("*")
      .in("id", userIds);

    if (profilesErr) {
      throw new ExternalServiceError(
        "Unable to load team member profiles.",
        "EXTERNAL_SERVICE_ERROR",
        profilesErr
      );
    }

    for (const p of profiles ?? []) {
      profileMap.set(p.id, p);
    }
  }

  const members: DealerTeamMember[] = memberRows.map((row) => {
    const profile = profileMap.get(row.user_id);
    const fullName = profile
      ? `${profile.first_name} ${profile.last_name}`.trim()
      : "";
    const email = profile?.email ?? "member@autonexa.ca";
    const displayName = fullName || email.split("@")[0] || "Team Member";

    return {
      id: row.id,
      userId: row.user_id,
      name: displayName,
      email,
      jobTitle: profile?.job_title ?? null,
      role: row.seat_role,
      isSelf: row.user_id === currentUserId,
      joinedAt: formatJoinedDate(row.joined_at),
      joinedAtIso: row.joined_at,
      lastActive: formatLastActivity(row.last_active_at),
      lastActiveAtIso: row.last_active_at,
    };
  });

  const planMeta = extractPlanMeta(subRes.data?.plans);
  const summary: DealerTeamSummary = {
    seatsUsed: members.length,
    maxSeats: planMeta.maxTeamSeats,
    planName: planMeta.planName,
    adminsCount: members.filter((m) => m.role === "DEALER_ADMIN").length,
    buyersCount: members.filter((m) => m.role === "DEALER_BUYER").length,
    inspectorsCount: members.filter((m) => m.role === "DEALER_INSPECTOR")
      .length,
  };

  return {
    members,
    summary,
    dealershipName: dealershipRes.data.operating_name,
    dealershipProvince: dealershipRes.data.province,
    dealershipCity: dealershipRes.data.city,
    dealershipPostalCode: dealershipRes.data.postal_code,
  };
}

/**
 * Lists all active dealership staff seats and plan seat capacity (FR-DL-04).
 */
export async function listTeam(
  ctx: DealerContext
): Promise<DealerTeamResponse> {
  assertDealerTeamAdmin(ctx);

  const admin = createAdminSupabaseClient();
  const state = await loadTeamState(admin, ctx.dealershipId, ctx.userId);

  return {
    members: state.members,
    summary: state.summary,
    dealershipName: state.dealershipName,
    currentUserId: ctx.userId,
    serverTime: new Date().toISOString(),
  };
}

/**
 * Invites or provisions a new dealership staff member up to the plan's `max_team_seats` limit.
 * Protects `DEALER_ADMIN` gate and assigns explicit `DEALER_BUYER` vs `DEALER_INSPECTOR` vs `DEALER_ADMIN` seat permissions.
 */
export async function inviteMember(
  ctx: DealerContext,
  input: InviteDealerMemberInput,
  requestMeta: { ipAddress: string | null }
): Promise<DealerTeamMutationResponse> {
  assertDealerTeamAdmin(ctx);

  const admin = createAdminSupabaseClient();
  const currentState = await loadTeamState(admin, ctx.dealershipId, ctx.userId);

  if (currentState.summary.seatsUsed >= currentState.summary.maxSeats) {
    throw new ConflictError(
      `Your ${currentState.summary.planName} plan includes up to ${currentState.summary.maxSeats} active team seats. Upgrade your subscription or revoke an unused seat first.`,
      "SEAT_LIMIT_EXCEEDED"
    );
  }

  const email = input.email.trim().toLowerCase();
  const targetProfileRole = toProfileRoleForSeat(input.seatRole);
  const { firstName, lastName } = splitFullName(input.name);

  const { data: existingProfile, error: lookupErr } = await admin
    .from("profiles")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  if (lookupErr) {
    throw new ExternalServiceError(
      "Unable to verify invitee account status.",
      "EXTERNAL_SERVICE_ERROR",
      lookupErr
    );
  }

  let memberUserId: string;
  let memberRowId: string;
  let createdAuthUserId: string | null = null;

  if (existingProfile) {
    if (existingProfile.role === "ADMIN") {
      throw new ForbiddenError(
        "Platform administrators cannot be added as dealership team members."
      );
    }

    if (
      existingProfile.dealership_id &&
      existingProfile.dealership_id !== ctx.dealershipId
    ) {
      throw new ConflictError(
        "This email is already affiliated with another verified dealership.",
        "CONFLICT"
      );
    }

    const { data: existingSeat } = await admin
      .from("dealership_members")
      .select("id, is_active")
      .eq("dealership_id", ctx.dealershipId)
      .eq("user_id", existingProfile.id)
      .maybeSingle();

    if (existingSeat?.is_active) {
      throw new AppError({
        status: 409,
        code: "ALREADY_TEAM_MEMBER",
        message: "This user already holds an active seat on your dealership team.",
        fields: {
          email: "This email already holds an active seat in your dealership.",
        },
      });
    }

    memberUserId = existingProfile.id;

    const profileUpdate: Database["public"]["Tables"]["profiles"]["Update"] = {
      dealership_id: ctx.dealershipId,
      role: targetProfileRole,
      ...(input.jobTitle !== undefined ? { job_title: input.jobTitle } : {}),
    };

    const { error: profileUpdateErr } = await admin
      .from("profiles")
      .update(profileUpdate)
      .eq("id", memberUserId);

    if (profileUpdateErr) {
      throw new ExternalServiceError(
        "Unable to link user profile to dealership.",
        "EXTERNAL_SERVICE_ERROR",
        profileUpdateErr
      );
    }

    const { data: upsertedSeat, error: seatUpsertErr } = await admin
      .from("dealership_members")
      .upsert(
        {
          dealership_id: ctx.dealershipId,
          user_id: memberUserId,
          seat_role: input.seatRole,
          invited_by: ctx.userId,
          is_active: true,
        },
        { onConflict: "dealership_id,user_id" }
      )
      .select("id")
      .single();

    if (seatUpsertErr || !upsertedSeat) {
      throw new ExternalServiceError(
        "Unable to assign dealership team seat.",
        "EXTERNAL_SERVICE_ERROR",
        seatUpsertErr
      );
    }

    memberRowId = upsertedSeat.id;
  } else {
    // Provision pre-confirmed Auth user without triggering Supabase built-in email rate limits.
    // TODO(senior-review): Send branded dealership onboarding invite email via Resend in Prompt B7.3.
    const generatedPassword = `Ax!${randomBytes(20).toString("base64url")}`;
    const { data: authCreated, error: createUserErr } =
      await admin.auth.admin.createUser({
        email,
        password: generatedPassword,
        email_confirm: true,
        user_metadata: {
          first_name: firstName,
          last_name: lastName,
          province: currentState.dealershipProvince,
          postal_code: currentState.dealershipPostalCode,
        },
        app_metadata: {
          role: targetProfileRole,
          dealership_id: ctx.dealershipId,
        },
      });

    if (createUserErr || !authCreated.user) {
      throw new AppError({
        status: 409,
        code: "ALREADY_TEAM_MEMBER",
        message:
          createUserErr?.message ??
          "Unable to provision dealership invite account.",
        fields: {
          email: "Unable to create invitation for this email address.",
        },
      });
    }

    createdAuthUserId = authCreated.user.id;
    memberUserId = createdAuthUserId;

    try {
      const { error: profileUpsertErr } = await admin.from("profiles").upsert(
        {
          id: memberUserId,
          email,
          first_name: firstName,
          last_name: lastName,
          job_title: input.jobTitle ?? null,
          role: targetProfileRole,
          dealership_id: ctx.dealershipId,
          city: currentState.dealershipCity,
          province: currentState.dealershipProvince,
          postal_code: currentState.dealershipPostalCode,
          email_verified: true,
          account_status: "ACTIVE",
        },
        { onConflict: "id" }
      );

      if (profileUpsertErr) {
        throw new ExternalServiceError(
          "Unable to provision invited team profile.",
          "EXTERNAL_SERVICE_ERROR",
          profileUpsertErr
        );
      }

      const { data: insertedSeat, error: seatInsertErr } = await admin
        .from("dealership_members")
        .insert({
          dealership_id: ctx.dealershipId,
          user_id: memberUserId,
          seat_role: input.seatRole,
          invited_by: ctx.userId,
          is_active: true,
        })
        .select("id")
        .single();

      if (seatInsertErr || !insertedSeat) {
        throw new ExternalServiceError(
          "Unable to provision dealership seat record.",
          "EXTERNAL_SERVICE_ERROR",
          seatInsertErr
        );
      }

      memberRowId = insertedSeat.id;
    } catch (err) {
      if (createdAuthUserId) {
        await admin.auth.admin.deleteUser(createdAuthUserId).catch(() => {});
      }
      throw err;
    }
  }

  await syncUserAuthMetadata(admin, memberUserId, {
    role: targetProfileRole,
    dealership_id: ctx.dealershipId,
  });

  const actorName =
    `${ctx.profile.first_name} ${ctx.profile.last_name}`.trim() || ctx.email;

  await Promise.all([
    admin.from("audit_logs").insert({
      actor_id: ctx.userId,
      actor_name: actorName,
      actor_role: ctx.role,
      action: "DEALER_TEAM_MEMBER_INVITED",
      entity_type: "dealership_member",
      entity_id: memberRowId,
      provincial_jurisdiction: currentState.dealershipProvince,
      ip_address: requestMeta.ipAddress,
      details: `Invited ${email} to ${currentState.dealershipName} as ${input.seatRole}`,
      after_json: {
        dealershipId: ctx.dealershipId,
        userId: memberUserId,
        email,
        seatRole: input.seatRole,
        profileRole: targetProfileRole,
      },
    }),
    admin.from("notifications").insert({
      user_id: memberUserId,
      type: "SYSTEM",
      title: `Added to ${currentState.dealershipName}`,
      description: `You have been assigned a ${input.seatRole.replace("DEALER_", "").toLowerCase()} seat for ${currentState.dealershipName}.`,
      metadata: {
        dealershipId: ctx.dealershipId,
        seatRole: input.seatRole,
      },
    }),
  ]);

  const nextState = await loadTeamState(admin, ctx.dealershipId, ctx.userId);
  const invitedMember = nextState.members.find((m) => m.id === memberRowId);

  return {
    ...(invitedMember ? { member: invitedMember } : {}),
    summary: nextState.summary,
    message: `Invitation confirmed for ${email} (${input.seatRole.replace("DEALER_", "")}).`,
    serverTime: new Date().toISOString(),
  };
}

/**
 * Updates a dealership member's seat role (`DEALER_ADMIN`, `DEALER_BUYER`, `DEALER_INSPECTOR`).
 * Guards against self-demotion and removing the dealership's last active `DEALER_ADMIN`.
 */
export async function updateMemberRole(
  ctx: DealerContext,
  memberId: string,
  input: UpdateDealerMemberRoleInput,
  requestMeta: { ipAddress: string | null }
): Promise<DealerTeamMutationResponse> {
  assertDealerTeamAdmin(ctx);
  if (!UUID_REGEX.test(memberId)) {
    throw new NotFoundError("Team member not found.");
  }

  const admin = createAdminSupabaseClient();
  const { data: targetRow, error: fetchErr } = await admin
    .from("dealership_members")
    .select("*")
    .eq("id", memberId)
    .eq("dealership_id", ctx.dealershipId)
    .eq("is_active", true)
    .maybeSingle();

  if (fetchErr) {
    throw new ExternalServiceError(
      "Unable to load team member record.",
      "EXTERNAL_SERVICE_ERROR",
      fetchErr
    );
  }

  if (!targetRow) {
    throw new NotFoundError("Active team member not found for this dealership.");
  }

  if (
    targetRow.user_id === ctx.userId &&
    input.seatRole !== "DEALER_ADMIN"
  ) {
    throw new ConflictError(
      "You cannot demote your own Dealership Admin seat.",
      "LAST_ADMIN_REQUIRED"
    );
  }

  if (
    targetRow.seat_role === "DEALER_ADMIN" &&
    input.seatRole !== "DEALER_ADMIN"
  ) {
    const { count: adminCount } = await admin
      .from("dealership_members")
      .select("id", { count: "exact", head: true })
      .eq("dealership_id", ctx.dealershipId)
      .eq("is_active", true)
      .eq("seat_role", "DEALER_ADMIN");

    if ((adminCount ?? 0) <= 1) {
      throw new ConflictError(
        "Every dealership must retain at least one active Dealership Admin.",
        "LAST_ADMIN_REQUIRED"
      );
    }
  }

  const { data: targetProfile } = await admin
    .from("profiles")
    .select("id, email, role, province")
    .eq("id", targetRow.user_id)
    .maybeSingle();

  const targetProfileRole = toProfileRoleForSeat(input.seatRole);

  const { error: updateSeatErr } = await admin
    .from("dealership_members")
    .update({ seat_role: input.seatRole })
    .eq("id", targetRow.id)
    .eq("dealership_id", ctx.dealershipId);

  if (updateSeatErr) {
    throw new ExternalServiceError(
      "Unable to update team seat role.",
      "EXTERNAL_SERVICE_ERROR",
      updateSeatErr
    );
  }

  if (targetProfile && targetProfile.role !== "ADMIN") {
    await admin
      .from("profiles")
      .update({ role: targetProfileRole })
      .eq("id", targetRow.user_id);

    await syncUserAuthMetadata(admin, targetRow.user_id, {
      role: targetProfileRole,
      dealership_id: ctx.dealershipId,
    });
  }

  const actorName =
    `${ctx.profile.first_name} ${ctx.profile.last_name}`.trim() || ctx.email;

  await Promise.all([
    admin.from("audit_logs").insert({
      actor_id: ctx.userId,
      actor_name: actorName,
      actor_role: ctx.role,
      action: "DEALER_TEAM_ROLE_UPDATED",
      entity_type: "dealership_member",
      entity_id: targetRow.id,
      provincial_jurisdiction: targetProfile?.province ?? ctx.profile.province,
      ip_address: requestMeta.ipAddress,
      details: `Updated seat role for ${targetProfile?.email ?? targetRow.user_id} from ${targetRow.seat_role} to ${input.seatRole}`,
      before_json: { seatRole: targetRow.seat_role },
      after_json: {
        seatRole: input.seatRole,
        profileRole: targetProfileRole,
      },
    }),
    admin.from("notifications").insert({
      user_id: targetRow.user_id,
      type: "SYSTEM",
      title: "Dealership role updated",
      description: `Your dealership permission role was updated to ${input.seatRole.replace("DEALER_", "").toLowerCase()}.`,
      metadata: {
        dealershipId: ctx.dealershipId,
        seatRole: input.seatRole,
      },
    }),
  ]);

  const nextState = await loadTeamState(admin, ctx.dealershipId, ctx.userId);
  const updatedMember = nextState.members.find((m) => m.id === targetRow.id);

  return {
    ...(updatedMember ? { member: updatedMember } : {}),
    summary: nextState.summary,
    message: `Updated role for ${updatedMember?.name ?? "team member"} to ${input.seatRole.replace("DEALER_", "")}.`,
    serverTime: new Date().toISOString(),
  };
}

/**
 * Revokes an active dealership seat (`is_active = false`), resets non-ADMIN user affiliation,
 * syncs JWT `app_metadata`, and logs immutable audit trail entries.
 */
export async function removeMember(
  ctx: DealerContext,
  memberId: string,
  requestMeta: { ipAddress: string | null }
): Promise<DealerTeamMutationResponse> {
  assertDealerTeamAdmin(ctx);
  if (!UUID_REGEX.test(memberId)) {
    throw new NotFoundError("Team member not found.");
  }

  const admin = createAdminSupabaseClient();
  const { data: targetRow, error: fetchErr } = await admin
    .from("dealership_members")
    .select("*")
    .eq("id", memberId)
    .eq("dealership_id", ctx.dealershipId)
    .eq("is_active", true)
    .maybeSingle();

  if (fetchErr) {
    throw new ExternalServiceError(
      "Unable to load team member for removal.",
      "EXTERNAL_SERVICE_ERROR",
      fetchErr
    );
  }

  if (!targetRow) {
    throw new NotFoundError("Active team member not found for this dealership.");
  }

  if (targetRow.user_id === ctx.userId) {
    throw new ConflictError(
      "You cannot revoke your own active Dealership Admin seat.",
      "LAST_ADMIN_REQUIRED"
    );
  }

  if (targetRow.seat_role === "DEALER_ADMIN") {
    const { count: adminCount } = await admin
      .from("dealership_members")
      .select("id", { count: "exact", head: true })
      .eq("dealership_id", ctx.dealershipId)
      .eq("is_active", true)
      .eq("seat_role", "DEALER_ADMIN");

    if ((adminCount ?? 0) <= 1) {
      throw new ConflictError(
        "Cannot remove the last active Dealership Admin from this dealership.",
        "LAST_ADMIN_REQUIRED"
      );
    }
  }

  const { data: targetProfile } = await admin
    .from("profiles")
    .select("id, email, first_name, last_name, role, province")
    .eq("id", targetRow.user_id)
    .maybeSingle();

  const { error: revokeErr } = await admin
    .from("dealership_members")
    .update({ is_active: false })
    .eq("id", targetRow.id)
    .eq("dealership_id", ctx.dealershipId);

  if (revokeErr) {
    throw new ExternalServiceError(
      "Unable to revoke dealership seat.",
      "EXTERNAL_SERVICE_ERROR",
      revokeErr
    );
  }

  if (targetProfile && targetProfile.role !== "ADMIN") {
    await admin
      .from("profiles")
      .update({
        dealership_id: null,
        role: "SELLER",
      })
      .eq("id", targetRow.user_id);

    await syncUserAuthMetadata(admin, targetRow.user_id, {
      role: "SELLER",
      dealership_id: null,
    });
  }

  const actorName =
    `${ctx.profile.first_name} ${ctx.profile.last_name}`.trim() || ctx.email;
  const targetName = targetProfile
    ? `${targetProfile.first_name} ${targetProfile.last_name}`.trim() ||
      targetProfile.email
    : "Team member";

  await Promise.all([
    admin.from("audit_logs").insert({
      actor_id: ctx.userId,
      actor_name: actorName,
      actor_role: ctx.role,
      action: "DEALER_TEAM_MEMBER_REMOVED",
      entity_type: "dealership_member",
      entity_id: targetRow.id,
      provincial_jurisdiction: targetProfile?.province ?? ctx.profile.province,
      ip_address: requestMeta.ipAddress,
      details: `Revoked dealership seat for ${targetProfile?.email ?? targetRow.user_id}`,
      before_json: {
        isActive: true,
        seatRole: targetRow.seat_role,
        dealershipId: ctx.dealershipId,
      },
      after_json: {
        isActive: false,
        dealershipId: null,
      },
    }),
    admin.from("notifications").insert({
      user_id: targetRow.user_id,
      type: "SYSTEM",
      title: "Dealership access revoked",
      description:
        "Your dealership team seat has been revoked by a dealership administrator.",
      metadata: {
        dealershipId: ctx.dealershipId,
      },
    }),
  ]);

  const nextState = await loadTeamState(admin, ctx.dealershipId, ctx.userId);

  return {
    removedMemberId: targetRow.id,
    summary: nextState.summary,
    message: `Wholesale access revoked for ${targetName}.`,
    serverTime: new Date().toISOString(),
  };
}
