"use client";

import { useRouter } from "next/navigation";
import { Bell, LogOut, Search } from "react-feather";
import { createClient } from "@/lib/supabase/client";
import { MobileNav } from "./MobileNav";

export function Header({ userEmail }: { userEmail?: string | null }) {
  const router = useRouter();

  async function signOut() {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      await createClient().auth.signOut();
    }
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-10 flex h-[60px] items-center gap-3 border-b border-hairline bg-surface-sunken/80 px-4 backdrop-blur-sm sm:gap-4 sm:px-6">
      <MobileNav />
      <h1 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">
        Dashboard
      </h1>

      <div className="relative ml-2 hidden max-w-[320px] flex-1 items-center md:flex">
        <Search
          size={15}
          className="pointer-events-none absolute left-3 text-ink-3"
        />
        <input
          type="search"
          placeholder="Search projects, clients, invoices…"
          className="h-9 w-full rounded-[var(--radius-sm)] border border-hairline bg-surface pl-9 pr-3 text-[13px] outline-none transition-colors placeholder:text-ink-3 focus:border-accent"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button
          aria-label="Notifications"
          className="relative grid h-9 w-9 place-items-center rounded-[var(--radius-sm)] border border-hairline bg-surface text-ink-2 transition-colors hover:bg-surface-sunken"
        >
          <Bell size={16} />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-accent" />
        </button>

        <button
          onClick={signOut}
          title={userEmail ? `Sign out (${userEmail})` : "Sign out"}
          aria-label="Sign out"
          className="grid h-9 w-9 place-items-center rounded-[var(--radius-sm)] border border-hairline bg-surface text-ink-2 transition-colors hover:bg-surface-sunken"
        >
          <LogOut size={16} />
        </button>

        <button className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-sm)] bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] px-2.5 text-[13px] font-medium text-white shadow-[var(--shadow-card)] transition-[filter] hover:brightness-[1.04] sm:px-3.5">
          <Sparkle />
          <span className="hidden sm:inline">Get AI Insight</span>
        </button>
      </div>
    </header>
  );
}

function Sparkle() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z"
        fill="currentColor"
      />
      <path
        d="M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14z"
        fill="currentColor"
        opacity="0.7"
      />
    </svg>
  );
}
