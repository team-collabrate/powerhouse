"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "react-feather";
import { cn } from "@/lib/utils";
import type { InvoiceStatus } from "@/lib/queries/invoices";

const TABS: { key: "all" | InvoiceStatus; label: string }[] = [
  { key: "all", label: "All" },
  { key: "draft", label: "Draft" },
  { key: "sent", label: "Sent" },
  { key: "partial", label: "Partial" },
  { key: "overdue", label: "Overdue" },
  { key: "paid", label: "Paid" },
  { key: "cancelled", label: "Cancelled" },
];

export function InvoicesFilters({
  counts,
}: {
  counts: Record<"all" | InvoiceStatus, number>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [, startTransition] = useTransition();
  const activeStatus = params.get("status") ?? "all";
  const [q, setQ] = useState(params.get("q") ?? "");

  function push(next: URLSearchParams) {
    startTransition(() => {
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    });
  }
  function setStatus(key: string) {
    const next = new URLSearchParams(params);
    if (key === "all") next.delete("status");
    else next.set("status", key);
    push(next);
  }

  useEffect(() => {
    const t = setTimeout(() => {
      const next = new URLSearchParams(params);
      if (q.trim()) next.set("q", q.trim());
      else next.delete("q");
      if (next.toString() !== params.toString()) push(next);
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-1 rounded-[var(--radius-sm)] border border-hairline bg-surface p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setStatus(t.key)}
            className={cn(
              "rounded-md px-2.5 py-1 text-[12.5px] font-medium transition-colors",
              activeStatus === t.key
                ? "bg-surface-sunken text-ink"
                : "text-ink-3 hover:text-ink-2",
            )}
          >
            {t.label}
            <span className="ml-1.5 text-ink-3">{counts[t.key]}</span>
          </button>
        ))}
      </div>

      <div className="relative flex items-center">
        <Search size={15} className="pointer-events-none absolute left-3 text-ink-3" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search invoice #, client, project…"
          className="h-9 w-[240px] rounded-[var(--radius-sm)] border border-hairline bg-surface pl-9 pr-3 text-[13px] outline-none transition-colors placeholder:text-ink-3 focus:border-accent"
        />
      </div>
    </div>
  );
}
