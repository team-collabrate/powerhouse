"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "react-feather";

export function ClientsFilters({ inactiveCount }: { inactiveCount: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [, startTransition] = useTransition();
  const [q, setQ] = useState(params.get("q") ?? "");
  const showInactive = params.get("inactive") === "1";

  function push(next: URLSearchParams) {
    startTransition(() => {
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    });
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

  function toggleInactive() {
    const next = new URLSearchParams(params);
    if (showInactive) next.delete("inactive");
    else next.set("inactive", "1");
    push(next);
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <label className="flex items-center gap-2 text-[13px] text-ink-2">
        <input
          type="checkbox"
          checked={showInactive}
          onChange={toggleInactive}
          className="h-4 w-4 rounded border-hairline-strong accent-[var(--accent)]"
        />
        Show inactive
        {inactiveCount > 0 && (
          <span className="text-ink-3">({inactiveCount})</span>
        )}
      </label>

      <div className="relative flex items-center">
        <Search size={15} className="pointer-events-none absolute left-3 text-ink-3" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search clients…"
          className="h-9 w-[240px] rounded-[var(--radius-sm)] border border-hairline bg-surface pl-9 pr-3 text-[13px] outline-none transition-colors placeholder:text-ink-3 focus:border-accent"
        />
      </div>
    </div>
  );
}
