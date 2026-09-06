"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export function ConfirmButton({
  onConfirm,
  label,
  confirmLabel = "Confirm",
  question = "Are you sure?",
  className,
  children,
}: {
  onConfirm: () => Promise<void> | void;
  label: string;
  confirmLabel?: string;
  question?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  if (confirming) {
    return (
      <span className="inline-flex items-center gap-2 text-[12px] whitespace-nowrap">
        <span className="text-ink-2">{question}</span>
        <button
          onClick={async () => {
            setBusy(true);
            await onConfirm();
            setBusy(false);
            setConfirming(false);
          }}
          disabled={busy}
          className="font-medium text-loss hover:underline disabled:opacity-50"
        >
          {busy ? "…" : confirmLabel}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-ink-3 hover:underline"
        >
          Cancel
        </button>
      </span>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      aria-label={label}
      className={cn(
        "grid h-7 w-7 place-items-center rounded-md text-ink-3 transition-colors hover:bg-surface-sunken hover:text-loss",
        className,
      )}
    >
      {children}
    </button>
  );
}
