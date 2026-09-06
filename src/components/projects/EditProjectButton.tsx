"use client";

import { Edit2 } from "react-feather";
import { ProjectDialog } from "./ProjectDialog";
import type { ProjectDetail } from "@/lib/queries/projects";

export function EditProjectButton({ project }: { project: ProjectDetail }) {
  return (
    <ProjectDialog
      project={project}
      trigger={(open) => (
        <button
          onClick={open}
          className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-sm)] border border-hairline-strong bg-surface px-3.5 text-[13px] font-medium text-ink transition-colors hover:bg-surface-sunken"
        >
          <Edit2 size={14} />
          Edit
        </button>
      )}
    />
  );
}
