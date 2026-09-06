"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Archive } from "react-feather";
import { useCan } from "@/components/providers/SessionProvider";

export function CloseProjectButton({
  id,
  name,
  status,
}: {
  id: string;
  name: string;
  status: string;
}) {
  const router = useRouter();
  const canWrite = useCan("project:write");
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!canWrite || status === "closed") return null;

  async function close() {
    setBusy(true);
    const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
    setBusy(false);
    if (res.ok) {
      router.refresh();
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <span className="inline-flex items-center gap-2 text-[13px]">
        <span className="text-ink-2">Close “{name}”?</span>
        <button
          onClick={close}
          disabled={busy}
          className="inline-flex h-9 items-center rounded-[var(--radius-sm)] bg-loss px-3 text-[13px] font-medium text-white disabled:opacity-50"
        >
          {busy ? "Closing…" : "Close project"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="inline-flex h-9 items-center rounded-[var(--radius-sm)] border border-hairline-strong bg-surface px-3 text-[13px] font-medium text-ink hover:bg-surface-sunken"
        >
          Cancel
        </button>
      </span>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-sm)] border border-hairline-strong bg-surface px-3.5 text-[13px] font-medium text-ink-2 transition-colors hover:bg-surface-sunken"
    >
      <Archive size={14} />
      Close
    </button>
  );
}
