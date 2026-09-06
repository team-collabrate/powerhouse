"use client";

import { useRouter } from "next/navigation";
import { Edit2, Plus, Trash2 } from "react-feather";
import { Card } from "@/components/dashboard/Card";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { CompanyExpenseDialog } from "./CompanyExpenseDialog";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  COMPANY_EXPENSE_CATEGORY_LABELS,
  type CompanyExpenseCategory,
  type CompanyExpenseListResult,
} from "@/lib/queries/settings";

export function CompanyExpensesCard({
  data,
}: {
  data: CompanyExpenseListResult;
}) {
  const router = useRouter();

  async function remove(id: string) {
    await fetch(`/api/company-expenses/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <Card>
      <header className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5">
        <div>
          <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">
            Company overhead
          </h3>
          <p className="mt-0.5 text-[13px] text-ink-3">
            <span className="tnum">{formatCurrency(data.monthlyRecurring)}</span>
            /mo recurring
            {data.lastMonthTotal > 0 && (
              <>
                {" · "}
                <span className="tnum">
                  {formatCurrency(data.lastMonthTotal)}
                </span>{" "}
                booked last month
              </>
            )}
          </p>
        </div>
        <CompanyExpenseDialog
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
      </header>

      {data.items.length === 0 ? (
        <p className="px-5 py-8 text-center text-[13px] text-ink-3">
          No overhead recorded yet.
        </p>
      ) : (
        <div className="overflow-x-auto px-2 pb-3 pt-2">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {["Description", "Category", "Date", "Amount"].map((h) => (
                  <th
                    key={h}
                    className="eyebrow px-3 pb-2 pt-1 text-left font-semibold"
                  >
                    {h}
                  </th>
                ))}
                <th className="w-16" />
              </tr>
            </thead>
            <tbody>
              {data.items.map((e) => (
                <tr key={e.id} className="group border-t border-hairline">
                  <td className="px-3 py-2 text-[12.5px] text-ink">
                    {e.description}
                    {e.isRecurring && (
                      <span className="ml-2 rounded bg-surface-sunken px-1.5 py-0.5 text-[10px] text-ink-3">
                        {e.recurringFrequency}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-[12.5px] text-ink-2">
                    {COMPANY_EXPENSE_CATEGORY_LABELS[
                      e.category as CompanyExpenseCategory
                    ] ?? e.category}
                  </td>
                  <td className="tnum px-3 py-2 text-[12.5px] text-ink-2">
                    {formatDate(e.dateIncurred)}
                  </td>
                  <td className="tnum px-3 py-2 text-[12.5px] font-medium text-ink">
                    {formatCurrency(e.amount)}
                  </td>
                  <td className="px-2 py-1.5">
                    <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                      <CompanyExpenseDialog
                        expense={e}
                        trigger={(open) => (
                          <button
                            onClick={open}
                            aria-label="Edit overhead"
                            className="grid h-7 w-7 place-items-center rounded-md text-ink-3 hover:bg-surface-sunken hover:text-ink-2"
                          >
                            <Edit2 size={13} />
                          </button>
                        )}
                      />
                      <ConfirmButton
                        label="Delete overhead"
                        question="Delete?"
                        confirmLabel="Delete"
                        onConfirm={() => remove(e.id)}
                      >
                        <Trash2 size={13} />
                      </ConfirmButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
