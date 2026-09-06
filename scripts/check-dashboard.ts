/*
  Sanity checks that don't need a database. Run: npm test
*/
import {
  buildDashboardView,
  type DashInputs,
} from "@/lib/queries/dashboard";
import { can } from "@/lib/permissions";

const now = new Date("2026-09-15T12:00:00Z");
const d = (offset: number) => {
  const x = new Date(now);
  x.setDate(x.getDate() + offset);
  return x;
};
const monthsBack = (m: number) => new Date(2026, 8 - m, 10);

const input: DashInputs = {
  greetingName: "Bella",
  now,
  projects: [
    {
      name: "Healthy Project",
      status: "active",
      serviceType: "web_dev",
      contractValue: 100_000,
      teamCost: 45_000, // 45k + 8k exp + 5k oh = 58k -> 42% margin
      allocatedOverhead: 5_000,
      createdAt: monthsBack(3),
      startDate: monthsBack(3),
      deadline: d(30),
      clientName: "Acme",
      expenses: [{ amount: 8_000, date: d(-10) }],
    },
    {
      name: "Thin Margin Project",
      status: "active",
      serviceType: "design",
      contractValue: 20_000,
      teamCost: 16_500, // 16.5k + 2k + 1k = 19.5k -> ~2.5% margin (< 15)
      allocatedOverhead: 1_000,
      createdAt: d(-3), // new this month
      startDate: d(-3),
      deadline: d(40),
      clientName: "Beta Co",
      expenses: [{ amount: 2_000, date: d(-8) }],
    },
    {
      name: "Old Delivered",
      status: "delivered",
      serviceType: "consulting",
      contractValue: 40_000,
      teamCost: 20_000,
      allocatedOverhead: 0,
      createdAt: monthsBack(5),
      startDate: monthsBack(5),
      deadline: monthsBack(1),
      clientName: "Gamma",
      expenses: [],
    },
  ],
  invoices: [
    { id: "i10", invoiceNumber: "INV-2026-010", amount: 25_000, amountPaid: 25_000, status: "paid", dueDate: d(-10), clientName: "Acme" },
    { id: "i9", invoiceNumber: "INV-2026-009", amount: 12_000, amountPaid: 0, status: "sent", dueDate: d(20), clientName: "Beta Co" },
    { id: "i8", invoiceNumber: "INV-2026-008", amount: 9_000, amountPaid: 0, status: "sent", dueDate: d(-45), clientName: "Gamma" }, // overdue + stale
  ],
  payments: [
    { amount: 25_000, date: d(-4) }, // this month, Sep 11 (MTD through Sep 15)
    { amount: 10_000, date: new Date(2026, 7, 10) }, // Aug 10 — inside the Aug 1–15 comparison window
    { amount: 99_000, date: new Date(2026, 7, 28) }, // Aug 28 — outside the comparison window, must be ignored
  ],
  clients: [
    { createdAt: monthsBack(4) },
    { createdAt: monthsBack(1) },
    { createdAt: d(-2) }, // this month
    { createdAt: d(-1) },
  ],
};

const v = buildDashboardView(input);

let failures = 0;
function check(label: string, cond: boolean, detail?: unknown) {
  if (cond) {
    console.log(`  ok   ${label}`);
  } else {
    failures++;
    console.log(`  FAIL ${label}${detail !== undefined ? ` — ${JSON.stringify(detail)}` : ""}`);
  }
}

console.log("buildDashboardView:");
check("greeting passes through", v.greetingName === "Bella");
check("not flagged as demo", v.isDemo === false);
check("revenue MTD = $25,000", v.kpis[0].value === "$25,000", v.kpis[0].value);
check(
  "revenue delta = +150.0% up (same-period MoM, ignores Aug 28)",
  v.kpis[0].delta?.value === "+150.0%" && v.kpis[0].delta?.direction === "up",
  v.kpis[0].delta,
);
check("active projects = 2", v.kpis[1].value === "2", v.kpis[1].value);
check("new-this-month delta = +1", v.kpis[1].delta?.value === "+1", v.kpis[1].delta);
check("outstanding = $21,000 (12k + 9k)", v.kpis[3].value === "$21,000", v.kpis[3].value);
check("profit series has 12 points", v.profit.points.length === 12, v.profit.points.length);
check("yMax is a positive multiple of 500", v.profit.yMax > 0 && v.profit.yMax % 500 === 0, v.profit.yMax);
check(
  "service mix sums to ~100%",
  Math.abs(v.services.reduce((s, x) => s + x.value, 0) - 100) <= 2,
  v.services,
);
check("top projects sorted by margin desc", v.topProjects.every((p, i, a) => i === 0 || a[i - 1].margin >= p.margin));
check("healthy project ranks first", v.topProjects[0]?.name === "Healthy Project", v.topProjects[0]);
check("recent invoices: 3 rows", v.recentInvoices.length === 3);
check(
  "stale sent invoice shows as overdue",
  v.recentInvoices.find((i) => i.number === "INV-2026-008")?.status === "overdue",
  v.recentInvoices,
);
check(
  "future-dated sent invoice stays 'sent'",
  v.recentInvoices.find((i) => i.number === "INV-2026-009")?.status === "sent",
);
check(
  "under-margin insight present",
  v.insights.some((i) => i.title.includes("Thin Margin Project")),
  v.insights.map((i) => i.title),
);
check(
  "stale-receivable insight present",
  v.insights.some((i) => i.title.includes("unpaid past 30 days")),
  v.insights.map((i) => i.title),
);
check("client growth: 6 bars", v.clientGrowth.bars.length === 6);
check("client growth netNew = 4", v.clientGrowth.netNew === 4, v.clientGrowth.netNew);
check("last bar highlighted", v.clientGrowth.bars[5].highlight === true);

console.log("\npermissions:");
check("admin can manage settings", can("admin", "settings:manage"));
check("manager can write invoices", can("manager", "invoice:write"));
check("manager cannot manage team", !can("manager", "team:manage"));
check("team_member can write expenses", can("team_member", "expense:write"));
check("team_member cannot write projects", !can("team_member", "project:write"));
check("team_member cannot write invoices", !can("team_member", "invoice:write"));
check("client can do nothing", !can("client", "expense:write"));
check("unknown role denied", !can("nonsense", "project:write"));

console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
