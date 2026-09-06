"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart2,
  Briefcase,
  Clock,
  DollarSign,
  FileText,
  PieChart,
  Settings,
  Users,
} from "react-feather";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart2 },
  { href: "/projects", label: "Projects", icon: Briefcase },
  { href: "/time", label: "Time Tracking", icon: Clock },
  { href: "/expenses", label: "Expenses", icon: DollarSign },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/analytics", label: "Analytics", icon: PieChart },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-10 flex h-screen w-[260px] flex-col border-r border-border bg-white px-4 py-6">
      <Link href="/dashboard" className="mb-8 flex items-center gap-3 px-2">
        <span className="grid h-8 w-8 place-items-center rounded-[var(--radius-sm)] bg-accent text-sm font-bold text-white">
          A
        </span>
        <span className="text-base font-semibold text-text-primary">
          Agency Pro
        </span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-white"
                  : "text-text-secondary hover:bg-bg-alt",
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
