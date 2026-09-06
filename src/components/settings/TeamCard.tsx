"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Trash2, UserPlus } from "react-feather";
import { Card } from "@/components/dashboard/Card";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { InviteDialog } from "./InviteDialog";
import { useCan } from "@/components/providers/SessionProvider";
import { ASSIGNABLE_ROLES } from "@/lib/validation/team";
import { ROLE_LABELS, type Role } from "@/lib/permissions";
import type { PendingInvite, TeamMember } from "@/lib/queries/settings";

export function TeamCard({
  members,
  invites,
}: {
  members: TeamMember[];
  invites: PendingInvite[];
}) {
  const router = useRouter();
  const canManage = useCan("team:manage");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function patchMember(id: string, data: Record<string, unknown>) {
    setBusyId(id);
    const res = await fetch(`/api/team/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setBusyId(null);
    if (res.ok) router.refresh();
    else {
      const j = await res.json().catch(() => null);
      alert(j?.error?.message ?? "Update failed");
      router.refresh();
    }
  }

  async function revokeInvite(id: string) {
    await fetch(`/api/team/invites/${id}`, { method: "DELETE" });
    router.refresh();
  }

  function copyLink(token: string) {
    const url = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(url).catch(() => {});
  }

  const activeCount = members.filter((m) => m.isActive).length;

  return (
    <Card>
      <header className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5">
        <div>
          <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">
            Team
          </h3>
          <p className="mt-0.5 text-[13px] text-ink-3">
            {activeCount} active
            {invites.length > 0 && ` · ${invites.length} pending invite${invites.length > 1 ? "s" : ""}`}
          </p>
        </div>
        {canManage && (
          <InviteDialog
            trigger={(open) => (
              <button
                onClick={open}
                className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-sm)] border border-hairline-strong bg-surface px-3 text-[12.5px] font-medium text-ink hover:bg-surface-sunken"
              >
                <UserPlus size={14} />
                Invite
              </button>
            )}
          />
        )}
      </header>

      <div className="overflow-x-auto px-2 pb-2 pt-2">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {["Name", "Email", "Role"].map((h) => (
                <th
                  key={h}
                  className="eyebrow px-3 pb-2 pt-1 text-left font-semibold"
                >
                  {h}
                </th>
              ))}
              {canManage && <th className="w-10" />}
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} className="group border-t border-hairline">
                <td className="px-3 py-2 text-[12.5px] font-medium text-ink">
                  {m.fullName}
                  {m.isYou && <span className="ml-2 text-[11px] text-ink-3">you</span>}
                  {!m.isActive && (
                    <span className="ml-2 rounded bg-surface-sunken px-1.5 py-0.5 text-[10px] text-ink-3">
                      inactive
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-[12.5px] text-ink-2">{m.email}</td>
                <td className="px-3 py-2">
                  {canManage && !m.isYou ? (
                    <select
                      value={m.role}
                      disabled={busyId === m.id}
                      onChange={(e) => patchMember(m.id, { role: e.target.value })}
                      className="rounded-md border border-hairline bg-surface px-2 py-1 text-[12px] outline-none focus:border-accent disabled:opacity-50"
                    >
                      {ASSIGNABLE_ROLES.map((r) => (
                        <option key={r} value={r}>
                          {ROLE_LABELS[r as Role]}
                        </option>
                      ))}
                      {!(ASSIGNABLE_ROLES as readonly string[]).includes(
                        m.role,
                      ) && <option value={m.role}>{m.roleLabel}</option>}
                    </select>
                  ) : (
                    <span className="text-[12.5px] text-ink-2">{m.roleLabel}</span>
                  )}
                </td>
                {canManage && (
                  <td className="px-2 py-1.5">
                    {!m.isYou && (
                      <div className="opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                        {m.isActive ? (
                          <ConfirmButton
                            label="Deactivate member"
                            question="Deactivate?"
                            confirmLabel="Deactivate"
                            onConfirm={() => patchMember(m.id, { isActive: false })}
                          >
                            <Trash2 size={13} />
                          </ConfirmButton>
                        ) : (
                          <button
                            onClick={() => patchMember(m.id, { isActive: true })}
                            className="text-[11px] font-medium text-accent-strong hover:underline"
                          >
                            Reactivate
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {invites.length > 0 && (
        <div className="border-t border-hairline px-5 py-3">
          <p className="eyebrow mb-2">Pending invites</p>
          <ul className="space-y-1.5">
            {invites.map((inv) => (
              <li
                key={inv.id}
                className="flex items-center gap-2 text-[12.5px]"
              >
                <span className="text-ink-2">{inv.email}</span>
                <span className="text-ink-3">· {inv.roleLabel}</span>
                {canManage && (
                  <span className="ml-auto flex items-center gap-1">
                    <button
                      onClick={() => copyLink(inv.token)}
                      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-ink-3 hover:bg-surface-sunken hover:text-ink-2"
                    >
                      <Copy size={11} /> link
                    </button>
                    <ConfirmButton
                      label="Revoke invite"
                      question="Revoke?"
                      confirmLabel="Revoke"
                      onConfirm={() => revokeInvite(inv.id)}
                    >
                      <Trash2 size={12} />
                    </ConfirmButton>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
