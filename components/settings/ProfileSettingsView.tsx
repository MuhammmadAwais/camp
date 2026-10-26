"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  User,
  Mail,
  Phone,
  Shield,
  Building,
  MapPin,
  Lock,
  Bell,
  Key,
  Save,
  CheckCircle2,
  AlertCircle,
  Download,
  Camera,
  Laptop,
  Globe,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  FileCheck,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

type SettingsTab = "GENERAL" | "SECURITY" | "COMPLIANCE" | "NOTIFICATIONS";

export function ProfileSettingsView() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "security" ? "SECURITY" : "GENERAL";
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);

  const { user, role } = useAuth();
  const isAdmin = role === "ADMIN";
  const isDealer = role === "DEALER_ADMIN" || role === "DEALER_AGENT";

  // Form State
  const [fullName, setFullName] = useState(
    user?.name || (isAdmin ? "Sarah Tremblay" : isDealer ? "Marc Gagnon" : "Michael Vance")
  );
  const [title, setTitle] = useState(
    isAdmin ? "Lead Compliance Officer" : isDealer ? "Managing Director" : "Verified Private Seller"
  );
  const [email, setEmail] = useState(
    user?.email || (isAdmin ? "admin@autonexa.ca" : isDealer ? "trading@pfaffauto.ca" : "m.vance@rogers.ca")
  );
  const [phone, setPhone] = useState("+1 (416) 555-0194");
  const [province, setProvince] = useState(isAdmin ? "ON" : isDealer ? "ON" : "BC");
  const [city, setCity] = useState(isAdmin ? "Toronto" : isDealer ? "Markham" : "Vancouver");
  const [regulatorId, setRegulatorId] = useState(
    isAdmin ? "GOV-CA-99410" : isDealer ? "OMVIC-481920" : "ID-BC-883921"
  );
  const [language, setLanguage] = useState<"EN" | "FR">("EN");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);

  // Notification Preferences State
  const [notifyAuctionClosing, setNotifyAuctionClosing] = useState(true);
  const [notifyOutbidAlert, setNotifyOutbidAlert] = useState(true);
  const [notifyEscrowDisbursement, setNotifyEscrowDisbursement] = useState(true);
  const [notifyComplianceReview, setNotifyComplianceReview] = useState(true);

  // Status feedback
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3500);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 font-body">
      {/* 1. Header Strip */}
      <div className="pb-4 border-b border-portal-border/60">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-portal-text font-headline tracking-tight">
          Account & Profile Settings
        </h1>
        <p className="text-xs sm:text-sm text-portal-text-muted mt-1">
          Manage your personal credentials, Canadian regulatory affiliations, security keys, and dispatch alerts.
        </p>
      </div>

      {/* Save Success Banner */}
      {saveSuccess && (
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Profile settings and regulatory credentials saved successfully.</span>
          </div>
          <button
            type="button"
            onClick={() => setSaveSuccess(false)}
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
          onClick={() => setActiveTab("GENERAL")}
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
          onClick={() => setActiveTab("SECURITY")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "SECURITY"
              ? "border-portal-primary text-portal-primary"
              : "border-transparent text-portal-text-muted hover:text-portal-text hover:border-portal-border"
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Security & 2FA</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("COMPLIANCE")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "COMPLIANCE"
              ? "border-portal-primary text-portal-primary"
              : "border-transparent text-portal-text-muted hover:text-portal-text hover:border-portal-border"
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Compliance & Regulators</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("NOTIFICATIONS")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "NOTIFICATIONS"
              ? "border-portal-primary text-portal-primary"
              : "border-transparent text-portal-text-muted hover:text-portal-text hover:border-portal-border"
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Dispatch & Notifications</span>
        </button>
      </div>

      {/* 3. Tab Contents */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* TAB 1: GENERAL PROFILE */}
        {activeTab === "GENERAL" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Avatar & Monogram Block */}
            <div className="rounded-2xl border border-portal-border bg-portal-surface p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="relative size-20 rounded-2xl bg-gradient-to-br from-[#8C383E]/20 to-[#E59344]/30 border border-portal-border flex items-center justify-center font-headline font-black text-2xl text-portal-text shadow-sm">
                  {fullName.charAt(0).toUpperCase()}
                  <button
                    type="button"
                    title="Change Avatar"
                    className="absolute -bottom-1 -right-1 size-7 rounded-xl bg-portal-surface border border-portal-border flex items-center justify-center text-portal-text shadow-xs hover:bg-portal-surface-hover cursor-pointer transition-colors"
                  >
                    <Camera className="w-3.5 h-3.5 text-portal-text-muted" />
                  </button>
                </div>

                <div>
                  <h3 className="font-headline font-bold text-base text-portal-text">
                    {fullName}
                  </h3>
                  <p className="text-xs text-portal-text-muted font-mono mt-0.5">
                    {email}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-portal-primary/10 text-portal-primary border border-portal-primary/20">
                      {role || "USER"}
                    </span>
                    <span className="text-[11px] text-portal-text-muted font-medium">
                      {title}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-xl border border-portal-border text-xs font-semibold text-portal-text hover:bg-portal-surface-hover transition-colors cursor-pointer"
                >
                  Upload Photo
                </button>
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                >
                  Remove
                </button>
              </div>
            </div>

            {/* Personal Details Card */}
            <div className="rounded-2xl border border-portal-border bg-portal-surface p-6 shadow-xs space-y-4">
              <div className="pb-3 border-b border-portal-border/60">
                <h3 className="text-base font-bold text-portal-text font-headline">
                  Personal & Professional Identity
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
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-portal-border bg-portal-surface-hover/40 text-portal-text text-xs focus:outline-none focus:ring-2 focus:ring-portal-primary/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-portal-text mb-1.5">
                    Designated Title / Role
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-portal-border bg-portal-surface-hover/40 text-portal-text text-xs focus:outline-none focus:ring-2 focus:ring-portal-primary/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-portal-text mb-1.5">
                    Authorized Work Email
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-portal-border bg-portal-surface-hover/40 text-portal-text text-xs focus:outline-none focus:ring-2 focus:ring-portal-primary/30 font-mono"
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
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
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
                  Jurisdiction & Localization
                </h3>
                <p className="text-xs text-portal-text-muted mt-0.5">
                  Operating jurisdiction for provincial automotive regulator compliance.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-portal-text mb-1.5">
                    Primary Province / Territory
                  </label>
                  <select
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-portal-border bg-portal-surface-hover/40 text-portal-text text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-portal-primary/30 cursor-pointer"
                  >
                    <option value="ON">Ontario (OMVIC)</option>
                    <option value="AB">Alberta (AMVIC)</option>
                    <option value="BC">British Columbia (VSA)</option>
                    <option value="QC">Quebec (OPC / Law 25)</option>
                    <option value="MB">Manitoba</option>
                    <option value="SK">Saskatchewan</option>
                    <option value="NS">Nova Scotia</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-portal-text mb-1.5">
                    Operating Metro / City
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-portal-border bg-portal-surface-hover/40 text-portal-text text-xs focus:outline-none focus:ring-2 focus:ring-portal-primary/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-portal-text mb-1.5">
                    Language Preference
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as "EN" | "FR")}
                    className="w-full px-3 py-2 rounded-xl border border-portal-border bg-portal-surface-hover/40 text-portal-text text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-portal-primary/30 cursor-pointer"
                  >
                    <option value="EN">English (Canada)</option>
                    <option value="FR">Français (Canada - Loi 25)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SECURITY & 2FA */}
        {activeTab === "SECURITY" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Two-Factor Authentication Status */}
            <div className="rounded-2xl border border-portal-border bg-portal-surface p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-headline font-bold text-base text-portal-text">
                    Multi-Factor Authentication (MFA / 2FA)
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Mandatory for Canadian Clearing
                  </span>
                </div>
                <p className="text-xs text-portal-text-muted mt-1 max-w-xl">
                  Protects wholesale sealed-bid authority and escrow disbursements with cryptographic SMS & hardware keys.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-semibold text-emerald-500">
                  {twoFactorEnabled ? "Active (SMS + Authenticator)" : "Disabled"}
                </span>
                <button
                  type="button"
                  onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                  className="px-3.5 py-1.5 rounded-xl border border-portal-border text-xs font-semibold text-portal-text hover:bg-portal-surface-hover transition-colors cursor-pointer"
                >
                  Configure
                </button>
              </div>
            </div>

            {/* Change Password Card */}
            <div className="rounded-2xl border border-portal-border bg-portal-surface p-6 shadow-xs space-y-4">
              <div className="pb-3 border-b border-portal-border/60">
                <h3 className="text-base font-bold text-portal-text font-headline">
                  Authentication Password
                </h3>
                <p className="text-xs text-portal-text-muted mt-0.5">
                  Update your account access credentials. Requires minimum 12 characters.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-portal-text mb-1.5">
                    Current Password
                  </label>
                  <input
                    type="password"
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
                    placeholder="••••••••••••"
                    className="w-full px-3 py-2 rounded-xl border border-portal-border bg-portal-surface-hover/40 text-portal-text text-xs focus:outline-none focus:ring-2 focus:ring-portal-primary/30 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Active Sessions */}
            <div className="rounded-2xl border border-portal-border bg-portal-surface p-6 shadow-xs space-y-3">
              <div className="pb-3 border-b border-portal-border/60 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-portal-text font-headline">
                    Active Clearance Sessions
                  </h3>
                  <p className="text-xs text-portal-text-muted mt-0.5">
                    Workstations and devices currently authorized to access this account.
                  </p>
                </div>
                <button
                  type="button"
                  className="text-xs font-semibold text-rose-500 hover:underline cursor-pointer"
                >
                  Revoke Other Sessions
                </button>
              </div>

              <div className="p-3 rounded-xl bg-portal-surface-hover/50 border border-portal-border/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Laptop className="w-5 h-5 text-portal-primary shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-portal-text block">
                      Windows 11 Workstation • Chrome 134
                    </span>
                    <span className="text-[11px] text-portal-text-muted font-mono block">
                      Toronto, ON, Canada • 142.214.98.11 (Current Session)
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  Active Now
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: COMPLIANCE & REGULATORS */}
        {activeTab === "COMPLIANCE" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Statutory Compliance Dossier */}
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
                  Status: Approved
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-portal-text mb-1.5">
                    Official Regulatory ID / License #
                  </label>
                  <input
                    type="text"
                    value={regulatorId}
                    onChange={(e) => setRegulatorId(e.target.value)}
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
                      province === "ON"
                        ? "OMVIC - Ontario Motor Vehicle Industry Council"
                        : province === "AB"
                        ? "AMVIC - Alberta Motor Vehicle Industry Council"
                        : province === "BC"
                        ? "VSA - Vehicle Sales Authority of British Columbia"
                        : "OPC - Office de la protection du consommateur"
                    }
                    className="w-full px-3 py-2 rounded-xl border border-portal-border bg-portal-surface-hover/60 text-portal-text-muted text-xs cursor-not-allowed font-medium"
                  />
                </div>
              </div>

              {/* Data Portability & Audit Log Export */}
              <div className="pt-4 border-t border-portal-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="font-bold text-xs text-portal-text block">
                    PIPEDA Data Portability Request
                  </span>
                  <span className="text-[11px] text-portal-text-muted block mt-0.5">
                    Download an immutable cryptographically sealed archive of all your actions, appraisals, and transactions.
                  </span>
                </div>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-portal-surface hover:bg-portal-surface-hover border border-portal-border text-portal-text text-xs font-bold transition-colors cursor-pointer shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Request Audit Archive</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: DISPATCH & NOTIFICATIONS */}
        {activeTab === "NOTIFICATIONS" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="rounded-2xl border border-portal-border bg-portal-surface p-6 shadow-xs space-y-4">
              <div className="pb-3 border-b border-portal-border/60">
                <h3 className="text-base font-bold text-portal-text font-headline">
                  Live Dispatch Alerts & Telemetry
                </h3>
                <p className="text-xs text-portal-text-muted mt-0.5">
                  Configure real-time SMS and email notifications for wholesale bidding events.
                </p>
              </div>

              <div className="divide-y divide-portal-border/50">
                <label className="py-3 flex items-center justify-between gap-4 cursor-pointer">
                  <div>
                    <span className="text-xs font-bold text-portal-text block">
                      Auction Closing Soon Alerts
                    </span>
                    <span className="text-[11px] text-portal-text-muted block mt-0.5">
                      Receive immediate 15-minute countdown reminders on active bids.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyAuctionClosing}
                    onChange={(e) => setNotifyAuctionClosing(e.target.checked)}
                    className="w-4 h-4 rounded border-portal-border text-portal-primary focus:ring-portal-primary cursor-pointer accent-portal-primary"
                  />
                </label>

                <label className="py-3 flex items-center justify-between gap-4 cursor-pointer">
                  <div>
                    <span className="text-xs font-bold text-portal-text block">
                      Outbid Velocity & Floor Revisions
                    </span>
                    <span className="text-[11px] text-portal-text-muted block mt-0.5">
                      Get instantaneous updates when a competing dealer raises a sealed ceiling.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyOutbidAlert}
                    onChange={(e) => setNotifyOutbidAlert(e.target.checked)}
                    className="w-4 h-4 rounded border-portal-border text-portal-primary focus:ring-portal-primary cursor-pointer accent-portal-primary"
                  />
                </label>

                <label className="py-3 flex items-center justify-between gap-4 cursor-pointer">
                  <div>
                    <span className="text-xs font-bold text-portal-text block">
                      Escrow Clearance & Payout Releases
                    </span>
                    <span className="text-[11px] text-portal-text-muted block mt-0.5">
                      Automated EFT disbursement notices upon vehicle inspection sign-off.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyEscrowDisbursement}
                    onChange={(e) => setNotifyEscrowDisbursement(e.target.checked)}
                    className="w-4 h-4 rounded border-portal-border text-portal-primary focus:ring-portal-primary cursor-pointer accent-portal-primary"
                  />
                </label>

                <label className="py-3 flex items-center justify-between gap-4 cursor-pointer">
                  <div>
                    <span className="text-xs font-bold text-portal-text block">
                      Regulatory & Compliance Audit Notices
                    </span>
                    <span className="text-[11px] text-portal-text-muted block mt-0.5">
                      Statutory renewal reminders for OMVIC/AMVIC licensing and CASL consent logs.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyComplianceReview}
                    onChange={(e) => setNotifyComplianceReview(e.target.checked)}
                    className="w-4 h-4 rounded border-portal-border text-portal-primary focus:ring-portal-primary cursor-pointer accent-portal-primary"
                  />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* 4. Bottom Sticky Action Toolbar */}
        <div className="pt-4 border-t border-portal-border/60 flex items-center justify-end gap-3">
          <Link
            href="/admin/analytics"
            className="px-4 py-2 rounded-xl border border-portal-border text-xs font-semibold text-portal-text-muted hover:text-portal-text hover:bg-portal-surface-hover transition-colors cursor-pointer"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-portal-primary hover:bg-portal-primary-hover text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Profile Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
}
