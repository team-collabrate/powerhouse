"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsLeft, ChevronDown } from "react-feather";
import { cn } from "@/lib/utils";
import { NAV } from "./nav-items";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-20 hidden h-screen w-[248px] flex-col bg-surface-sunken px-3 py-4 lg:flex">
      <div className="flex items-center justify-between px-2 py-1">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-[var(--radius-xs)] bg-accent text-[15px] font-bold text-white">
            P
          </span>
          <span className="text-[15px] font-semibold tracking-[0.02em] text-ink">
            POWERHOUSE
          </span>
        </Link>
        <button
          aria-label="Collapse sidebar"
          className="grid h-7 w-7 place-items-center rounded-md text-ink-3 hover:bg-surface hover:text-ink-2"
        >
          <ChevronsLeft size={16} />
        </button>
      </div>

      <nav className="mt-5 flex flex-1 flex-col gap-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2 text-[13.5px] font-medium transition-colors",
                active
                  ? "bg-surface text-ink shadow-[var(--shadow-nav)]"
                  : "text-ink-2 hover:bg-surface/70 hover:text-ink",
              )}
            >
              <Icon
                size={17}
                className={active ? "text-accent" : "text-ink-3"}
                strokeWidth={2}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      <button className="mt-3 flex items-center gap-2.5 rounded-[var(--radius-sm)] px-2 py-2 text-left transition-colors hover:bg-surface/70">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent-soft text-[12px] font-semibold text-accent-strong">
          BF
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-medium text-ink">
            Bella Ford
          </span>
          <span className="block text-[11px] text-ink-3">Pro Plan</span>
        </span>
        <ChevronDown size={15} className="text-ink-3" />
      </button>
    </aside>
  );
}
