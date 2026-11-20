"use client";

import React, { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Gavel,
  Loader2,
  Search,
  Shield,
  Trash2,
  UserPlus,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { ApiError } from "@/lib/api-client";
import {
  useDealerTeam,
  useInviteDealerMember,
  useRemoveDealerMember,
  useUpdateDealerMemberRole,
} from "@/hooks/useDealerTeam";
import type { DealerSeatRole, DealerTeamMember } from "@/lib/types/dealer";

const subscribeNoop = () => () => {};
const getTrueClient = () => true;
const getFalseServer = () => false;

const EMPTY_MEMBERS: DealerTeamMember[] = [];

const ROLES_INFO: Record<
  DealerSeatRole,
  {
    label: string;
    description: string;
    icon: typeof Gavel;
    badgeClass: string;
  }
> = {
  DEALER_BUYER: {
    label: "Wholesale Buyer",
    description:
      "Can view live inventory, place binding sealed bids, and revise offers.",
    icon: Gavel,
    badgeClass:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  DEALER_INSPECTOR: {
    label: "Service Inspector",
    description:
      "Can review vehicle condition disclosures and post-match inspection reports (no bidding).",
    icon: Wrench,
    badgeClass:
      "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
  DEALER_ADMIN: {
    label: "Dealership Admin",
    description:
      "Full access to billing, invoices, team seat management, and bidding floor.",
    icon: Shield,
    badgeClass:
      "bg-portal-primary/10 text-portal-primary border-portal-primary/25",
  },
};

function getInitials(name: string): string {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "TM"
  );
}

export function DealerTeamView() {
  const isMounted = useSyncExternalStore(
    subscribeNoop,
    getTrueClient,
    getFalseServer
  );

  const teamQuery = useDealerTeam();
  const inviteMutation = useInviteDealerMember();
  const updateRoleMutation = useUpdateDealerMemberRole();
  const removeMutation = useRemoveDealerMember();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteJobTitle, setInviteJobTitle] = useState("");
  const [inviteRole, setInviteRole] = useState<DealerSeatRole>("DEALER_BUYER");
  const [inviteError, setInviteError] = useState<string | null>(null);

  useEffect(() => {
    if (!isModalOpen) {
      document.body.style.overflow = "unset";
      return;
    }

    document.body.style.overflow = "hidden";
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsModalOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isModalOpen]);

  const members = teamQuery.data?.members ?? EMPTY_MEMBERS;
  const summary = teamQuery.data?.summary ?? {
    seatsUsed: 0,
    maxSeats: 3,
    planName: "Starter",
    adminsCount: 0,
    buyersCount: 0,
    inspectorsCount: 0,
  };

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q);
      const matchesRole =
        selectedRoleFilter === "ALL" || m.role === selectedRoleFilter;
      return matchesSearch && matchesRole;
    });
  }, [members, searchQuery, selectedRoleFilter]);

  const handleOpenInviteModal = () => {
    setInviteError(null);
    setIsModalOpen(true);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError(null);

    if (inviteName.trim().length < 2 || !inviteEmail.trim().includes("@")) {
      setInviteError("Please enter a valid full name and corporate email address.");
      return;
    }

    try {
      const result = await inviteMutation.mutateAsync({
        name: inviteName.trim(),
        email: inviteEmail.trim(),
        seatRole: inviteRole,
        ...(inviteJobTitle.trim() ? { jobTitle: inviteJobTitle.trim() } : {}),
      });

      setFeedback({ text: result.message, type: "success" });
      setInviteEmail("");
      setInviteName("");
      setInviteJobTitle("");
      setInviteRole("DEALER_BUYER");
      setIsModalOpen(false);
      setTimeout(() => setFeedback(null), 5000);
    } catch (err) {
      setInviteError(
        err instanceof ApiError
          ? err.failure.error
          : "Unable to invite team member."
      );
    }
  };

  const handleRoleChange = async (memberId: string, nextRole: DealerSeatRole) => {
    try {
      const result = await updateRoleMutation.mutateAsync({
        memberId,
        payload: { seatRole: nextRole },
      });
      setFeedback({ text: result.message, type: "success" });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err) {
      setFeedback({
        text:
          err instanceof ApiError
            ? err.failure.error
            : "Unable to update team role.",
        type: "error",
      });
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  const handleConfirmRemove = async (memberId: string) => {
    try {
      const result = await removeMutation.mutateAsync(memberId);
      setConfirmRemoveId(null);
      setFeedback({ text: result.message, type: "success" });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err) {
      setConfirmRemoveId(null);
      setFeedback({
        text:
          err instanceof ApiError
            ? err.failure.error
            : "Unable to revoke team seat.",
        type: "error",
      });
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  const seatsAtCapacity = summary.seatsUsed >= summary.maxSeats;

  return (
    <div className="w-full max-w-6xl mx-auto py-2 sm:py-6 space-y-8 font-body animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-portal-text font-headline">
            Team &amp; Permissions
          </h1>
          <p className="text-xs sm:text-sm text-portal-text-muted mt-1">
            Grant authorized rooftop buyers and inspectors role-scoped access for{" "}
            {teamQuery.data?.dealershipName ?? "your dealership"}.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-xs text-portal-text-muted block">
              {summary.planName} Plan Capacity
            </span>
            <span className="text-xs font-bold text-portal-text">
              {summary.seatsUsed} of {summary.maxSeats} Seats Used
            </span>
          </div>
          <button
            type="button"
            disabled={teamQuery.isLoading || teamQuery.isError || seatsAtCapacity}
            onClick={handleOpenInviteModal}
            className="px-4 py-2.5 rounded-xl bg-portal-primary text-white font-semibold text-xs shadow-xs hover:opacity-95 transition-opacity inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <UserPlus className="w-4 h-4" />
            <span>
              {seatsAtCapacity ? "Seat Limit Reached" : "Invite Team Member"}
            </span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-medium flex items-center justify-between gap-2 animate-in fade-in duration-200 ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400"
              : "bg-red-500/10 border-red-500/25 text-red-500"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="opacity-70 hover:opacity-100 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {teamQuery.isLoading ? (
        <div className="rounded-2xl border border-portal-border bg-portal-surface p-14 text-center space-y-3 text-portal-text-muted">
          <Loader2 className="w-7 h-7 animate-spin text-portal-primary mx-auto" />
          <p className="text-xs">Loading dealership team roster...</p>
        </div>
      ) : teamQuery.isError ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-10 text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto" />
          <p className="text-sm font-bold text-portal-text">
            {teamQuery.error instanceof ApiError
              ? teamQuery.error.failure.error
              : "Unable to load dealership team roster."}
          </p>
          <p className="text-xs text-portal-text-muted">
            Only Dealership Administrators can view and manage team seats (FR-DL-04).
          </p>
        </div>
      ) : (
        <>
          {/* Utility Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="inline-flex items-center flex-wrap p-1 rounded-xl bg-portal-surface border border-portal-border text-xs">
              <button
                type="button"
                onClick={() => setSelectedRoleFilter("ALL")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-medium ${
                  selectedRoleFilter === "ALL"
                    ? "bg-portal-surface-hover text-portal-text font-bold shadow-2xs"
                    : "text-portal-text-muted hover:text-portal-text"
                }`}
              >
                All Members ({summary.seatsUsed})
              </button>
              <button
                type="button"
                onClick={() => setSelectedRoleFilter("DEALER_BUYER")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-medium ${
                  selectedRoleFilter === "DEALER_BUYER"
                    ? "bg-portal-surface-hover text-portal-text font-bold shadow-2xs"
                    : "text-portal-text-muted hover:text-portal-text"
                }`}
              >
                Buyers ({summary.buyersCount})
              </button>
              <button
                type="button"
                onClick={() => setSelectedRoleFilter("DEALER_INSPECTOR")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-medium ${
                  selectedRoleFilter === "DEALER_INSPECTOR"
                    ? "bg-portal-surface-hover text-portal-text font-bold shadow-2xs"
                    : "text-portal-text-muted hover:text-portal-text"
                }`}
              >
                Inspectors ({summary.inspectorsCount})
              </button>
              <button
                type="button"
                onClick={() => setSelectedRoleFilter("DEALER_ADMIN")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-medium ${
                  selectedRoleFilter === "DEALER_ADMIN"
                    ? "bg-portal-surface-hover text-portal-text font-bold shadow-2xs"
                    : "text-portal-text-muted hover:text-portal-text"
                }`}
              >
                Admins ({summary.adminsCount})
              </button>
            </div>

            <div className="relative sm:w-64">
              <Search className="w-3.5 h-3.5 text-portal-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-portal-border bg-portal-surface text-portal-text text-xs placeholder:text-portal-text-muted focus:outline-none focus:ring-2 focus:ring-portal-primary/25"
              />
            </div>
          </div>

          {/* Roster Table */}
          <div className="rounded-2xl border border-portal-border bg-portal-surface overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-portal-border bg-portal-surface-hover/50 text-[11px] font-semibold text-portal-text-muted uppercase tracking-wider">
                    <th className="py-3.5 px-4 font-semibold">
                      Authorized Representative
                    </th>
                    <th className="py-3.5 px-4 font-semibold">Assigned Role</th>
                    <th className="py-3.5 px-4 font-semibold">Joined Date</th>
                    <th className="py-3.5 px-4 font-semibold">Last Activity</th>
                    <th className="py-3.5 px-4 text-right font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-portal-border/50">
                  {filteredMembers.length > 0 ? (
                    filteredMembers.map((member) => {
                      const roleConfig = ROLES_INFO[member.role];
                      const IconComponent = roleConfig.icon;
                      const isConfirmingRemove = confirmRemoveId === member.id;
                      const isMutating =
                        updateRoleMutation.isPending ||
                        removeMutation.isPending;

                      return (
                        <tr
                          key={member.id}
                          className="hover:bg-portal-surface-hover/40 transition-colors"
                        >
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-portal-surface-hover border border-portal-border flex items-center justify-center font-bold text-xs text-portal-text shrink-0">
                                {getInitials(member.name)}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-portal-text">
                                    {member.name}
                                  </span>
                                  {member.isSelf && (
                                    <span className="px-1.5 py-0.5 rounded bg-portal-primary/10 text-portal-primary text-[10px] font-bold">
                                      You
                                    </span>
                                  )}
                                </div>
                                <span className="text-portal-text-muted text-xs block">
                                  {member.email}
                                  {member.jobTitle ? ` • ${member.jobTitle}` : ""}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${roleConfig.badgeClass}`}
                              >
                                <IconComponent className="w-3 h-3" />
                                <span>{roleConfig.label}</span>
                              </span>
                              {!member.isSelf && (
                                <select
                                  aria-label={`Change role for ${member.name}`}
                                  disabled={isMutating}
                                  value={member.role}
                                  onChange={(e) =>
                                    void handleRoleChange(
                                      member.id,
                                      e.target.value as DealerSeatRole
                                    )
                                  }
                                  className="px-2 py-1 rounded-lg border border-portal-border bg-portal-surface-hover text-portal-text text-[11px] font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-portal-primary disabled:opacity-50"
                                >
                                  <option value="DEALER_BUYER">Buyer</option>
                                  <option value="DEALER_INSPECTOR">
                                    Inspector
                                  </option>
                                  <option value="DEALER_ADMIN">Admin</option>
                                </select>
                              )}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-portal-text-muted">
                            {member.joinedAt}
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="text-portal-text font-medium">
                              {member.lastActive}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            {!member.isSelf &&
                              (isConfirmingRemove ? (
                                <div className="inline-flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    disabled={removeMutation.isPending}
                                    onClick={() =>
                                      void handleConfirmRemove(member.id)
                                    }
                                    className="px-2.5 py-1 rounded-lg bg-red-600 text-white text-[11px] font-bold hover:bg-red-700 cursor-pointer disabled:opacity-50"
                                  >
                                    Confirm Revoke
                                  </button>
                                  <button
                                    type="button"
                                    disabled={removeMutation.isPending}
                                    onClick={() => setConfirmRemoveId(null)}
                                    className="px-2.5 py-1 rounded-lg border border-portal-border bg-portal-surface text-portal-text text-[11px] font-semibold hover:bg-portal-surface-hover cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  disabled={isMutating}
                                  onClick={() => setConfirmRemoveId(member.id)}
                                  className="p-1.5 rounded-lg text-portal-text-muted hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer disabled:opacity-50"
                                  title="Revoke rooftop seat"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              ))}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-12 text-center text-portal-text-muted"
                      >
                        <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        <p className="text-xs font-medium">
                          No team members found
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery("");
                            setSelectedRoleFilter("ALL");
                          }}
                          className="text-xs font-semibold text-portal-primary mt-1 hover:underline cursor-pointer"
                        >
                          Reset filters
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Body-Portaled Invite Team Member Modal */}
      {isModalOpen &&
        isMounted &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={() => setIsModalOpen(false)}
          >
            <div
              className="w-full max-w-lg rounded-3xl border border-portal-border bg-portal-surface p-6 sm:p-7 shadow-2xl space-y-6 relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-portal-text font-headline">
                    Invite Rooftop Team Member
                  </h3>
                  <p className="text-xs text-portal-text-muted mt-0.5">
                    Assign a buyer, inspector, or administrator seat for{" "}
                    {teamQuery.data?.dealershipName ?? "your dealership"}.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-xl text-portal-text-muted hover:text-portal-text transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleInvite} className="space-y-4">
                {inviteError && (
                  <div className="p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-xs text-red-500 font-semibold">
                    {inviteError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-portal-text">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Jordan Matthews"
                      value={inviteName}
                      onChange={(e) => setInviteName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-portal-border bg-portal-surface-hover/50 text-portal-text text-xs placeholder:text-portal-text-muted focus:outline-none focus:ring-2 focus:ring-portal-primary/25"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-portal-text">
                      Job Title (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Senior Buyer"
                      value={inviteJobTitle}
                      onChange={(e) => setInviteJobTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-portal-border bg-portal-surface-hover/50 text-portal-text text-xs placeholder:text-portal-text-muted focus:outline-none focus:ring-2 focus:ring-portal-primary/25"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-portal-text">
                    Work Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. j.matthews@pfaffauto.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-portal-border bg-portal-surface-hover/50 text-portal-text text-xs placeholder:text-portal-text-muted focus:outline-none focus:ring-2 focus:ring-portal-primary/25"
                  />
                </div>

                <div className="space-y-2 pt-1">
                  <label className="block text-xs font-semibold text-portal-text">
                    Select Permission Role
                  </label>
                  <div className="space-y-2">
                    {(
                      [
                        "DEALER_BUYER",
                        "DEALER_INSPECTOR",
                        "DEALER_ADMIN",
                      ] as const
                    ).map((roleKey) => {
                      const isSelected = inviteRole === roleKey;
                      const roleConfig = ROLES_INFO[roleKey];
                      const IconComponent = roleConfig.icon;

                      return (
                        <button
                          key={roleKey}
                          type="button"
                          onClick={() => setInviteRole(roleKey)}
                          className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                            isSelected
                              ? "border-portal-primary bg-portal-primary/10 shadow-xs"
                              : "border-portal-border bg-portal-surface-hover/40 hover:border-portal-primary/40"
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                              isSelected
                                ? "bg-portal-primary text-white"
                                : "bg-portal-surface-hover text-portal-text-muted"
                            }`}
                          >
                            <IconComponent className="w-4 h-4" />
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span
                                className={`text-xs font-bold ${
                                  isSelected
                                    ? "text-portal-primary"
                                    : "text-portal-text"
                                }`}
                              >
                                {roleConfig.label}
                              </span>
                              {isSelected && (
                                <span className="w-4 h-4 rounded-full bg-portal-primary text-white flex items-center justify-center">
                                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-portal-text-muted mt-0.5 leading-snug">
                              {roleConfig.description}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-portal-border">
                  <button
                    type="button"
                    disabled={inviteMutation.isPending}
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-portal-border bg-portal-surface hover:bg-portal-surface-hover text-portal-text text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={inviteMutation.isPending}
                    className="px-5 py-2 rounded-xl bg-portal-primary text-white text-xs font-bold transition-opacity hover:opacity-95 shadow-xs inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {inviteMutation.isPending ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Provisioning...</span>
                      </>
                    ) : (
                      <span>Send Invitation</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
