"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/Select";
import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS,
} from "@/lib/queries/expenses";

export function ExpensesFilters({
  projects,
}: {
  projects: { id: string; name: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  function update(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    startTransition(() => {
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <div className="w-[220px]">
        <Select
          value={params.get("projectId") ?? ""}
          onChange={(e) => update("projectId", e.target.value)}
          className="h-9 text-[13px]"
        >
          <option value="">All projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="w-[160px]">
        <Select
          value={params.get("category") ?? ""}
          onChange={(e) => update("category", e.target.value)}
          className="h-9 text-[13px]"
        >
          <option value="">All categories</option>
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {EXPENSE_CATEGORY_LABELS[c]}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
