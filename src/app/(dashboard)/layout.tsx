import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/session";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const configured =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let user: { email?: string } | null = null;
  let role = "admin"; // demo mode
  let fullName = "Demo User";

  if (configured) {
    const supabase = await createClient();
    ({
      data: { user },
    } = await supabase.auth.getUser());
    if (!user) redirect("/login");
    const ctx = await getSessionContext();
    role = ctx?.role ?? "client";
    fullName = ctx?.fullName ?? user.email ?? "Account";
  }

  return (
    <SessionProvider role={role}>
      <div className="min-h-screen bg-surface-sunken">
        <Sidebar name={fullName} role={role} />
        <div className="lg:pl-[248px]">
          <Header userEmail={user?.email} />
          <main className="mx-auto max-w-[1400px] px-4 py-5 sm:px-6 sm:py-6">
            {role === "client" ? (
              <div className="rounded-[var(--radius-md)] border border-hairline bg-surface-raised p-10 text-center">
                <p className="text-[14px] font-medium text-ink">
                  This area is for agency staff
                </p>
                <p className="mx-auto mt-1 max-w-sm text-[13px] text-ink-3">
                  Your account is a client account. Use the portal link your
                  agency shared with you to view your projects and invoices.
                </p>
              </div>
            ) : (
              children
            )}
          </main>
        </div>
      </div>
    </SessionProvider>
  );
}
