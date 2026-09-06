import { getSessionContext } from "@/lib/session";
import { listExpenses, type ExpenseCategory } from "@/lib/queries/expenses";
import { formatCurrency } from "@/lib/format";
import { ExpensesFilters } from "@/components/expenses/ExpensesFilters";
import { ExpensesTable } from "@/components/expenses/ExpensesTable";
import { AddExpenseButton } from "@/components/expenses/AddExpenseButton";

export const dynamic = "force-dynamic";

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string; category?: string }>;
}) {
  const ctx = await getSessionContext();
  if (!ctx) {
    return (
      <div className="rounded-[var(--radius-md)] border border-hairline bg-surface-raised p-10 text-center">
        <p className="text-[13px] font-medium text-ink">
          Connect a database to track expenses
        </p>
        <p className="mt-1 text-[13px] text-ink-3">
          Set your Supabase env vars and sign in.
        </p>
      </div>
    );
  }

  const sp = await searchParams;
  const { items, total, projects } = await listExpenses(ctx.agencyId, {
    projectId: sp.projectId,
    category: sp.category as ExpenseCategory | undefined,
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-ink">
            Expenses
          </h2>
          <p className="mt-1 text-[13px] text-ink-3">
            {items.length} {items.length === 1 ? "item" : "items"} ·{" "}
            <span className="tnum">{formatCurrency(total)}</span> total
          </p>
        </div>
        <AddExpenseButton projects={projects} />
      </div>

      <ExpensesFilters projects={projects} />
      <ExpensesTable items={items} projects={projects} />
    </div>
  );
}
