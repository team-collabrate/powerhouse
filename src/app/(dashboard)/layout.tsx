import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { getSessionContext } from "@/lib/session";
import { getNotifications } from "@/lib/queries/notifications";
import type { NotificationsData } from "@/lib/queries/notifications";
import { getAgencyBranding } from "@/lib/queries/agency-branding";
import { deriveAccentPalette } from "@/lib/color";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const configured =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let role = "admin"; // demo mode
  let fullName = "Demo User";
  let email: string | undefined;
  let notifications: NotificationsData = { items: [], count: 0 };
  let agencyName = "Powerhouse";
  let agencyLogoUrl: string | null = null;
  let accentStyle = "";

  if (configured) {
    const ctx = await getSessionContext();
    if (!ctx) redirect("/login");
    role = ctx.role;
    fullName = ctx.fullName;
    email = ctx.email;
    if (role !== "client") {
      notifications = await getNotifications(ctx.agencyId).catch(() => ({
        items: [],
        count: 0,
      }));
    }
    const branding = await getAgencyBranding(ctx.agencyId).catch(() => null);
    if (branding) {
      agencyName = branding.name || agencyName;
      agencyLogoUrl = branding.logoUrl;
      // brandColor is a per-agency <input type="color"> value, not our own
      // design-token purple: derive a legible accent/hover/tint triad from
      // whatever they picked (falls back to Powerhouse's purple if unset).
      const { accent, accentStrong, accentSoft } = deriveAccentPalette(
        branding.brandColor,
      );
      accentStyle = `:root{--accent:${accent};--accent-strong:${accentStrong};--accent-soft:${accentSoft};}`;
    }
  }

  return (
    <SessionProvider role={role}>
      {accentStyle && <style dangerouslySetInnerHTML={{ __html: accentStyle }} />}
      <div className="min-h-screen bg-surface-sunken">
        <Sidebar name={fullName} role={role} agencyName={agencyName} agencyLogoUrl={agencyLogoUrl} />
        <div className="lg:pl-[248px]">
          <Header userEmail={email} notifications={notifications} />
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
