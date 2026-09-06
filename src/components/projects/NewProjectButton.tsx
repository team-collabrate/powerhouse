"use client";

import { Plus } from "react-feather";
import { ProjectDialog } from "./ProjectDialog";

export function NewProjectButton({
  variant = "primary",
}: {
  variant?: "primary" | "secondary";
}) {
  return (
    <ProjectDialog
      trigger={(open) => (
        <button
          onClick={open}
          className={
            variant === "primary"
              ? "inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-sm)] bg-accent px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-accent-strong"
              : "inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-sm)] border border-hairline-strong bg-surface px-3.5 text-[13px] font-medium text-ink transition-colors hover:bg-surface-sunken"
          }
        >
          <Plus size={15} />
          New Project
        </button>
      )}
    />
  );
}
