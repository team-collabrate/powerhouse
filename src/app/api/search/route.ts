import { NextResponse } from "next/server";
import { ok, requireSession } from "@/lib/api";
import { searchAgency } from "@/lib/queries/search";

export async function GET(request: Request) {
  const auth = await requireSession();
  if (auth instanceof NextResponse) return auth;

  const q = new URL(request.url).searchParams.get("q") ?? "";
  const results = await searchAgency(auth.agencyId, q);
  return ok(results);
}
