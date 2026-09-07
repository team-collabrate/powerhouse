"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Edit2, Plus, Trash2 } from "react-feather";
import { Card } from "@/components/dashboard/Card";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { MilestoneDialog } from "./MilestoneDialog";
import { useCan } from "@/components/providers/SessionProvider";
import { formatDate } from "@/lib/format";
import {
  MILESTONE_STATUSES,
  MILESTONE_STATUS_LABELS,
  type MilestoneRow,
} from "@/lib/queries/milestones";

const dotClass: Record<string, string> = {
  pending: "bg-ink-3",
  in_progress: "bg-accent",
  completed: "bg-profit",
};

export function MilestonesCard({
  projectId,
  milestones,
}: {
  projectId: string;
  milestones: MilestoneRow[];
}) {
  const router = useRouter();
  const canWrite = useCan("project:write");
  const [busyId, setBusyId] = useState<string | null>(null);

  const done = milestones.filter((m) => m.status === "completed").length;

  async function setStatus(id: string, status: string) {
    setBusyId(id);
    await fetch(`/api/milestones/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setBusyId(null);
    router.refresh();
  }

  async function remove(id: string) {
    await fetch(`/api/milestones/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <Card>
      <header className="flex items-center justify-between px-5 pt-5">
        <div>
          <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">
            Milestones
          </h3>
          <p className="mt-0.5 text-[13px] text-ink-3">
            {milestones.length === 0
              ? "None yet"
              : `${done} of ${milestones.length} complete`}
          </p>
        </div>
        {canWrite && (
          <MilestoneDialog
            projectId={projectId}
            trigger={(open) => (
              <button
                onClick={open}
                className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-sm)] border border-hairline-strong bg-surface px-3 text-[12.5px] font-medium text-ink hover:bg-surface-sunken"
              >
                <Plus size={14} />
                Add
              </button>
            )}
          />
        )}
      </header>

      {milestones.length === 0 ? (
        <p className="px-5 py-8 text-center text-[13px] text-ink-3">
          No milestones.
        </p>
      ) : (
        <ul className="px-3 py-2">
          {milestones.map((m) => (
            <li
              key={m.id}
              className="group flex items-center gap-3 border-t border-hairline px-2 py-2.5 first:border-t-0"
            >
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotClass[m.status] ?? "bg-ink-3"}`}
              />
              <div className="min-w-0 flex-1">
                <p
                  className={`truncate text-[12.5px] font-medium ${m.status === "completed" ? "text-ink-3 line-through" : "text-ink"}`}
                >
                  {m.name}
                </p>
                {m.description && (
                  <p className="truncate text-[11px] text-ink-3">
                    {m.description}
                  </p>
                )}
              </div>
              <span className="tnum shrink-0 text-[11px] text-ink-3">
                {formatDate(m.dueDate)}
              </span>
              {canWrite ? (
                <select
                  value={m.status}
                  disabled={busyId === m.id}
                  onChange={(e) => setStatus(m.id, e.target.value)}
                  className="shrink-0 rounded-md border border-hairline bg-surface px-1.5 py-1 text-[11px] outline-none focus:border-accent disabled:opacity-50"
                >
                  {MILESTONE_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {MILESTONE_STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="shrink-0 text-[11px] capitalize text-ink-3">
                  {MILESTONE_STATUS_LABELS[m.status]}
                </span>
              )}
              {canWrite && (
                <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                  <MilestoneDialog
                    projectId={projectId}
                    milestone={m}
                    trigger={(open) => (
                      <button
                        onClick={open}
                        aria-label="Edit milestone"
                        className="grid h-7 w-7 place-items-center rounded-md text-ink-3 hover:bg-surface-sunken hover:text-ink-2"
                      >
                        <Edit2 size={13} />
                      </button>
                    )}
                  />
                  <ConfirmButton
                    label="Delete milestone"
                    question="Delete?"
                    confirmLabel="Delete"
                    onConfirm={() => remove(m.id)}
                  >
                    <Trash2 size={13} />
                  </ConfirmButton>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
