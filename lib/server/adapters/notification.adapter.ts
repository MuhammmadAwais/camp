import crypto from "node:crypto";
import { getServerEnv } from "@/lib/server/env";
import { BadRequestError } from "@/lib/server/errors";
import { logger } from "@/lib/server/logger";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { Database, Json } from "@/lib/supabase/database.types";
import type { NotificationType } from "@/lib/types/notifications";

export type NotificationLocale = "en" | "fr";
export type NotificationChannel = "IN_APP" | "EMAIL" | "SMS";
export type UnsubscribeChannel = "email" | "sms" | "all";
export type PreferenceCategory =
  | "auctionClosing"
  | "outbidAlert"
  | "escrowDisbursement"
  | "complianceReview";

export type NotificationTemplateKey =
  | "LISTING_APPROVED_SELLER"
  | "LISTING_APPROVED_DEALER_RADIUS"
  | "LISTING_EDITS_REQUESTED"
  | "LISTING_REJECTED"
  | "AUCTION_CLOSED_SELLER"
  | "AUCTION_CLOSED_DEALER"
  | "AUCTION_EXTENDED_SELLER"
  | "AUCTION_EXTENDED_DEALER"
  | "AUCTION_HALTED_SELLER"
  | "AUCTION_HALTED_DEALER"
  | "MATCH_CREATED_SELLER"
  | "MATCH_CREATED_WINNING_DEALER"
  | "MATCH_NOT_SELECTED_DEALER"
  | "MATCH_ACCEPTANCE_EXPIRED_SELLER"
  | "MATCH_ACCEPTANCE_EXPIRED_DEALER"
  | "CUSTOM";

export type NotificationTemplateVars = {
  vehicleLabel?: string;
  dealershipName?: string;
  distanceKm?: number | null;
  bidCount?: number;
  hours?: number;
  voucherCode?: string;
  agreedAmountCents?: number;
  reason?: string;
  actionUrl?: string;
  customTitle?: string;
  customDescription?: string;
};

export type RenderedNotificationTemplate = {
  title: string;
  description: string;
  emailSubject: string;
  emailText: string;
  emailHtml: string;
  smsBody: string;
};

export type DispatchNotificationInput = {
  userId: string;
  type: NotificationType;
  templateKey: NotificationTemplateKey;
  vars?: NotificationTemplateVars;
  listingId?: string | null;
  metadata?: Record<string, Json>;
  channels?: readonly NotificationChannel[];
  preferenceCategory?: PreferenceCategory;
  isMarketing?: boolean;
};

export type DispatchNotificationResult = {
  notificationId: string | null;
  deliveries: Array<{
    channel: NotificationChannel;
    status: string;
    provider: string;
  }>;
};

type AdminClient = ReturnType<typeof createAdminSupabaseClient>;

type RecipientProfile = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  | "id"
  | "email"
  | "phone_e164"
  | "language_pref"
  | "marketing_opt_in"
  | "notification_preferences"
  | "account_status"
>;

