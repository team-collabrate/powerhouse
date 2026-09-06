import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api";
import { getAnalytics, profitabilityCsv } from "@/lib/queries/analytics";

export async function GET() {
  const auth = await requireSession();
  if (auth instanceof NextResponse) return auth;

  const { projects } = await getAnalytics(auth.agencyId, 6);
  const csv = profitabilityCsv(projects);
  const date = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="profitability-${date}.csv"`,
    },
  });
}
