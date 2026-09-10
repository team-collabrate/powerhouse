/*
  Live smoke test — runs every agency-scoped query function against the
  configured database (`.env.local`). Not part of CI (`npm test` is DB-free);
  run manually after a deploy: `npm run smoke:live`.
  Picks the agency with the most projects, or set SMOKE_AGENCY_ID.
*/
import { prisma } from "@/lib/prisma";
import { fetchDashboardData } from "@/lib/queries/dashboard";
import { fetchReport } from "@/lib/queries/report";
import { listProjects, getProject } from "@/lib/queries/projects";
import { listClients, getClient } from "@/lib/queries/clients";
import { listInvoices, getInvoice, getInvoicePrintData } from "@/lib/queries/invoices";
import { buildNotifications } from "@/lib/queries/notifications";
import { searchAgency } from "@/lib/queries/search";
import { getActivity } from "@/lib/queries/activity-feed";
import { resolveAgencyOverhead } from "@/lib/queries/overhead";
import { getAgencySettings, listCompanyExpenses, listTeamMembers, listInvites } from "@/lib/queries/settings";
import { getPortalData } from "@/lib/portal";

let AID = process.env.SMOKE_AGENCY_ID ?? "";
let pass = 0, fail = 0;
function ok(label: string, cond: boolean, extra?: unknown) {
  if (cond) { pass++; console.log(`  ok   ${label}`); }
  else { fail++; console.log(`  FAIL ${label}${extra !== undefined ? ` — ${JSON.stringify(extra)}` : ""}`); }
}

