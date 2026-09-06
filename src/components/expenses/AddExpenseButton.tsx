"use client";

import { Plus } from "react-feather";
import { ExpenseDialog } from "./ExpenseDialog";

export function AddExpenseButton({
  projects,
}: {
  projects: { id: string; name: string }[];
}) {
  return (
    <ExpenseDialog
      projects={projects}
      trigger={(open) => (
        <button
          onClick={open}
          className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-sm)] bg-accent px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-accent-strong"
        >
          <Plus size={15} />
          Add expense
        </button>
      )}
    />
  );
}
