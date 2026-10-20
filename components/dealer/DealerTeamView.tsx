"use client";

import React, { useState } from "react";
import {
  Users,
  UserPlus,
  ShieldCheck,
  Mail,
  Trash2,
  CheckCircle2,
  Building2,
  Crown,
  KeyRound,
} from "lucide-react";

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: "DEALER_ADMIN" | "DEALER_BUYER" | "DEALER_INSPECTOR";
  joinedAt: string;
  lastActive: string;
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

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<"DEALER_ADMIN" | "DEALER_BUYER" | "DEALER_INSPECTOR">("DEALER_BUYER");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    const newMember: TeamMember = {
      id: `usr-${Date.now()}`,
      name: inviteName,
      email: inviteEmail,
      role: inviteRole,
      joinedAt: "Today",
      lastActive: "Pending Invite",
    };
    setMembers([...members, newMember]);
    setFeedback(`Invitation dispatched to ${inviteEmail}`);
    setInviteEmail("");
    setInviteName("");
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

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl border border-portal-border bg-portal-surface p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-md bg-portal-primary/10 text-portal-primary text-xs font-bold font-mono uppercase tracking-wider">
              Organization Access
            </span>
            <span className="text-xs text-portal-text-muted font-mono">
              Pfaff Porsche (OMVIC-481920)
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-portal-text font-headline">
            Dealership Team Management
          </h1>
          <p className="text-xs sm:text-sm text-portal-text-muted mt-1">
            Grant authorized wholesale acquisition staff access to place sealed bids and inspect won auction vehicles.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-portal-primary hover:bg-portal-primary-hover text-white text-xs font-bold transition-all shadow-xs inline-flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Invite Staff Member</span>
        </button>
      </div>

      {feedback && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-500 text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Team Table */}
      <div className="rounded-2xl border border-portal-border bg-portal-surface overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-portal-border bg-portal-surface-hover/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-portal-primary" />
            <h2 className="text-sm font-bold text-portal-text uppercase tracking-wider font-mono">
              Authorized Representatives ({members.length})
            </h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-portal-border bg-portal-surface-hover/70 font-mono text-[11px] uppercase tracking-wider text-portal-text-muted">
                <th className="p-4">Name &amp; Email</th>
                <th className="p-4">Assigned Role</th>
                <th className="p-4">Joined Date</th>
                <th className="p-4">Last Activity</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-portal-border">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-portal-surface-hover/40 transition-colors">
                  <td className="p-4">
                    <span className="font-bold text-portal-text block">{member.name}</span>
                    <span className="text-[11px] font-mono text-portal-text-muted">{member.email}</span>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase inline-block ${
                        member.role === "DEALER_ADMIN"
                          ? "bg-portal-primary/10 text-portal-primary border border-portal-primary/20"
                          : member.role === "DEALER_BUYER"
                          ? "bg-emerald-500/10 text-emerald-500"
                          : "bg-blue-500/10 text-blue-500"
                      }`}
                    >
                      {member.role.replace("DEALER_", "")}
                    </span>
                  </td>
                  <td className="p-4 font-mono text-portal-text-muted">{member.joinedAt}</td>
                  <td className="p-4 font-mono text-portal-text-muted">{member.lastActive}</td>
                  <td className="p-4 text-right">
                    {member.role !== "DEALER_ADMIN" && (
                      <button
                        type="button"
                        onClick={() => handleRemove(member.id, member.name)}
                        className="p-1.5 rounded-lg text-portal-text-muted hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                        title="Revoke Access"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-portal-border bg-portal-surface p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 className="text-base font-bold text-portal-text">Invite Team Member</h3>
              <p className="text-xs text-portal-text-muted mt-0.5">
                Send an invitation to a buyer or technician at your dealership rooftop.
              </p>
            </div>

            <form onSubmit={handleInvite} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-portal-text">Full Name</label>
                <input
                  type="text"
                  required
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="e.g. Jordan Matthews"
                  className="w-full px-3 py-2 rounded-xl border border-portal-border bg-portal-surface-hover text-portal-text text-xs focus:ring-2 focus:ring-portal-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-portal-text">Work Email Address</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="e.g. j.matthews@pfaffauto.com"
                  className="w-full px-3 py-2 rounded-xl border border-portal-border bg-portal-surface-hover text-portal-text text-xs font-mono focus:ring-2 focus:ring-portal-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-portal-text">Trading Permissions Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-portal-border bg-portal-surface-hover text-portal-text text-xs font-mono"
                >
                  <option value="DEALER_BUYER">Wholesale Buyer (Can place and revise sealed bids)</option>
                  <option value="DEALER_INSPECTOR">Service Inspector (Can log physical hoist inspections)</option>
                  <option value="DEALER_ADMIN">Dealership Admin (Billing, team, and bidding access)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-portal-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-portal-border text-xs text-portal-text-muted hover:text-portal-text cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-portal-primary hover:bg-portal-primary-hover text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
