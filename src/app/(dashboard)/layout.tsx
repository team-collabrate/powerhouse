import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const configured =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let user: { email?: string } | null = null;
  if (configured) {
    const supabase = await createClient();
    ({
      data: { user },
    } = await supabase.auth.getUser());
    if (!user) redirect("/login");
  }

  return (
    <div className="min-h-screen bg-bg-page">
      <Sidebar />
      <div className="pl-[260px]">
        <Header userEmail={user?.email} />
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