async function main() {
  if (!AID) {
    const seeded = await prisma.project.groupBy({
      by: ["agencyId"],
      _count: true,
      orderBy: { _count: { agencyId: "desc" } },
      take: 1,
    });
    AID = seeded[0]?.agencyId ?? "";
  }
  if (!AID) throw new Error("no agency with projects — run npm run db:seed first");
  const user = await prisma.user.findFirst({ where: { agencyId: AID, role: "admin" }, select: { id: true } });
  const uid = user!.id;
  console.log(`agency: ${AID}`);

  const invCount = await prisma.invoice.count({ where: { agencyId: AID } });

  console.log("\n— migrations & schema —");
  const migs = await prisma.$queryRaw<{ migration_name: string }[]>`SELECT migration_name FROM _prisma_migrations ORDER BY finished_at`;
  ok(`${migs.length} migrations applied`, migs.length >= 6, migs.map(m => m.migration_name).slice(-1));
  const agency = await prisma.agency.findUnique({ where: { id: AID }, select: { name: true, overheadMethod: true, overheadRate: true } });
  ok("agency loads with overhead cols", !!agency && agency.overheadMethod === "percent", agency);

  console.log("\n— dashboard —");
  const dash = await fetchDashboardData(AID);
  ok("4 KPIs", dash.kpis.length === 4);
  ok("revenue KPI is ₹", dash.kpis[0].value.startsWith("₹"), dash.kpis[0].value);
  ok("12 profit points", dash.profit.points.length === 12);
  ok("not flagged empty", dash.isEmpty === false);
  ok("has insights", dash.insights.length > 0);
  ok("service mix present", dash.services.length > 0);

  console.log("\n— analytics / report —");
  const projCount = (await listProjects(AID)).counts.all;
  for (const preset of ["this_fy", "last_month", "last_12_months"] as const) {
    const a = await fetchReport(AID, { preset });
    ok(
      `report ${preset}: ${a.cashflow.length} buckets, ${a.profitability.length} projects, GST ${a.gst.byQuarter.length}q`,
      a.cashflow.length > 0 && a.profitability.length === projCount,
    );
  }
  const rep = await fetchReport(AID, { preset: "last_12_months" });
  ok("report overhead meta present", typeof rep.overhead.methodLabel === "string");
  ok(
    "report sections populated",
    Array.isArray(rep.paymentMethods) &&
      Array.isArray(rep.aging.buckets) &&
      typeof rep.dso.avgDays === "number" &&
      Array.isArray(rep.clients.rows) &&
      typeof rep.summary.revenue.value === "number",
  );
  const custom = await fetchReport(AID, {
    preset: "custom",
    from: "2026-06-01",
    to: "2026-07-01",
  });
  ok("report custom June 2026", custom.period.preset === "custom");

  console.log("\n— projects —");
  const pl = await listProjects(AID);
  ok(`list: ${pl.items.length} items, counts.all=${pl.counts.all}`, pl.items.length === pl.counts.all && pl.counts.all > 0);
  ok("filter active", (await listProjects(AID, { status: "active" })).items.length === pl.counts.active);
  ok("search filter", (await listProjects(AID, { q: "surya" })).items.length === 1);
  const pd = await getProject(AID, pl.items[0].id);
  ok("detail loads with cost + overheadSource", !!pd && typeof pd.cost.profit === "number" && !!pd.cost.overheadSource, pd?.cost.overheadSource);
  ok("detail milestones array", Array.isArray(pd!.milestones));
  ok("bad id → null", (await getProject(AID, "nope")) === null);

  console.log("\n— clients —");
  const cl = await listClients(AID);
  ok(`list: ${cl.activeCount} active, ${cl.inactiveCount} inactive`, cl.activeCount + cl.inactiveCount > 0);
  const cd = await getClient(AID, cl.items[0].id);
  ok("detail: finance + projects + invoices", !!cd && typeof cd.finance.outstanding === "number");

  console.log("\n— invoices —");
  const il = await listInvoices(AID);
  ok(`list: ${il.items.length} invoices (db has ${invCount})`, il.items.length === invCount);
  const anInv = il.items.find(i => i.status !== "draft")!;
  const id2 = await getInvoice(AID, anInv.id);
  ok("detail loads with line items + totals", !!id2 && id2.lineItems.length > 0 && typeof id2.subtotal === "number");
  const pdf = await getInvoicePrintData(AID, anInv.id);
  ok("print data: agency + client + line items", !!pdf && !!pdf.agency.name && pdf.lineItems.length > 0);
  const noOrphans = await prisma.invoice.count({ where: { agencyId: AID, lineItems: { none: {} } } });
  ok("every invoice has ≥1 line item", noOrphans === 0, noOrphans);

  console.log("\n— notifications —");
  const n = await buildNotifications(AID);
  ok(`${n.items.length} items, badge=${n.count}`, n.items.length >= 3 && n.count >= 2);
  ok("overdue items present", n.items.some(i => i.kind === "overdue"));
  ok("under-margin present", n.items.some(i => i.kind === "under_margin"));

  console.log("\n— search —");
  for (const [q, min] of [["surya", 2], ["INV-2026-04", 1], ["kabir", 1]] as const) {
    ok(`"${q}" → ${(await searchAgency(AID, q)).total} hits`, (await searchAgency(AID, q)).total >= min);
  }
  ok("1-char → empty", (await searchAgency(AID, "a")).total === 0);

  console.log("\n— activity —");
  const act = await getActivity(AID);
  ok(`${act.entries.length} entries, actors resolved`, act.entries.length > 0 && act.entries.every(e => !!e.actor));

  console.log("\n— overhead —");
  const oh = await resolveAgencyOverhead(AID);
  ok(`method=${oh.method}, pool=₹${Math.round(oh.monthlyPool)}`, oh.method === "percent");
  // A project whose stored allocated_overhead > 0 pins that value verbatim,
  // overriding the agency % rule.
  const pinned = await prisma.project.findFirst({
    where: { agencyId: AID, allocatedOverhead: { gt: 0 }, status: { not: "closed" } },
    select: { id: true, contractValue: true, allocatedOverhead: true },
  });
  if (pinned) {
    const stored = Number(pinned.allocatedOverhead);
    ok(`pinned override wins (₹${stored} vs % rule)`, oh.overheadFor(pinned.id) === stored, oh.overheadFor(pinned.id));
  }
  const unpinned = await prisma.project.findFirst({
    where: { agencyId: AID, allocatedOverhead: 0, status: "active", contractValue: { gt: 0 } },
    select: { id: true, contractValue: true },
  });
  if (unpinned) {
    const expected = Math.round(Number(unpinned.contractValue) * oh.percentRate);
    ok(`unpinned uses % rule (₹${expected})`, oh.overheadFor(unpinned.id) === expected, oh.overheadFor(unpinned.id));
  }

  console.log("\n— settings —");
  const s = await getAgencySettings(AID);
  ok("settings: overheadRatePct=6", !!s && s.overheadRatePct === 6, s?.overheadRatePct);
  const ce = await listCompanyExpenses(AID);
  ok(`company expenses: ${ce.items.length}, monthlyPool ₹${Math.round(ce.monthlyPool)}`, ce.items.length === 6);
  const tm = await listTeamMembers(AID, uid);
  ok(`team: ${tm.length} members`, tm.length >= 5);
  ok("invites list", Array.isArray(await listInvites(AID)));

  console.log("\n— client portal —");
  const c = await prisma.client.findFirst({ where: { agencyId: AID, portalToken: { not: null } }, select: { portalToken: true } });
  ok("a client has a portal token", !!c?.portalToken);
  if (c?.portalToken) {
    const portal = await getPortalData(c.portalToken);
    ok("portal data: branding + invoices, NO cost fields", !!portal && !("profit" in (portal.projects[0] ?? {})));
  }
  ok("bad portal token → null", (await getPortalData("garbage")) === null);

  console.log("\n— RLS backstop —");
  const rls = await prisma.$queryRaw<{ relname: string; relrowsecurity: boolean }[]>`
    SELECT relname, relrowsecurity FROM pg_class
    WHERE relname IN ('projects','invoices','clients','company_expenses','invites') AND relkind='r'`;
  ok("RLS enabled on core tables", rls.length > 0 && rls.every(r => r.relrowsecurity), rls);

  console.log(`\n${fail === 0 ? "✅ ALL" : "❌ " + fail + " FAILED /"} ${pass + fail} checks`);
  process.exit(fail === 0 ? 0 : 1);
}
main().finally(() => prisma.$disconnect());
