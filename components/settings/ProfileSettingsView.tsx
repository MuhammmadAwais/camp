"use client";

import React, { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  Bell,
  Camera,
  CheckCircle2,
  Download,
  Laptop,
  Loader2,
  Lock,
  Mail,
  Phone,
  Save,
  Shield,
  Sliders,
  User,
} from "lucide-react";
import { getDefaultPortalForRole } from "@/lib/auth-routing";
import { ApiError } from "@/lib/api-client";
import { PROVINCE_CODES, type ProvinceCode } from "@/lib/canada";
import { MfaSettingsCard } from "@/components/settings/MfaSettingsCard";
import {
  useAdminPlatformConfig,
  useProfileSettings,
  useSecuritySettings,
  useUpdateAdminPlatformConfig,
  useUpdateProfileSettings,
  useUpdateSecuritySettings,
} from "@/hooks/useProfileSettings";
import type {
  NotificationPreferences,
  PlatformConfigKey,
} from "@/lib/types/settings";

type SettingsTab =
  | "GENERAL"
  | "SECURITY"
  | "COMPLIANCE"
  | "NOTIFICATIONS"
  | "CONFIG";

interface ProfileSettingsContentProps {
  defaultTab?: SettingsTab;
}

type ProfileDraft = {
  fullName?: string;
  jobTitle?: string;
  phoneE164?: string;
  postalCode?: string;
  province?: ProvinceCode;
  city?: string;
  languagePref?: "en" | "fr";
  regulatorBoardId?: string;
  marketingOptIn?: boolean;
  notificationPreferences?: Partial<NotificationPreferences>;
};

const DEFAULT_NOTIFS: NotificationPreferences = {
  auctionClosing: true,
  outbidAlert: true,
  escrowDisbursement: true,
  complianceReview: true,
  emailEnabled: true,
  smsEnabled: true,
};

const CONFIG_LABELS: Record<PlatformConfigKey, string> = {
  auction_duration_hours: "Sealed Auction Duration",
  acceptance_window_hours: "Seller Appointment Window",
  relist_cooldown_hours: "Relist Cooldown Window (BR-12)",
  min_photo_count: "Minimum Listing Photos",
  default_radius_km: "Default Dealer Radius",
};

