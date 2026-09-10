import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api";
import { profitabilityCsv } from "@/lib/queries/analytics";
import { getReport } from "@/lib/queries/report";
import { parsePeriodParams } from "@/lib/period-params";

export async function GET(request: Request) {
  const auth = await requireSession();
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const period = parsePeriodParams(Object.fromEntries(searchParams));
  const { profitability } = await getReport(auth.agencyId, period);
  const csv = profitabilityCsv(profitability);
  const date = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="profitability-${date}.csv"`,
    },
  });
}
