"use client";

import { useState, useTransition } from "react";
import { setUserRole, inviteTeamMember, deleteTeamMember, resendTeamInvite } from "@/app/actions";
import type { TeamMember } from "./page";

const ROLES = [
  { value: "admin", label: "Admin" },
  { value: "crew", label: "Field Crew" },
];

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function RoleSelect({ member }: { member: TeamMember }) {
  const [pending, startTransition] = useTransition();
  const [current, setCurrent] = useState(member.role);

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    const prev = current;
    setCurrent(next);
    startTransition(async () => {
      const res = await setUserRole(member.id, next);
      if (res?.error) { setCurrent(prev); alert(res.error); }
    });
  }

  return (
    <select
      value={current}
      onChange={handleChange}
      disabled={pending}
      className="text-xs border border-gray-200 rounded px-2 py-1.5 bg-white text-gray-700 cursor-pointer hover:border-gray-400 transition-colors disabled:opacity-50 focus:outline-none focus:border-[#000080]"
    >
      {ROLES.map((r) => (
        <option key={r.value} value={r.value}>{r.label}</option>
      ))}
    </select>
  );
}

function MemberActions({ member, currentUserId }: { member: TeamMember; currentUserId: string }) {
  const [delPending, startDel] = useTransition();
  const [resendPending, startResend] = useTransition();
  const [resendDone, setResendDone] = useState(false);
  const isSelf = member.id === currentUserId;

  function handleDelete() {
    if (!confirm(`Remove ${member.name} from the team? This cannot be undone.`)) return;
    startDel(async () => {
      const res = await deleteTeamMember(member.id);
      if (res?.error) alert(res.error);
    });
  }

  function handleResend() {
    startResend(async () => {
      const res = await resendTeamInvite(member.id, member.email, member.name);
      if (res?.error) alert(res.error);
      else setResendDone(true);
    });
  }

  return (
    <div className="flex items-center gap-2">
      {!member.confirmed && (
        <button
          onClick={handleResend}
          disabled={resendPending || resendDone}
          className="text-[10px] font-medium px-2.5 py-1 rounded border border-gray-300 text-gray-600 hover:border-[#000080] hover:text-[#000080] transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {resendPending ? "Sending…" : resendDone ? "Sent" : "Resend Invite"}
        </button>
      )}
      <button
        onClick={handleDelete}
        disabled={delPending || isSelf}
        title={isSelf ? "You cannot remove yourself" : `Remove ${member.name}`}
        className="text-[10px] font-medium px-2.5 py-1 rounded border border-gray-300 text-red-500 hover:border-red-400 hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {delPending ? "Removing…" : "Delete"}
      </button>
    </div>
  );
}

export default function SettingsClient({
  members,
  currentUserId,
}: {
  members: TeamMember[];
  currentUserId: string;
}) {
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState("crew");
  const [inviteMsg, setInviteMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [invitePending, startInvite] = useTransition();

  function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteMsg(null);
    startInvite(async () => {
      const res = await inviteTeamMember(inviteEmail.trim(), inviteName.trim(), inviteRole);
      if (res?.error) {
        setInviteMsg({ ok: false, text: res.error });
      } else {
        setInviteMsg({ ok: true, text: `Invite sent to ${inviteEmail.trim()}.` });
        setInviteEmail("");
        setInviteName("");
      }
    });
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <h1 className="text-gray-900 text-base font-bold tracking-tight">Settings</h1>
        <p className="text-gray-500 text-xs mt-0.5">Team access and role management</p>
      </div>

      <div className="flex-1 px-4 sm:px-6 py-6 max-w-3xl flex flex-col gap-8">

        {/* Team members */}
        <section>
          <div className="mb-3">
            <h2 className="text-gray-900 text-sm font-semibold">Team Members</h2>
            <p className="text-gray-500 text-xs mt-0.5">
              Change a member&apos;s role to control what they can access in the portal.
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="text-left px-4 py-2.5 text-gray-400 font-medium uppercase tracking-wider text-[10px]">Member</th>
                  <th className="text-left px-4 py-2.5 text-gray-400 font-medium uppercase tracking-wider text-[10px]">Role</th>
                  <th className="text-left px-4 py-2.5 text-gray-400 font-medium uppercase tracking-wider text-[10px] hidden sm:table-cell">Last Sign In</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {members.map((m, i) => (
                  <tr key={m.id} className={i < members.length - 1 ? "border-b border-gray-100" : ""}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-[#000080]/10 flex items-center justify-center shrink-0">
                          <span className="text-[#000080] text-[10px] font-bold">{initials(m.name)}</span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-gray-800 font-medium truncate">{m.name}</p>
                            {!m.confirmed && (
                              <span className="text-[9px] font-semibold uppercase tracking-wide text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded shrink-0">
                                Pending
                              </span>
                            )}
                          </div>
                          <p className="text-gray-400 truncate mt-0.5">{m.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <RoleSelect member={m} />
                    </td>
                    <td className="px-4 py-3 text-gray-400 hidden sm:table-cell">
                      {m.lastSignIn
                        ? new Date(m.lastSignIn).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                        : "Never"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <MemberActions member={m} currentUserId={currentUserId} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Role legend */}
        <section>
          <h2 className="text-gray-900 text-sm font-semibold mb-3">Role Permissions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                role: "Admin",
                color: "text-[#000080]",
                desc: "Full access to all CRM features: pipeline, leads, contacts, calendar, calls, vessels, services, integrations, site editor, and settings.",
              },
              {
                role: "Field Crew",
                color: "text-gray-600",
                desc: "Read access to contacts, calendar, and vessels. Cannot access pipeline, leads, integrations, site editor, or settings.",
              },
            ].map(({ role, color, desc }) => (
              <div key={role} className="bg-white rounded-lg border border-gray-200 p-4">
                <p className={`text-xs font-semibold mb-1 ${color}`}>{role}</p>
                <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Invite */}
        <section>
          <div className="mb-3">
            <h2 className="text-gray-900 text-sm font-semibold">Invite Team Member</h2>
            <p className="text-gray-500 text-xs mt-0.5">
              They&apos;ll receive an email with a link to set their password and access the portal.
            </p>
          </div>
          <form
            onSubmit={handleInvite}
            className="bg-white rounded-lg border border-gray-200 p-5 flex flex-col gap-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-700">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Jane Smith"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#000080] transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-700">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="jane@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#000080] transition-colors"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-700">Role</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 text-xs text-gray-700 focus:outline-none focus:border-[#000080] transition-colors w-full sm:w-48"
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            {inviteMsg && (
              <p className={`text-xs ${inviteMsg.ok ? "text-green-600" : "text-red-500"}`}>
                {inviteMsg.text}
              </p>
            )}
            <div>
              <button
                type="submit"
                disabled={invitePending}
                className="bg-[#000080] text-white text-xs font-semibold px-5 py-2 rounded hover:bg-[#000060] transition-colors disabled:opacity-50"
              >
                {invitePending ? "Sending..." : "Send Invite"}
              </button>
            </div>
          </form>
        </section>

      </div>
    </div>
  );
}
