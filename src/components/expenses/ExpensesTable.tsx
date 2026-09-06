"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Edit2, Trash2 } from "react-feather";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { ExpenseDialog } from "./ExpenseDialog";
import { useCan } from "@/components/providers/SessionProvider";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  EXPENSE_CATEGORY_LABELS,
  type ExpenseCategory,
  type ExpenseRow,
} from "@/lib/queries/expenses";

export function ExpensesTable({
  items,
  projects,
}: {
  items: ExpenseRow[];
  projects: { id: string; name: string }[];
}) {
  const router = useRouter();
  const canWrite = useCan("expense:write");

  async function remove(id: string) {
    await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    router.refresh();
  }

  if (items.length === 0) {
    return (
      <div className="rounded-[var(--radius-md)] border border-hairline bg-surface-raised p-10 text-center">
        <p className="text-[13px] font-medium text-ink">No expenses</p>
        <p className="mt-1 text-[13px] text-ink-3">
          Add one, or clear the filters.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-[var(--radius-md)] border border-hairline bg-surface-raised">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-hairline text-left">
            {["Description", "Project", "Category", "Date", "Amount"].map((h) => (
              <th key={h} className="eyebrow px-4 py-2.5 font-semibold">
                {h}
              </th>
            ))}
            {canWrite && <th className="w-16" />}
          </tr>
        </thead>
        <tbody>
          {items.map((e) => (
            <tr
              key={e.id}
              className="group border-b border-hairline last:border-0"
            >
              <td className="px-4 py-2.5 text-[13px] text-ink">
                {e.description}
              </td>
              <td className="px-4 py-2.5 text-[13px] text-ink-2">
                <Link
                  href={`/projects/${e.projectId}`}
                  className="hover:text-accent-strong"
                >
                  {e.projectName}
                </Link>
              </td>
              <td className="px-4 py-2.5 text-[13px] text-ink-2">
                {EXPENSE_CATEGORY_LABELS[e.category as ExpenseCategory] ??
                  e.category}
              </td>
              <td className="tnum px-4 py-2.5 text-[13px] text-ink-2">
                {formatDate(e.dateIncurred)}
              </td>
              <td className="tnum px-4 py-2.5 text-[13px] font-medium text-ink">
                {formatCurrency(e.amount)}
              </td>
              {canWrite && (
                <td className="px-2 py-1.5">
                  <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                    <ExpenseDialog
                      expense={e}
                      projects={projects}
                      trigger={(open) => (
                        <button
                          onClick={open}
                          aria-label="Edit expense"
                          className="grid h-7 w-7 place-items-center rounded-md text-ink-3 hover:bg-surface-sunken hover:text-ink-2"
                        >
                          <Edit2 size={13} />
                        </button>
                      )}
                    />
                    <ConfirmButton
                      label="Delete expense"
                      question="Delete?"
                      confirmLabel="Delete"
                      onConfirm={() => remove(e.id)}
                    >
                      <Trash2 size={13} />
                    </ConfirmButton>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
