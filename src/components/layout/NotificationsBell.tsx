"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Bell, Clock, TrendingDown } from "react-feather";
import type {
  NotificationItem,
  NotificationsData,
} from "@/lib/queries/notifications";

const iconFor = {
  overdue: AlertTriangle,
  due_soon: Clock,
  under_margin: TrendingDown,
  past_deadline: Clock,
} as const;

export function NotificationsBell({ data }: { data: NotificationsData }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        aria-label={`Notifications${data.count ? ` (${data.count})` : ""}`}
        onClick={() => setOpen((o) => !o)}
        className="relative grid h-9 w-9 place-items-center rounded-[var(--radius-sm)] border border-hairline bg-surface text-ink-2 transition-colors hover:bg-surface-sunken"
      >
        <Bell size={16} />
        {data.count > 0 && (
          <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-loss px-1 text-[10px] font-semibold leading-none text-white">
            {data.count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-30 w-[340px] overflow-hidden rounded-[var(--radius-md)] border border-hairline bg-surface shadow-[var(--shadow-pop)]">
          <div className="border-b border-hairline px-4 py-2.5 text-[12px] font-semibold text-ink-3">
            Needs attention
          </div>
          {data.items.length === 0 ? (
            <p className="px-4 py-8 text-center text-[12.5px] text-ink-3">
              You&apos;re all caught up.
            </p>
          ) : (
            <ul className="max-h-[380px] overflow-y-auto">
              {data.items.map((n: NotificationItem) => {
                const Icon = iconFor[n.kind];
                return (
                  <li key={n.id} className="border-b border-hairline last:border-0">
                    <Link
                      href={n.href}
                      onClick={() => setOpen(false)}
                      className="flex gap-3 px-4 py-3 hover:bg-surface-sunken"
                    >
                      <Icon
                        size={15}
                        className={
                          n.severity === "high"
                            ? "mt-0.5 shrink-0 text-loss"
                            : "mt-0.5 shrink-0 text-ink-3"
                        }
                      />
                      <span className="min-w-0">
                        <span className="block text-[12.5px] font-medium text-ink">
                          {n.title}
                        </span>
                        <span className="block truncate text-[11.5px] text-ink-3">
                          {n.detail}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
