"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Edit2, RotateCcw, UserX } from "react-feather";
import { ClientDialog } from "./ClientDialog";
import { useCan } from "@/components/providers/SessionProvider";
import type { ClientDetail } from "@/lib/queries/clients";

const btn =
  "inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-sm)] border border-hairline-strong bg-surface px-3.5 text-[13px] font-medium text-ink transition-colors hover:bg-surface-sunken disabled:opacity-50";

export function ClientActions({ client }: { client: ClientDetail }) {
  const router = useRouter();
  const canWrite = useCan("client:write");
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);

  if (!canWrite) return null;

  async function setActive(isActive: boolean) {
    setBusy(true);
    const res = await fetch(`/api/clients/${client.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    });
    setBusy(false);
    setConfirming(false);
    if (res.ok) router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <ClientDialog
        client={client}
        trigger={(open) => (
          <button className={btn} onClick={open}>
            <Edit2 size={14} />
            Edit
          </button>
        )}
      />

      {client.isActive ? (
        confirming ? (
          <span className="inline-flex items-center gap-2 text-[13px]">
            <span className="text-ink-2">Deactivate {client.companyName}?</span>
            <button
              onClick={() => setActive(false)}
              disabled={busy}
              className="inline-flex h-9 items-center rounded-[var(--radius-sm)] bg-loss px-3 text-[13px] font-medium text-white disabled:opacity-50"
            >
              {busy ? "…" : "Deactivate"}
            </button>
            <button onClick={() => setConfirming(false)} className={btn}>
              Keep
            </button>
          </span>
        ) : (
          <button className={btn} onClick={() => setConfirming(true)}>
            <UserX size={14} />
            Deactivate
          </button>
        )
      ) : (
        <button
          className={btn}
          disabled={busy}
          onClick={() => setActive(true)}
        >
          <RotateCcw size={14} />
          Reactivate
        </button>
      )}
    </div>
  );
}
