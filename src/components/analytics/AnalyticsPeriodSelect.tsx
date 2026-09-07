"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { ANALYTICS_PERIODS } from "@/lib/queries/analytics-shared";

export function AnalyticsPeriodSelect({ current }: { current: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  function pick(months: number) {
    const next = new URLSearchParams(params);
    if (months === 6) next.delete("months");
    else next.set("months", String(months));
    startTransition(() => {
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    });
  }

  return (
    <div className="flex items-center gap-1 rounded-[var(--radius-sm)] border border-hairline bg-surface p-1">
      {ANALYTICS_PERIODS.map((m) => (
        <button
          key={m}
          onClick={() => pick(m)}
          className={cn(
            "rounded-md px-2.5 py-1 text-[12.5px] font-medium transition-colors",
            current === m
              ? "bg-surface-sunken text-ink"
              : "text-ink-3 hover:text-ink-2",
          )}
        >
          {m}m
        </button>
      ))}
    </div>
  );
}
