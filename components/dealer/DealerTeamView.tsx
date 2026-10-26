"use client";

import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Users,
  UserPlus,
  ShieldCheck,
  Mail,
  Trash2,
  CheckCircle2,
  Search,
  X,
  Check,
  Shield,
  Gavel,
  Wrench,
  User,
} from "lucide-react";

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: "DEALER_ADMIN" | "DEALER_BUYER" | "DEALER_INSPECTOR";
  joinedAt: string;
  lastActive: string;
};

const ROLES_INFO = {
  DEALER_BUYER: {
    label: "Wholesale Buyer",
    description: "Can view live inventory, place binding sealed bids, and revise offers.",
    icon: Gavel,
    badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  DEALER_INSPECTOR: {
    label: "Service Inspector",
    description: "Can log vehicle hoist condition reports and upload mechanical inspection photos.",
    icon: Wrench,
    badgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
  DEALER_ADMIN: {
    label: "Dealership Admin",
    description: "Full access to billing, invoices, team seat management, and bidding floor.",
    icon: Shield,
    badgeClass: "bg-primary/10 text-primary dark:bg-secondary/15 dark:text-secondary border-primary/20 dark:border-secondary/30",
  },
};

export function DealerTeamView() {
  const [members, setMembers] = useState<TeamMember[]>([
    {
      id: "usr-1",
      name: "Christopher Evans",
      email: "c.evans@pfaffauto.com",
      role: "DEALER_ADMIN",
      joinedAt: "Jan 12, 2026",
      lastActive: "12 mins ago",
    },
    {
      id: "usr-2",
      name: "Tyler Richardson",
      email: "t.richardson@pfaffauto.com",
      role: "DEALER_BUYER",
      joinedAt: "Feb 04, 2026",
      lastActive: "1 hour ago",
    },
    {
      id: "usr-3",
      name: "Sarah Vane",
      email: "s.vane@pfaffauto.com",
      role: "DEALER_INSPECTOR",
      joinedAt: "Mar 18, 2026",
      lastActive: "Yesterday",
    },
  ]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Client-side mount indicator for document.body portaling
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Modal Form State
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"DEALER_ADMIN" | "DEALER_BUYER" | "DEALER_INSPECTOR">("DEALER_BUYER");

  // Prevent background scroll and attach Escape key listener when modal is open
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") setIsModalOpen(false);
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = "unset";
        window.removeEventListener("keydown", handleKeyDown);
      };
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isModalOpen]);

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const matchesSearch =
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole =
        selectedRoleFilter === "ALL" || m.role === selectedRoleFilter;
      return matchesSearch && matchesRole;
    });
  }, [members, searchQuery, selectedRoleFilter]);

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) return;

    const newMember: TeamMember = {
      id: `usr-${Date.now()}`,
      name: inviteName.trim(),
      email: inviteEmail.trim(),
      role: inviteRole,
      joinedAt: "Just now",
      lastActive: "Invited",
    };

    setMembers([...members, newMember]);
    setFeedback(`Invitation sent to ${inviteEmail}`);
    setInviteEmail("");
    setInviteName("");
    setInviteRole("DEALER_BUYER");
    setIsModalOpen(false);
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleRemove = (id: string, name: string) => {
    if (confirm(`Revoke wholesale trading access for ${name}?`)) {
      setMembers(members.filter((m) => m.id !== id));
      setFeedback(`Access revoked for ${name}`);
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <div className="w-full max-w-6xl mx-auto py-2 sm:py-6 space-y-8 font-body animate-in fade-in duration-300">
      {/* Clean Unboxed Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white font-headline">
              Team & Permissions
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
            Grant authorized rooftop buyers access to place sealed bids and inspect won auction vehicles.
          </p>
        </div>

        {/* Invite CTA Button */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-xs text-neutral-400 dark:text-neutral-500 block">
              Rooftop Capacity
            </span>
            <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
              {members.length} of 5 Seats Used
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-primary dark:bg-secondary text-white font-semibold text-xs shadow-xs hover:opacity-95 transition-opacity inline-flex items-center gap-2 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Invite Team Member</span>
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {feedback && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Utility Bar: Search Input & Role Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Role Tabs */}
        <div className="inline-flex items-center p-1 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200/80 dark:border-white/5 text-xs">
          <button
            type="button"
            onClick={() => setSelectedRoleFilter("ALL")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-medium ${
              selectedRoleFilter === "ALL"
                ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white font-bold shadow-2xs"
                : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            }`}
          >
            All Members ({members.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedRoleFilter("DEALER_BUYER")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-medium ${
              selectedRoleFilter === "DEALER_BUYER"
                ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white font-bold shadow-2xs"
                : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            }`}
          >
            Buyers ({members.filter((m) => m.role === "DEALER_BUYER").length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedRoleFilter("DEALER_INSPECTOR")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-medium ${
              selectedRoleFilter === "DEALER_INSPECTOR"
                ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white font-bold shadow-2xs"
                : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            }`}
          >
            Inspectors ({members.filter((m) => m.role === "DEALER_INSPECTOR").length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedRoleFilter("DEALER_ADMIN")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-medium ${
              selectedRoleFilter === "DEALER_ADMIN"
                ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white font-bold shadow-2xs"
                : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            }`}
          >
            Admins ({members.filter((m) => m.role === "DEALER_ADMIN").length})
          </button>
        </div>

        {/* Live Search */}
        <div className="relative sm:w-64">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-xs placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:focus:ring-secondary/20"
          />
        </div>
      </div>

      {/* Team Roster Table */}
      <div className="rounded-2xl border border-neutral-200/90 dark:border-white/10 bg-white dark:bg-neutral-900/40 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-neutral-200/80 dark:border-white/5 bg-neutral-50/75 dark:bg-neutral-800/50 text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                <th className="py-3.5 px-4 font-semibold">Authorized Representative</th>
                <th className="py-3.5 px-4 font-semibold">Assigned Role</th>
                <th className="py-3.5 px-4 font-semibold">Joined Date</th>
                <th className="py-3.5 px-4 font-semibold">Last Activity</th>
                <th className="py-3.5 px-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-white/5">
              {filteredMembers.length > 0 ? (
                filteredMembers.map((member) => {
                  const roleConfig = ROLES_INFO[member.role];
                  return (
                    <tr
                      key={member.id}
                      className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40 transition-colors"
                    >
                      {/* Name & Email with Avatar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center font-bold text-xs text-neutral-700 dark:text-neutral-300 shrink-0">
                            {getInitials(member.name)}
                          </div>
                          <div>
                            <span className="font-bold text-neutral-900 dark:text-white block">
                              {member.name}
                            </span>
                            <span className="text-neutral-500 dark:text-neutral-400 text-xs">
                              {member.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Role Pill */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${roleConfig.badgeClass}`}
                        >
                          <roleConfig.icon className="w-3 h-3" />
                          <span>{roleConfig.label}</span>
                        </span>
                      </td>

                      {/* Joined Date */}
                      <td className="py-3.5 px-4 text-neutral-500 dark:text-neutral-400">
                        {member.joinedAt}
                      </td>

                      {/* Last Activity */}
                      <td className="py-3.5 px-4">
                        <span className="text-neutral-700 dark:text-neutral-300 font-medium">
                          {member.lastActive}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        {member.role !== "DEALER_ADMIN" && (
                          <button
                            type="button"
                            onClick={() => handleRemove(member.id, member.name)}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
                            title="Revoke rooftop access"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-neutral-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-xs font-medium">No team members found</p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedRoleFilter("ALL");
                      }}
                      className="text-xs font-semibold text-primary dark:text-secondary mt-1 hover:underline cursor-pointer"
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

      {/* Interactive Invite Team Member Modal (Portaled to document.body to dim entire screen including sidebar) */}
      {isModalOpen && isMounted && createPortal(
        <div
          className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-3xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-neutral-900 p-6 sm:p-7 shadow-2xl space-y-6 relative animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white font-headline">
                  Invite Rooftop Team Member
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Send a verified invitation to a buyer or technician at your dealership.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleInvite} className="space-y-4">
              {/* Full Name Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jordan Matthews"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50/60 dark:bg-neutral-800 text-neutral-900 dark:text-white text-xs placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:focus:ring-secondary/20 transition-all"
                />
              </div>

              {/* Work Email Address */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Work Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. j.matthews@pfaffauto.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50/60 dark:bg-neutral-800 text-neutral-900 dark:text-white text-xs placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:focus:ring-secondary/20 transition-all"
                />
              </div>

              {/* Interactive Role Cards Selection */}
              <div className="space-y-2 pt-1">
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Select Permission Role
                </label>
                <div className="space-y-2">
                  {(["DEALER_BUYER", "DEALER_INSPECTOR", "DEALER_ADMIN"] as const).map(
                    (roleKey) => {
                      const isSelected = inviteRole === roleKey;
                      const roleConfig = ROLES_INFO[roleKey];
                      const IconComponent = roleConfig.icon;

                      return (
                        <div
                          key={roleKey}
                          onClick={() => setInviteRole(roleKey)}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                            isSelected
                              ? "border-primary dark:border-secondary bg-primary/5 dark:bg-secondary/10 shadow-xs"
                              : "border-neutral-200 dark:border-neutral-700/80 bg-neutral-50/50 dark:bg-neutral-800/40 hover:border-neutral-300 dark:hover:border-neutral-600"
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                              isSelected
                                ? "bg-primary dark:bg-secondary text-white"
                                : "bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300"
                            }`}
                          >
                            <IconComponent className="w-4 h-4" />
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span
                                className={`text-xs font-bold ${
                                  isSelected
                                    ? "text-primary dark:text-secondary"
                                    : "text-neutral-900 dark:text-white"
                                }`}
                              >
                                {roleConfig.label}
                              </span>
                              {isSelected && (
                                <span className="w-4 h-4 rounded-full bg-primary dark:bg-secondary text-white flex items-center justify-center">
                                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 leading-snug">
                              {roleConfig.description}
                            </p>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-neutral-100 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary dark:bg-secondary text-white text-xs font-bold transition-opacity hover:opacity-95 shadow-xs cursor-pointer"
                >
                  Send Invitation
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