function ProfileSettingsContent({ defaultTab }: ProfileSettingsContentProps) {
  const searchParams = useSearchParams();
  const isMfaEnrollPrompt = searchParams.get("mfa") === "enroll";
  const queryTab =
    isMfaEnrollPrompt || searchParams.get("tab") === "security"
      ? "SECURITY"
      : searchParams.get("tab") === "config"
      ? "CONFIG"
      : "GENERAL";
  const [selectedTab, setSelectedTab] = useState<SettingsTab>(
    defaultTab || queryTab
  );

  const profileQuery = useProfileSettings();
  const securityQuery = useSecuritySettings();
  const profile = profileQuery.data;
  const security = securityQuery.data;
  const isAdmin = profile?.role === "ADMIN";
  const configQuery = useAdminPlatformConfig(Boolean(isAdmin));

  const updateProfile = useUpdateProfileSettings();
  const updateSecurity = useUpdateSecuritySettings();
  const updateConfig = useUpdateAdminPlatformConfig();

  const [draft, setDraft] = useState<ProfileDraft | null>(null);
  const [configDraft, setConfigDraft] = useState<
    Partial<Record<PlatformConfigKey, number>>
  >({});
  const [configReason, setConfigReason] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [bannerSuccess, setBannerSuccess] = useState<string | null>(null);
  const [bannerError, setBannerError] = useState<string | null>(null);

  const activeTab: SettingsTab =
    selectedTab === "CONFIG" && !isAdmin ? "GENERAL" : selectedTab;

  const form = useMemo(
    () => ({
      fullName: draft?.fullName ?? profile?.fullName ?? "",
      jobTitle: draft?.jobTitle ?? profile?.jobTitle ?? "",
      phoneE164: draft?.phoneE164 ?? profile?.phoneE164 ?? "",
      postalCode: draft?.postalCode ?? profile?.postalCode ?? "",
      province: draft?.province ?? profile?.province ?? ("ON" as ProvinceCode),
      city: draft?.city ?? profile?.city ?? "",
      languagePref:
        draft?.languagePref ?? profile?.languagePref ?? ("en" as const),
      regulatorBoardId:
        draft?.regulatorBoardId ?? profile?.regulatorBoardId ?? "",
      marketingOptIn: draft?.marketingOptIn ?? profile?.marketingOptIn ?? false,
      notificationPreferences: {
        ...(profile?.notificationPreferences ?? DEFAULT_NOTIFS),
        ...(draft?.notificationPreferences ?? {}),
      },
    }),
    [draft, profile]
  );

  const handleSaveProfileOrPrefs = async (e: React.FormEvent) => {
    e.preventDefault();
    setBannerSuccess(null);
    setBannerError(null);

    try {
      await updateProfile.mutateAsync({
        fullName: form.fullName,
        jobTitle: form.jobTitle,
        phoneE164: form.phoneE164,
        postalCode: form.postalCode,
        province: form.province,
        city: form.city,
        languagePref: form.languagePref,
        regulatorBoardId: form.regulatorBoardId,
        marketingOptIn: form.marketingOptIn,
        notificationPreferences: form.notificationPreferences,
      });
      setDraft(null);
      setBannerSuccess(
        "Profile settings, regulatory credentials, and alert preferences saved to Supabase."
      );
    } catch (err) {
      setBannerError(
        err instanceof ApiError
          ? err.message
          : "Unable to save profile settings."
      );
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setBannerSuccess(null);
    setBannerError(null);

    try {
      const res = await updateSecurity.mutateAsync({
        action: "CHANGE_PASSWORD",
        currentPassword,
        newPassword,
        confirmPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setBannerSuccess(res.message);
    } catch (err) {
      setBannerError(
        err instanceof ApiError
          ? err.message
          : "Unable to update account password."
      );
    }
  };

  const handleRevokeOtherSessions = async () => {
    setBannerSuccess(null);
    setBannerError(null);
    try {
      const res = await updateSecurity.mutateAsync({
        action: "REVOKE_OTHER_SESSIONS",
      });
      setBannerSuccess(res.message);
    } catch (err) {
      setBannerError(
        err instanceof ApiError
          ? err.message
          : "Unable to revoke other sessions."
      );
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setBannerSuccess(null);
    setBannerError(null);

    const payloadUpdates: Partial<Record<PlatformConfigKey, number>> = {
      ...configDraft,
    };
    if (Object.keys(payloadUpdates).length === 0) {
      setBannerSuccess("No platform configuration changes pending.");
      return;
    }

    try {
      const res = await updateConfig.mutateAsync({
        updates: payloadUpdates,
        reason: configReason.trim() || undefined,
      });
      setConfigDraft({});
      setConfigReason("");
      setBannerSuccess(res.message);
    } catch (err) {
      setBannerError(
        err instanceof ApiError
          ? err.message
          : "Unable to save platform configuration."
      );
    }
  };

  const cancelHref = profile ? getDefaultPortalForRole(profile.role) : "/";

  if (profileQuery.isLoading && !profile) {
    return (
      <div className="max-w-5xl mx-auto py-20 flex items-center justify-center gap-3 text-sm text-portal-text-muted">
        <Loader2 className="w-5 h-5 animate-spin text-portal-primary" />
        <span>Loading authenticated account settings...</span>
      </div>
    );
  }

  if (profileQuery.isError) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4 text-center space-y-4">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
        <h2 className="text-lg font-bold text-portal-text font-headline">
          Unable to load profile settings
        </h2>
        <p className="text-xs text-portal-text-muted">
          {profileQuery.error instanceof ApiError
            ? profileQuery.error.message
            : "Please ensure you are signed in."}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 font-body">
      {/* 1. Header Strip */}
      <div className="pb-4 border-b border-portal-border/60">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-portal-text font-headline tracking-tight">
          Account &amp; Profile Settings
        </h1>
        <p className="text-xs sm:text-sm text-portal-text-muted mt-1">
          Manage your personal credentials, Canadian regulatory affiliations, security keys, and dispatch alerts.
        </p>
      </div>

      {/* Status Banners */}
      {bannerSuccess && (
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{bannerSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setBannerSuccess(null)}
            className="text-current opacity-70 hover:opacity-100 cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {bannerError && (
        <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-500 text-xs font-semibold flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{bannerError}</span>
          </div>
          <button
            type="button"
            onClick={() => setBannerError(null)}
            className="text-current opacity-70 hover:opacity-100 cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* 2. Classic Tab Navigation */}
      <div className="flex items-center gap-1.5 border-b border-portal-border overflow-x-auto pb-px">
        <button
          type="button"
          onClick={() => setSelectedTab("GENERAL")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "GENERAL"
              ? "border-portal-primary text-portal-primary"
              : "border-transparent text-portal-text-muted hover:text-portal-text hover:border-portal-border"
          }`}
        >
          <User className="w-4 h-4" />
          <span>General Profile</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedTab("SECURITY")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "SECURITY"
              ? "border-portal-primary text-portal-primary"
              : "border-transparent text-portal-text-muted hover:text-portal-text hover:border-portal-border"
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Security &amp; 2FA</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedTab("COMPLIANCE")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "COMPLIANCE"
              ? "border-portal-primary text-portal-primary"
              : "border-transparent text-portal-text-muted hover:text-portal-text hover:border-portal-border"
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Compliance &amp; Regulators</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedTab("NOTIFICATIONS")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "NOTIFICATIONS"
              ? "border-portal-primary text-portal-primary"
              : "border-transparent text-portal-text-muted hover:text-portal-text hover:border-portal-border"
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Dispatch &amp; Notifications</span>
        </button>

        {isAdmin && (
          <button
            type="button"
            onClick={() => setSelectedTab("CONFIG")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "CONFIG"
                ? "border-portal-primary text-portal-primary"
                : "border-transparent text-portal-text-muted hover:text-portal-text hover:border-portal-border"
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Platform Config</span>
          </button>
        )}
      </div>

      {/* 3. Tab Contents */}
      {(activeTab === "GENERAL" ||
        activeTab === "COMPLIANCE" ||
        activeTab === "NOTIFICATIONS") && (
        <form onSubmit={handleSaveProfileOrPrefs} className="space-y-6">
          {activeTab === "GENERAL" && (
            <div className="space-y-6 animate-fadeIn">
              {/* Avatar & Monogram Block */}
              <div className="rounded-2xl border border-portal-border bg-portal-surface p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="relative size-20 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/30 border border-portal-border flex items-center justify-center font-headline font-black text-2xl text-portal-text shadow-sm">
                    {(form.fullName || profile?.email || "A")
                      .charAt(0)
                      .toUpperCase()}
                    <span
                      title="Profile Avatar"
                      className="absolute -bottom-1 -right-1 size-7 rounded-xl bg-portal-surface border border-portal-border flex items-center justify-center text-portal-text shadow-xs"
                    >
                      <Camera className="w-3.5 h-3.5 text-portal-text-muted" />
                    </span>
                  </div>

                  <div>
                    <h3 className="font-headline font-bold text-base text-portal-text">
                      {form.fullName}
                    </h3>
                    <p className="text-xs text-portal-text-muted font-mono mt-0.5">
                      {profile?.email}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-portal-primary/10 text-portal-primary border border-portal-primary/20">
                        {profile?.role || "USER"}
                      </span>
                      <span className="text-[11px] text-portal-text-muted font-medium">
                        {form.jobTitle || "Verified Account"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Personal Details Card */}
              <div className="rounded-2xl border border-portal-border bg-portal-surface p-6 shadow-xs space-y-4">
                <div className="pb-3 border-b border-portal-border/60">
                  <h3 className="text-base font-bold text-portal-text font-headline">
                    Personal &amp; Professional Identity
                  </h3>
                  <p className="text-xs text-portal-text-muted mt-0.5">
                    Official identification details bound to Canadian transaction logs.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-portal-text mb-1.5">
                      Legal Full Name
                    </label>
                    <input
                      type="text"
                      value={form.fullName}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...(prev ?? {}),
                          fullName: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-portal-border bg-portal-surface-hover/40 text-portal-text text-xs focus:outline-none focus:ring-2 focus:ring-portal-primary/30"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-portal-text mb-1.5">
                      Designated Title / Role
                    </label>
                    <input
                      type="text"
                      value={form.jobTitle}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...(prev ?? {}),
                          jobTitle: e.target.value,
                        }))
                      }
                      placeholder="e.g. Managing Director"
                      className="w-full px-3 py-2 rounded-xl border border-portal-border bg-portal-surface-hover/40 text-portal-text text-xs focus:outline-none focus:ring-2 focus:ring-portal-primary/30"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-portal-text mb-1.5">
                      Authorized Account Email (Immutable)
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        disabled
                        value={profile?.email ?? ""}
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-portal-border bg-portal-surface-hover/60 text-portal-text-muted text-xs cursor-not-allowed font-mono"
                      />
                      <Mail className="w-4 h-4 text-portal-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-portal-text mb-1.5">
                      Direct Telephone
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        value={form.phoneE164}
                        onChange={(e) =>
                          setDraft((prev) => ({
                            ...(prev ?? {}),
                            phoneE164: e.target.value,
                          }))
                        }
                        placeholder="+1 (416) 555-0194"
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-portal-border bg-portal-surface-hover/40 text-portal-text text-xs focus:outline-none focus:ring-2 focus:ring-portal-primary/30 font-mono"
                      />
                      <Phone className="w-4 h-4 text-portal-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Jurisdiction & Regional Preferences Card */}
              <div className="rounded-2xl border border-portal-border bg-portal-surface p-6 shadow-xs space-y-4">
                <div className="pb-3 border-b border-portal-border/60">
                  <h3 className="text-base font-bold text-portal-text font-headline">
                    Jurisdiction &amp; Localization
                  </h3>
                  <p className="text-xs text-portal-text-muted mt-0.5">
                    Operating jurisdiction for provincial automotive regulator compliance.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-portal-text mb-1.5">
                      Primary Province
                    </label>
                    <select
                      value={form.province}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...(prev ?? {}),
                          province: e.target.value as ProvinceCode,
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-portal-border bg-portal-surface-hover/40 text-portal-text text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-portal-primary/30 cursor-pointer"
                    >
                      {PROVINCE_CODES.map((code) => (
                        <option key={code} value={code}>
                          {code}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-portal-text mb-1.5">
                      Operating City
                    </label>
                    <input
                      type="text"
                      value={form.city}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...(prev ?? {}),
                          city: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-portal-border bg-portal-surface-hover/40 text-portal-text text-xs focus:outline-none focus:ring-2 focus:ring-portal-primary/30"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-portal-text mb-1.5">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      value={form.postalCode}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...(prev ?? {}),
                          postalCode: e.target.value,
                        }))
                      }
                      placeholder="M5V 2T6"
                      className="w-full px-3 py-2 rounded-xl border border-portal-border bg-portal-surface-hover/40 text-portal-text text-xs font-mono focus:outline-none focus:ring-2 focus:ring-portal-primary/30"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-portal-text mb-1.5">
                      Language Preference
                    </label>
                    <select
                      value={form.languagePref}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...(prev ?? {}),
                          languagePref: e.target.value as "en" | "fr",
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-portal-border bg-portal-surface-hover/40 text-portal-text text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-portal-primary/30 cursor-pointer"
                    >
                      <option value="en">English (Canada)</option>
                      <option value="fr">Français (Loi 25)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "COMPLIANCE" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="rounded-2xl border border-portal-border bg-portal-surface p-6 shadow-xs space-y-4">
                <div className="pb-3 border-b border-portal-border/60 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-portal-text font-headline">
                      Provincial Regulator Affiliation
                    </h3>
                    <p className="text-xs text-portal-text-muted mt-0.5">
                      Certified registrar identity for Canadian wholesale operations.
                    </p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    KYC: {profile?.kycStatus ?? "PENDING"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-portal-text mb-1.5">
                      Official Regulatory ID / License #
                    </label>
                    <input
                      type="text"
                      value={form.regulatorBoardId}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...(prev ?? {}),
                          regulatorBoardId: e.target.value,
                        }))
                      }
                      placeholder="e.g. OMVIC-481920"
                      className="w-full px-3 py-2 rounded-xl border border-portal-border bg-portal-surface-hover/40 text-portal-text text-xs focus:outline-none focus:ring-2 focus:ring-portal-primary/30 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-portal-text mb-1.5">
                      Governing Oversight Board
                    </label>
                    <input
                      type="text"
                      disabled
                      value={
                        form.province === "ON"
                          ? "OMVIC - Ontario Motor Vehicle Industry Council"
                          : form.province === "AB"
                          ? "AMVIC - Alberta Motor Vehicle Industry Council"
                          : form.province === "BC"
                          ? "VSA - Vehicle Sales Authority of British Columbia"
                          : form.province === "QC"
                          ? "OPC - Office de la protection du consommateur"
                          : `${form.province} Provincial Automotive Registrar`
                      }
                      className="w-full px-3 py-2 rounded-xl border border-portal-border bg-portal-surface-hover/60 text-portal-text-muted text-xs cursor-not-allowed font-medium"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-portal-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="font-bold text-xs text-portal-text block">
                      PIPEDA &amp; Law 25 Audit Export
                    </span>
                    <span className="text-[11px] text-portal-text-muted block mt-0.5">
                      Full personal data portability archive arrives in Phase B8.3.
                    </span>
                  </div>
                  {isAdmin && (
                    <Link
                      href="/admin/audit-log"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-portal-surface hover:bg-portal-surface-hover border border-portal-border text-portal-text text-xs font-bold transition-colors shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Open Audit Log</span>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "NOTIFICATIONS" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="rounded-2xl border border-portal-border bg-portal-surface p-6 shadow-xs space-y-4">
                <div className="pb-3 border-b border-portal-border/60">
                  <h3 className="text-base font-bold text-portal-text font-headline">
                    Live Dispatch Alerts &amp; CASL Consent
                  </h3>
                  <p className="text-xs text-portal-text-muted mt-0.5">
                    Configure transactional event alerts and promotional communication consent.
                  </p>
                </div>

                <div className="divide-y divide-portal-border/50">
                  {(
                    [
                      [
                        "auctionClosing",
                        "Auction Closing Soon Alerts",
                        "Receive 15-minute countdown alerts on active auctions.",
                      ],
                      [
                        "outbidAlert",
                        "Bid Activity & Ceiling Alerts",
                        "Get notifications when auction floor bids update.",
                      ],
                      [
                        "escrowDisbursement",
                        "Appointment Voucher & Settlement Notices",
                        "Notifications when dealer handover vouchers or rulings issue.",
                      ],
                      [
                        "complianceReview",
                        "Regulatory & Moderation Updates",
                        "KYC status updates, listing moderation reviews, and statutory reminders.",
                      ],
                    ] as const
                  ).map(([key, label, desc]) => (
                    <label
                      key={key}
                      className="py-3 flex items-center justify-between gap-4 cursor-pointer"
                    >
                      <div>
                        <span className="text-xs font-bold text-portal-text block">
                          {label}
                        </span>
                        <span className="text-[11px] text-portal-text-muted block mt-0.5">
                          {desc}
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={form.notificationPreferences[key]}
                        onChange={(e) =>
                          setDraft((prev) => ({
                            ...(prev ?? {}),
                            notificationPreferences: {
                              ...(prev?.notificationPreferences ?? {}),
                              [key]: e.target.checked,
                            },
                          }))
                        }
                        className="w-4 h-4 rounded border-portal-border text-portal-primary focus:ring-portal-primary cursor-pointer accent-portal-primary"
                      />
                    </label>
                  ))}

                  <label className="py-3 flex items-center justify-between gap-4 cursor-pointer">
                    <div>
                      <span className="text-xs font-bold text-portal-text block">
                        CASL Marketing &amp; Digest Opt-In
                      </span>
                      <span className="text-[11px] text-portal-text-muted block mt-0.5">
                        Allow optional Canadian marketplace announcements (recorded in CASL consent ledger).
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={form.marketingOptIn}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...(prev ?? {}),
                          marketingOptIn: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 rounded border-portal-border text-portal-primary focus:ring-portal-primary cursor-pointer accent-portal-primary"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Save Toolbar */}
          <div className="pt-4 border-t border-portal-border/60 flex items-center justify-end gap-3">
            <Link
              href={cancelHref}
              className="px-4 py-2 rounded-xl border border-portal-border text-xs font-semibold text-portal-text-muted hover:text-portal-text hover:bg-portal-surface-hover transition-colors cursor-pointer"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={updateProfile.isPending}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-portal-primary hover:bg-portal-primary-hover text-white text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-60"
            >
              {updateProfile.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>Save Profile Settings</span>
            </button>
          </div>
        </form>
      )}

      {/* SECURITY TAB */}
      {activeTab === "SECURITY" && (
        <div className="space-y-6 animate-fadeIn">
          <MfaSettingsCard
            mandatoryPrompt={isMfaEnrollPrompt}
            onSuccess={(msg) => {
              setBannerError(null);
              setBannerSuccess(msg);
            }}
            onError={(msg) => {
              setBannerSuccess(null);
              setBannerError(msg);
            }}
          />

          <form
            onSubmit={handleChangePassword}
            className="rounded-2xl border border-portal-border bg-portal-surface p-6 shadow-xs space-y-4"
          >
            <div className="pb-3 border-b border-portal-border/60">
              <h3 className="text-base font-bold text-portal-text font-headline">
                Authentication Password
              </h3>
              <p className="text-xs text-portal-text-muted mt-0.5">
                Update your Supabase Auth password (minimum 12 characters with upper, lower, and digit).
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-portal-text mb-1.5">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 rounded-xl border border-portal-border bg-portal-surface-hover/40 text-portal-text text-xs focus:outline-none focus:ring-2 focus:ring-portal-primary/30 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-portal-text mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  minLength={12}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 rounded-xl border border-portal-border bg-portal-surface-hover/40 text-portal-text text-xs focus:outline-none focus:ring-2 focus:ring-portal-primary/30 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-portal-text mb-1.5">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  minLength={12}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 rounded-xl border border-portal-border bg-portal-surface-hover/40 text-portal-text text-xs focus:outline-none focus:ring-2 focus:ring-portal-primary/30 font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={updateSecurity.isPending}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-portal-primary hover:bg-portal-primary-hover text-white text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-60"
              >
                {updateSecurity.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Lock className="w-3.5 h-3.5" />
                )}
                <span>Update Password</span>
              </button>
            </div>
          </form>

          <div className="rounded-2xl border border-portal-border bg-portal-surface p-6 shadow-xs space-y-3">
            <div className="pb-3 border-b border-portal-border/60 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-portal-text font-headline">
                  Active Clearance Session
                </h3>
                <p className="text-xs text-portal-text-muted mt-0.5">
                  Terminate all other devices signed into this account if you suspect unauthorized access.
                </p>
              </div>
              <button
                type="button"
                onClick={handleRevokeOtherSessions}
                disabled={updateSecurity.isPending}
                className="text-xs font-semibold text-rose-500 hover:underline cursor-pointer disabled:opacity-60 shrink-0"
              >
                Revoke Other Sessions
              </button>
            </div>

            <div className="p-3 rounded-xl bg-portal-surface-hover/50 border border-portal-border/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Laptop className="w-5 h-5 text-portal-primary shrink-0" />
                <div>
                  <span className="text-xs font-bold text-portal-text block">
                    {security?.currentSession.userAgentSummary ??
                      "Authenticated Session"}
                  </span>
                  <span className="text-[11px] text-portal-text-muted font-mono block">
                    {security?.currentSession.ipAddress ?? "Verified"}
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                Current Session
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN PLATFORM CONFIG TAB */}
      {activeTab === "CONFIG" && isAdmin && (
        <form
          onSubmit={handleSaveConfig}
          className="rounded-2xl border border-portal-border bg-portal-surface p-6 shadow-xs space-y-5 animate-fadeIn"
        >
          <div className="pb-3 border-b border-portal-border/60">
            <h3 className="text-base font-bold text-portal-text font-headline">
              Dynamic Platform Governance Thresholds (FR-AD-08)
            </h3>
            <p className="text-xs text-portal-text-muted mt-0.5">
              Changes persist to PostgreSQL `platform_config` and take effect immediately without redeployment.
            </p>
          </div>

          {configQuery.isLoading ? (
            <div className="py-10 flex items-center justify-center gap-2 text-xs text-portal-text-muted">
              <Loader2 className="w-4 h-4 animate-spin text-portal-primary" />
              <span>Loading platform configuration...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {(configQuery.data?.items ?? []).map((item) => {
                const value = configDraft[item.key] ?? item.value;
                return (
                  <div
                    key={item.key}
                    className="p-4 rounded-xl border border-portal-border bg-portal-surface-hover/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <span className="text-xs font-bold text-portal-text block">
                        {CONFIG_LABELS[item.key]}
                      </span>
                      <span className="text-[11px] text-portal-text-muted block mt-0.5">
                        {item.description}
                      </span>
                      <span className="text-[10px] font-mono text-portal-text-muted block mt-1">
                        Allowed range: {item.min}–{item.max} {item.unit}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <input
                        type="number"
                        min={item.min}
                        max={item.max}
                        step={1}
                        value={value}
                        onChange={(e) => {
                          const parsed = Number.parseInt(e.target.value, 10);
                          if (!Number.isNaN(parsed)) {
                            setConfigDraft((prev) => ({
                              ...prev,
                              [item.key]: parsed,
                            }));
                          }
                        }}
                        className="w-24 px-3 py-1.5 rounded-xl border border-portal-border bg-portal-surface text-portal-text text-xs font-mono font-bold text-right focus:outline-none focus:ring-2 focus:ring-portal-primary/30"
                      />
                      <span className="text-xs font-mono text-portal-text-muted w-12">
                        {item.unit}
                      </span>
                    </div>
                  </div>
                );
              })}

              <div>
                <label className="block text-xs font-bold text-portal-text mb-1.5">
                  Audit Justification Note (Optional)
                </label>
                <input
                  type="text"
                  value={configReason}
                  onChange={(e) => setConfigReason(e.target.value)}
                  placeholder="Reason recorded in immutable audit_logs"
                  className="w-full px-3 py-2 rounded-xl border border-portal-border bg-portal-surface-hover/40 text-portal-text text-xs focus:outline-none focus:ring-2 focus:ring-portal-primary/30"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={updateConfig.isPending}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-portal-primary hover:bg-portal-primary-hover text-white text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-60"
                >
                  {updateConfig.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>Save Platform Config</span>
                </button>
              </div>
            </div>
          )}
        </form>
      )}
    </div>
  );
}

export interface ProfileSettingsViewProps {
  defaultTab?: SettingsTab;
}

export function ProfileSettingsView({
  defaultTab,
}: ProfileSettingsViewProps = {}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-portal-canvas flex items-center justify-center p-8">
          <div className="w-8 h-8 rounded-full border-2 border-portal-primary border-t-transparent animate-spin" />
        </div>
      }
    >
      <ProfileSettingsContent defaultTab={defaultTab} />
    </Suspense>
  );
}