type UnsubscribeTokenPayload = {
  uid: string;
  ch: UnsubscribeChannel;
  exp: number;
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DEFAULT_UNSUBSCRIBE_TTL_SECONDS = 90 * 86400; // 90 days (exceeds CASL 60-day minimum)
const DEFAULT_EMAIL_FROM = "AutoNexa Notifications <notifications@autonexa.ca>";

function resolveSigningKey(): Buffer {
  const env = getServerEnv();
  const secretSource = env.caslUnsubscribeSecret ?? env.supabaseSecretKey;
  return crypto
    .createHash("sha256")
    .update(`autonexa:casl:unsubscribe:v1:${secretSource}`)
    .digest();
}

export function createUnsubscribeToken(
  userId: string,
  channel: UnsubscribeChannel = "email",
  ttlSeconds = DEFAULT_UNSUBSCRIBE_TTL_SECONDS
): string {
  const payload: UnsubscribeTokenPayload = {
    uid: userId,
    ch: channel,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString(
    "base64url"
  );
  const signature = crypto
    .createHmac("sha256", resolveSigningKey())
    .update(encodedPayload)
    .digest()
    .toString("base64url");

  return `${encodedPayload}.${signature}`;
}

export function verifyUnsubscribeToken(token: string): UnsubscribeTokenPayload {
  const trimmed = token.trim();
  const dotIndex = trimmed.indexOf(".");
  if (dotIndex <= 0 || dotIndex === trimmed.length - 1) {
    throw new BadRequestError(
      "Invalid CASL unsubscribe token.",
      "INVALID_UNSUBSCRIBE_TOKEN"
    );
  }

  const encodedPayload = trimmed.slice(0, dotIndex);
  const providedSig = trimmed.slice(dotIndex + 1);

  const expectedDigest = crypto
    .createHmac("sha256", resolveSigningKey())
    .update(encodedPayload)
    .digest();

  let providedDigest: Buffer;
  try {
    providedDigest = Buffer.from(providedSig, "base64url");
  } catch {
    throw new BadRequestError(
      "Malformed CASL unsubscribe signature.",
      "INVALID_UNSUBSCRIBE_TOKEN"
    );
  }

  if (
    providedDigest.length !== expectedDigest.length ||
    !crypto.timingSafeEqual(providedDigest, expectedDigest)
  ) {
    throw new BadRequestError(
      "CASL unsubscribe signature verification failed.",
      "INVALID_UNSUBSCRIBE_TOKEN"
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8")
    );
  } catch {
    throw new BadRequestError(
      "Invalid CASL unsubscribe payload.",
      "INVALID_UNSUBSCRIBE_TOKEN"
    );
  }

  if (typeof parsed !== "object" || parsed === null) {
    throw new BadRequestError(
      "Invalid CASL unsubscribe payload.",
      "INVALID_UNSUBSCRIBE_TOKEN"
    );
  }

  const candidate = parsed as Record<string, unknown>;
  const uid = typeof candidate.uid === "string" ? candidate.uid : "";
  const ch = candidate.ch;
  const exp = typeof candidate.exp === "number" ? candidate.exp : 0;

  if (
    !UUID_REGEX.test(uid) ||
    (ch !== "email" && ch !== "sms" && ch !== "all") ||
    !Number.isFinite(exp) ||
    exp < Math.floor(Date.now() / 1000)
  ) {
    throw new BadRequestError(
      "This unsubscribe link has expired or is invalid.",
      "INVALID_UNSUBSCRIBE_TOKEN"
    );
  }

  return { uid, ch, exp };
}

export function buildUnsubscribeUrl(
  userId: string,
  channel: UnsubscribeChannel = "email"
): string {
  const env = getServerEnv();
  let origin = "http://localhost:3000";
  if (env.appUrl) {
    try {
      origin = new URL(env.appUrl).origin;
    } catch {
      origin = "http://localhost:3000";
    }
  }
  const token = createUnsubscribeToken(userId, channel);
  return `${origin}/api/notifications/unsubscribe?token=${encodeURIComponent(token)}`;
}

function normalizeLocale(raw: string | null | undefined): NotificationLocale {
  return raw === "fr" ? "fr" : "en";
}

function formatCadWhole(cents: number, locale: NotificationLocale): string {
  const formatted = new Intl.NumberFormat(
    locale === "fr" ? "fr-CA" : "en-CA",
    {
      style: "currency",
      currency: "CAD",
      maximumFractionDigits: 0,
    }
  ).format(Math.trunc(cents) / 100);
  return `${formatted} CAD`;
}

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildEmailEnvelope(
  locale: NotificationLocale,
  title: string,
  description: string,
  unsubscribeUrl?: string
): { emailSubject: string; emailText: string; emailHtml: string } {
  const footerEn = unsubscribeUrl
    ? `AutoNexa Canada · Wholesale Vehicle Exchange\nManage preferences or unsubscribe: ${unsubscribeUrl}`
    : "AutoNexa Canada · Wholesale Vehicle Exchange";
  const footerFr = unsubscribeUrl
    ? `AutoNexa Canada · Bourse automobile de gros\nGérer vos préférences ou vous désabonner : ${unsubscribeUrl}`
    : "AutoNexa Canada · Bourse automobile de gros";

  const footer = locale === "fr" ? footerFr : footerEn;
  const emailText = `${title}\n\n${description}\n\n---\n${footer}`;
  const unsubHtml = unsubscribeUrl
    ? `<p style="margin-top:16px;font-size:12px;color:#666;">${
        locale === "fr"
          ? "Conformité LCAP : "
          : "CASL Compliance: "
      }<a href="${escapeHtml(unsubscribeUrl)}">${
        locale === "fr"
          ? "Se désabonner en un clic"
          : "One-click unsubscribe"
      }</a></p>`
    : "";

  const emailHtml = [
    `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:20px;">`,
    `<h2 style="margin:0 0 12px 0;">${escapeHtml(title)}</h2>`,
    `<p style="margin:0 0 16px 0;line-height:1.5;">${escapeHtml(description)}</p>`,
    `<hr style="border:none;border-top:1px solid #e5e5e5;margin:20px 0;" />`,
    `<p style="font-size:12px;color:#666;">AutoNexa Canada</p>`,
    unsubHtml,
    `</div>`,
  ].join("");

  return {
    emailSubject: title,
    emailText,
    emailHtml,
  };
}

/**
 * Renders bilingual EN/FR notification copy and outbound Email/SMS templates.
 * Strictly upholds sealed-bid secrecy (never includes bid amounts for dealers or losses).
 */
export function renderNotificationTemplate(
  templateKey: NotificationTemplateKey,
  locale: NotificationLocale,
  vars: NotificationTemplateVars = {},
  unsubscribeUrl?: string
): RenderedNotificationTemplate {
  const vehicle = vars.vehicleLabel?.trim() || (locale === "fr" ? "véhicule" : "vehicle");
  const isFr = locale === "fr";
  let title = "";
  let description = "";
  let smsBody = "";

  switch (templateKey) {
    case "LISTING_APPROVED_SELLER": {
      title = isFr
        ? "Votre enchère est maintenant en ligne !"
        : "Your vehicle auction is now live!";
      description = isFr
        ? `Votre ${vehicle} a réussi la vérification et est maintenant actif pour les soumissions scellées de 24 heures.`
        : `Your ${vehicle} passed verification and is now live for 24-hour licensed dealer bidding.`;
      smsBody = isFr
        ? `AutoNexa : Votre enchère ${vehicle} est en ligne pour 24h.`
        : `AutoNexa: Your ${vehicle} auction is now live for 24h bidding.`;
      break;
    }
    case "LISTING_APPROVED_DEALER_RADIUS": {
      const distLabel =
        typeof vars.distanceKm === "number" ? ` (${vars.distanceKm} km)` : "";
      title = isFr
        ? `Nouveau véhicule dans votre rayon${distLabel} — ${vehicle}`
        : `New local wholesale lot${distLabel} — ${vehicle}`;
      description = isFr
        ? `Un ${vehicle} vérifié correspond à votre rayon de service${distLabel}. Soumettez une offre scellée sur le parquet.`
        : `A verified ${vehicle} just launched within your sourcing radius${distLabel}. Place a confidential sealed bid before close.`;
      smsBody = isFr
        ? `AutoNexa : Nouveau lot ${vehicle}${distLabel} sur le parquet.`
        : `AutoNexa: New wholesale lot ${vehicle}${distLabel} now live.`;
      break;
    }
    case "LISTING_EDITS_REQUESTED": {
      title = isFr
        ? "Modifications demandées pour votre annonce"
        : "Corrections requested for your vehicle listing";
      description = isFr
        ? `Notes d'examen pour votre ${vehicle} : ${vars.reason ?? ""}`.trim()
        : `Admin review notes for your ${vehicle}: ${vars.reason ?? ""}`.trim();
      smsBody = title;
      break;
    }
    case "LISTING_REJECTED": {
      title = isFr
        ? "Soumission d'annonce refusée"
        : "Vehicle listing submission rejected";
      description = isFr
        ? `Votre soumission ${vehicle} a été refusée : ${vars.reason ?? ""}`.trim()
        : `Your ${vehicle} submission was declined: ${vars.reason ?? ""}`.trim();
      smsBody = title;
      break;
    }
    case "AUCTION_CLOSED_SELLER": {
      const count = vars.bidCount ?? 0;
      title = isFr
        ? `Enchères dévoilées pour ${vehicle}`
        : `Bids unsealed for ${vehicle}`;
      description =
        count > 0
          ? isFr
            ? `${count} offre(s) de concessionnaires vérifiés sont maintenant dévoilées pour votre sélection.`
            : `${count} verified dealership offer(s) are now unsealed and ready for your selection.`
          : isFr
            ? "La fenêtre d'enchères s'est terminée sans offre reçue."
            : "Your auction window closed without dealer offers.";
      smsBody = isFr
        ? `AutoNexa : ${count} offre(s) dévoilée(s) pour ${vehicle}.`
        : `AutoNexa: ${count} dealer offer(s) unsealed for ${vehicle}.`;
      break;
    }
    case "AUCTION_CLOSED_DEALER": {
      title = isFr
        ? `Enchère fermée — ${vehicle}`
        : `Auction closed — ${vehicle}`;
      description = isFr
        ? "La période de soumission est terminée. Les offres sont maintenant dévoilées au vendeur."
        : "Bidding has closed on this vehicle. Offers have been unsealed for seller review.";
      smsBody = title;
      break;
    }
    case "AUCTION_EXTENDED_SELLER":
    case "AUCTION_EXTENDED_DEALER": {
      const h = vars.hours ?? 24;
      title = isFr
        ? `Enchère prolongée de +${h}h — ${vehicle}`
        : `Auction extended by +${h}h — ${vehicle}`;
      description = isFr
        ? `L'administration a prolongé la durée d'enchère de +${h}h${
            vars.reason ? ` : ${vars.reason}` : "."
          }`
        : `Platform administration extended bidding by +${h}h${
            vars.reason ? `: ${vars.reason}` : "."
          }`;
      smsBody = title;
      break;
    }
    case "AUCTION_HALTED_SELLER":
    case "AUCTION_HALTED_DEALER": {
      title = isFr
        ? `Enchère suspendue — ${vehicle}`
        : `Auction halted — ${vehicle}`;
      description = isFr
        ? `L'administration a mis fin à cette enchère${
            vars.reason ? ` (${vars.reason})` : ""
          }.`
        : `Platform administration halted this auction${
            vars.reason ? `: ${vars.reason}` : "."
          }`;
      smsBody = title;
      break;
    }
    case "MATCH_CREATED_SELLER": {
      const dealerName = vars.dealershipName || "AutoNexa Dealer";
      const code = vars.voucherCode || "ANX";
      title = isFr
        ? `Offre acceptée — Bon ${code} prêt`
        : `Offer accepted — Handover pass ${code} ready`;
      description = isFr
        ? `Votre bon de remise pour ${vehicle} chez ${dealerName} est actif pour 24 heures.`
        : `Your ${vehicle} handover voucher for ${dealerName} is active for 24 hours.`;
      smsBody = isFr
        ? `AutoNexa : Bon ${code} actif 24h pour ${vehicle}.`
        : `AutoNexa: Handover pass ${code} ready (valid 24h) for ${vehicle}.`;
      break;
    }
    case "MATCH_CREATED_WINNING_DEALER": {
      const code = vars.voucherCode || "ANX";
      const amountSuffix =
        typeof vars.agreedAmountCents === "number"
          ? ` (${formatCadWhole(vars.agreedAmountCents, locale)})`
          : "";
      title = isFr
        ? `Offre retenue — ${vehicle}`
        : `Bid won — ${vehicle}`;
      description = isFr
        ? `Le vendeur a accepté votre offre${amountSuffix} et généré le bon ${code} (valide 24h).`
        : `Seller accepted your offer${amountSuffix} and generated handover pass ${code} (valid 24 hours).`;
      smsBody = isFr
        ? `AutoNexa : Offre acceptée pour ${vehicle}. Bon ${code} (24h).`
        : `AutoNexa: Bid won on ${vehicle}. Pass ${code} valid 24h.`;
      break;
    }
    case "MATCH_NOT_SELECTED_DEALER": {
      // Sealed-bid privacy: never reveal winning dealer name or winning dollar amount.
      title = isFr
        ? `Lot attribué à un autre concessionnaire — ${vehicle}`
        : `Lot awarded to another dealership — ${vehicle}`;
      description = isFr
        ? `Le vendeur a retenu une autre offre vérifiée pour le ${vehicle}. Merci pour votre participation.`
        : `The seller selected another verified dealership for the ${vehicle}. Explore active wholesale inventory for new matches.`;
      smsBody = title;
      break;
    }
    case "MATCH_ACCEPTANCE_EXPIRED_SELLER": {
      const code = vars.voucherCode || "ANX";
      title = isFr
        ? `Fenêtre de rendez-vous expirée — ${vehicle}`
        : `Acceptance window expired — ${vehicle}`;
      description = isFr
        ? `Le bon ${code} a expiré après 24 heures. Vous pouvez choisir un autre concessionnaire.`
        : `Handover voucher ${code} expired after 24 hours. Your listing returned to unsealed review.`;
      smsBody = title;
      break;
    }
    case "MATCH_ACCEPTANCE_EXPIRED_DEALER": {
      const code = vars.voucherCode || "ANX";
      title = isFr
        ? `Rendez-vous expiré — ${vehicle}`
        : `Handover appointment expired — ${vehicle}`;
      description = isFr
        ? `La fenêtre de 24 heures pour le bon ${code} (${vehicle}) est expirée.`
        : `The 24-hour acceptance window for voucher ${code} (${vehicle}) elapsed without completion.`;
      smsBody = title;
      break;
    }
    case "CUSTOM":
    default: {
      title = vars.customTitle?.trim() || "AutoNexa Update";
      description = vars.customDescription?.trim() || "";
      smsBody = title;
      break;
    }
  }

  const envelope = buildEmailEnvelope(locale, title, description, unsubscribeUrl);
  return {
    title,
    description,
    smsBody,
    ...envelope,
  };
}

function readPreferenceBoolean(
  rawPrefs: Json | null | undefined,
  key: string,
  fallback = true
): boolean {
  if (typeof rawPrefs !== "object" || rawPrefs === null || Array.isArray(rawPrefs)) {
    return fallback;
  }
  const value = (rawPrefs as Record<string, unknown>)[key];
  return typeof value === "boolean" ? value : fallback;
}

async function isChannelAllowedByConsent(
  admin: AdminClient,
  profile: RecipientProfile,
  channel: "EMAIL" | "SMS",
  preferenceCategory: PreferenceCategory | undefined,
  isMarketing: boolean
): Promise<boolean> {
  if (profile.account_status !== "ACTIVE") {
    return false;
  }

  const channelPrefKey = channel === "EMAIL" ? "emailEnabled" : "smsEnabled";
  if (!readPreferenceBoolean(profile.notification_preferences, channelPrefKey, true)) {
    return false;
  }

  if (
    preferenceCategory &&
    !readPreferenceBoolean(profile.notification_preferences, preferenceCategory, true)
  ) {
    return false;
  }

  if (isMarketing) {
    if (!profile.marketing_opt_in) {
      return false;
    }

    const { data: latestConsent } = await admin
      .from("user_consents")
      .select("granted")
      .eq("user_id", profile.id)
      .eq("consent_type", "CASL_MARKETING")
      .order("recorded_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestConsent && latestConsent.granted === false) {
      return false;
    }
  }

  return true;
}

async function sendOutboundEmail(params: {
  to: string;
  subject: string;
  text: string;
  html: string;
  unsubscribeUrl: string;
}): Promise<{ provider: string; status: "SENT" | "SANDBOX_LOGGED" | "FAILED"; providerMessageId: string | null; errorMessage: string | null }> {
  const env = getServerEnv();
  const from = env.emailFrom ?? DEFAULT_EMAIL_FROM;

  if (env.resendApiKey) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [params.to],
          subject: params.subject,
          text: params.text,
          html: params.html,
          headers: {
            "List-Unsubscribe": `<${params.unsubscribeUrl}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
        }),
      });
      const json = (await response.json().catch(() => null)) as {
        id?: string;
        message?: string;
      } | null;

      if (!response.ok) {
        return {
          provider: "resend",
          status: "FAILED",
          providerMessageId: null,
          errorMessage: json?.message ?? `Resend HTTP ${response.status}`,
        };
      }

      return {
        provider: "resend",
        status: "SENT",
        providerMessageId: json?.id ?? null,
        errorMessage: null,
      };
    } catch (err) {
      return {
        provider: "resend",
        status: "FAILED",
        providerMessageId: null,
        errorMessage: err instanceof Error ? err.message : "Resend request failed",
      };
    }
  }

  if (env.sendgridApiKey) {
    try {
      const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.sendgridApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: [{ email: params.to }],
              headers: {
                "List-Unsubscribe": `<${params.unsubscribeUrl}>`,
                "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
              },
            },
          ],
          from: { email: from },
          subject: params.subject,
          content: [
            { type: "text/plain", value: params.text },
            { type: "text/html", value: params.html },
          ],
        }),
      });

      if (!response.ok) {
        const bodyText = await response.text().catch(() => "");
        return {
          provider: "sendgrid",
          status: "FAILED",
          providerMessageId: null,
          errorMessage: bodyText || `SendGrid HTTP ${response.status}`,
        };
      }

      return {
        provider: "sendgrid",
        status: "SENT",
        providerMessageId: response.headers.get("x-message-id"),
        errorMessage: null,
      };
    } catch (err) {
      return {
        provider: "sendgrid",
        status: "FAILED",
        providerMessageId: null,
        errorMessage: err instanceof Error ? err.message : "SendGrid request failed",
      };
    }
  }

  return {
    provider: "sandbox_email",
    status: "SANDBOX_LOGGED",
    providerMessageId: `sbx_email_${crypto.randomUUID()}`,
    errorMessage: null,
  };
}

async function sendOutboundSms(params: {
  toPhone: string | null;
  body: string;
}): Promise<{ provider: string; status: "SENT" | "SANDBOX_LOGGED" | "FAILED"; providerMessageId: string | null; errorMessage: string | null }> {
  const env = getServerEnv();

  if (env.twilioAccountSid && env.twilioAuthToken && env.twilioFromNumber) {
    if (!params.toPhone) {
      return {
        provider: "twilio",
        status: "FAILED",
        providerMessageId: null,
        errorMessage: "Recipient phone_e164 is missing.",
      };
    }

    try {
      const credentials = Buffer.from(
        `${env.twilioAccountSid}:${env.twilioAuthToken}`,
        "utf8"
      ).toString("base64");
      const form = new URLSearchParams({
        To: params.toPhone,
        From: env.twilioFromNumber,
        Body: params.body,
      });

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(
          env.twilioAccountSid
        )}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${credentials}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: form.toString(),
        }
      );

      const json = (await response.json().catch(() => null)) as {
        sid?: string;
        message?: string;
      } | null;

      if (!response.ok) {
        return {
          provider: "twilio",
          status: "FAILED",
          providerMessageId: null,
          errorMessage: json?.message ?? `Twilio HTTP ${response.status}`,
        };
      }

      return {
        provider: "twilio",
        status: "SENT",
        providerMessageId: json?.sid ?? null,
        errorMessage: null,
      };
    } catch (err) {
      return {
        provider: "twilio",
        status: "FAILED",
        providerMessageId: null,
        errorMessage: err instanceof Error ? err.message : "Twilio request failed",
      };
    }
  }

  return {
    provider: "sandbox_sms",
    status: "SANDBOX_LOGGED",
    providerMessageId: `sbx_sms_${crypto.randomUUID()}`,
    errorMessage: null,
  };
}

/**
 * Persists an in-app notification row FIRST (H10), then executes crash-proof
 * CASL-compliant Email/SMS fan-out logging every delivery outcome in `notification_deliveries`.
 */
export async function dispatchNotification(
  input: DispatchNotificationInput
): Promise<DispatchNotificationResult> {
  const admin = createAdminSupabaseClient();
  const channels: readonly NotificationChannel[] = input.channels?.length
    ? input.channels
    : ["IN_APP", "EMAIL"];

  const { data: profile } = await admin
    .from("profiles")
    .select(
      "id, email, phone_e164, language_pref, marketing_opt_in, notification_preferences, account_status"
    )
    .eq("id", input.userId)
    .maybeSingle();

  const locale = normalizeLocale(profile?.language_pref);
  const unsubscribeUrl = buildUnsubscribeUrl(input.userId, "email");
  const rendered = renderNotificationTemplate(
    input.templateKey,
    locale,
    input.vars,
    unsubscribeUrl
  );

  const mergedMetadata: Record<string, Json> = {
    ...(input.metadata ?? {}),
    ...(input.vars?.actionUrl ? { actionUrl: input.vars.actionUrl } : {}),
    templateKey: input.templateKey,
    locale,
  };

  // Guarantee in-app persistence FIRST regardless of outbound Email/SMS status (H10).
  const { data: insertedNotif, error: notifErr } = await admin
    .from("notifications")
    .insert({
      user_id: input.userId,
      type: input.type,
      title: rendered.title,
      description: rendered.description,
      listing_id: input.listingId ?? null,
      metadata: mergedMetadata,
    })
    .select("id")
    .single();

  if (notifErr || !insertedNotif) {
    logger.warn("Failed to insert in-app notification record", {
      actorId: input.userId,
      meta: { templateKey: input.templateKey, notifErr },
    });
    return { notificationId: null, deliveries: [] };
  }

  const deliveries: DispatchNotificationResult["deliveries"] = [];
  const deliveryRows: Database["public"]["Tables"]["notification_deliveries"]["Insert"][] =
    [];

  if (channels.includes("IN_APP")) {
    deliveryRows.push({
      notification_id: insertedNotif.id,
      user_id: input.userId,
      channel: "IN_APP",
      provider: "supabase_realtime",
      recipient_address: null,
      status: "SENT",
    });
    deliveries.push({
      channel: "IN_APP",
      status: "SENT",
      provider: "supabase_realtime",
    });
  }

  if (channels.includes("EMAIL")) {
    if (!profile) {
      deliveryRows.push({
        notification_id: insertedNotif.id,
        user_id: input.userId,
        channel: "EMAIL",
        provider: "sandbox_email",
        recipient_address: null,
        status: "FAILED",
        error_message: "Recipient profile not found.",
      });
      deliveries.push({
        channel: "EMAIL",
        status: "FAILED",
        provider: "sandbox_email",
      });
    } else {
      const allowed = await isChannelAllowedByConsent(
        admin,
        profile,
        "EMAIL",
        input.preferenceCategory,
        Boolean(input.isMarketing)
      );
      if (!allowed) {
        deliveryRows.push({
          notification_id: insertedNotif.id,
          user_id: input.userId,
          channel: "EMAIL",
          provider: "casl_consent_gate",
          recipient_address: profile.email,
          status: "UNSUBSCRIBED",
        });
        deliveries.push({
          channel: "EMAIL",
          status: "UNSUBSCRIBED",
          provider: "casl_consent_gate",
        });
      } else {
        const outcome = await sendOutboundEmail({
          to: profile.email,
          subject: rendered.emailSubject,
          text: rendered.emailText,
          html: rendered.emailHtml,
          unsubscribeUrl,
        });
        deliveryRows.push({
          notification_id: insertedNotif.id,
          user_id: input.userId,
          channel: "EMAIL",
          provider: outcome.provider,
          recipient_address: profile.email,
          status: outcome.status,
          provider_message_id: outcome.providerMessageId,
          error_message: outcome.errorMessage,
        });
        deliveries.push({
          channel: "EMAIL",
          status: outcome.status,
          provider: outcome.provider,
        });
      }
    }
  }

  if (channels.includes("SMS")) {
    if (!profile) {
      deliveryRows.push({
        notification_id: insertedNotif.id,
        user_id: input.userId,
        channel: "SMS",
        provider: "sandbox_sms",
        recipient_address: null,
        status: "FAILED",
        error_message: "Recipient profile not found.",
      });
      deliveries.push({
        channel: "SMS",
        status: "FAILED",
        provider: "sandbox_sms",
      });
    } else {
      const allowed = await isChannelAllowedByConsent(
        admin,
        profile,
        "SMS",
        input.preferenceCategory,
        Boolean(input.isMarketing)
      );
      if (!allowed) {
        deliveryRows.push({
          notification_id: insertedNotif.id,
          user_id: input.userId,
          channel: "SMS",
          provider: "casl_consent_gate",
          recipient_address: profile.phone_e164,
          status: "UNSUBSCRIBED",
        });
        deliveries.push({
          channel: "SMS",
          status: "UNSUBSCRIBED",
          provider: "casl_consent_gate",
        });
      } else {
        const outcome = await sendOutboundSms({
          toPhone: profile.phone_e164,
          body: rendered.smsBody,
        });
        deliveryRows.push({
          notification_id: insertedNotif.id,
          user_id: input.userId,
          channel: "SMS",
          provider: outcome.provider,
          recipient_address: profile.phone_e164,
          status: outcome.status,
          provider_message_id: outcome.providerMessageId,
          error_message: outcome.errorMessage,
        });
        deliveries.push({
          channel: "SMS",
          status: outcome.status,
          provider: outcome.provider,
        });
      }
    }
  }

  if (deliveryRows.length > 0) {
    const { error: deliveryErr } = await admin
      .from("notification_deliveries")
      .insert(deliveryRows);
    if (deliveryErr) {
      logger.warn("Failed to record notification_deliveries rows", {
        actorId: input.userId,
        meta: { notificationId: insertedNotif.id, deliveryErr },
      });
    }
  }

  return { notificationId: insertedNotif.id, deliveries };
}

/**
 * Fans out notifications across a recipient list with bounded concurrency,
 * isolating per-recipient failures cleanly.
 */
export async function dispatchNotificationBatch(
  inputs: readonly DispatchNotificationInput[]
): Promise<DispatchNotificationResult[]> {
  if (inputs.length === 0) return [];
  const results: DispatchNotificationResult[] = [];
  const chunkSize = 10;

  for (let i = 0; i < inputs.length; i += chunkSize) {
    const slice = inputs.slice(i, i + chunkSize);
    const settled = await Promise.allSettled(
      slice.map((item) => dispatchNotification(item))
    );
    for (const outcome of settled) {
      if (outcome.status === "fulfilled") {
        results.push(outcome.value);
      }
    }
  }

  return results;
}
