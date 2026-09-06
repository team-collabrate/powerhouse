"use client";

import { useRouter } from "next/navigation";
import { Bell, LogOut, Search } from "react-feather";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

export function Header({ userEmail }: { userEmail?: string | null }) {
  const router = useRouter();

  async function signOut() {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-[5] flex h-14 items-center justify-between border-b border-border bg-white px-8">
      <div className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-bg-alt px-3 py-2">
        <Search size={16} className="text-text-muted" />
        <input
          type="search"
          placeholder="Search…"
          className="w-[240px] bg-transparent text-sm outline-none placeholder:text-text-muted"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          aria-label="Notifications"
          className="grid h-10 w-10 place-items-center rounded-[var(--radius-sm)] bg-bg-alt text-text-secondary hover:bg-border"
        >
          <Bell size={18} />
        </button>
        {userEmail && (
          <span className="hidden text-sm text-text-secondary sm:inline">
            {userEmail}
          </span>
        )}
        <Button variant="secondary" onClick={signOut}>
          <LogOut size={16} />
          Sign out
        </Button>
      </div>
    </header>
  );
}
