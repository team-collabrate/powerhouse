"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "react-feather";
import { cn } from "@/lib/utils";
import { NAV } from "./nav-items";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <button
        aria-label="Open menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="grid h-9 w-9 place-items-center rounded-[var(--radius-sm)] border border-hairline bg-surface text-ink-2 lg:hidden"
      >
        <Menu size={18} />
      </button>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            aria-label="Close menu"
            className="absolute inset-0 bg-ink/25"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-0 flex h-full w-[264px] flex-col bg-surface px-3 py-4 shadow-[var(--shadow-pop)]">
            <div className="flex items-center justify-between px-2 py-1">
              <span className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-[var(--radius-xs)] bg-accent text-[15px] font-bold text-white">
                  A
                </span>
                <span className="text-[15px] font-semibold text-ink">
                  Agency&nbsp;Pro
                </span>
              </span>
              <button
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className="grid h-7 w-7 place-items-center rounded-md text-ink-3 hover:bg-surface-sunken"
              >
                <X size={16} />
              </button>
            </div>

            <nav className="mt-5 flex flex-col gap-0.5">
              {NAV.map(({ href, label, icon: Icon }) => {
                const active =
                  pathname === href || pathname.startsWith(`${href}/`);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-[14px] font-medium",
                      active
                        ? "bg-surface-sunken text-ink"
                        : "text-ink-2 hover:bg-surface-sunken",
                    )}
                  >
                    <Icon
                      size={18}
                      className={active ? "text-accent" : "text-ink-3"}
                    />
                    {label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
