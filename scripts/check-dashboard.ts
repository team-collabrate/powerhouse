/*
  Sanity checks that don't need a database. Run: npm test
*/
import {
  buildDashboardView,
  type DashInputs,
} from "@/lib/queries/dashboard";
import { can } from "@/lib/permissions";
import { profitabilityCsv } from "@/lib/queries/analytics";
import {
  allocateOverhead,
  overheadMonthlyPool,
  overheadDurationMonths,
  type OverheadProjectInput,
} from "@/lib/overhead";
import { invoiceTotals, lineAmount } from "@/lib/invoice-total";

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
  monthlyRevenueTarget: 50_000,
  overheadMethod: "manual",
  overheadRate: 0,
  overheadMonthlyPool: 0,
  projects: [
    {
      id: "p-healthy",
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
      id: "p-thin",
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
      id: "p-old",
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
check(
  "revenue all-time = ₹1,34,000 (25k + 10k + 99k)",
  v.kpis[0].value === "₹1,34,000",
  v.kpis[0].value,
);
check("revenue KPI has no delta", v.kpis[0].delta === undefined, v.kpis[0].delta);
check("projects (non-closed) = 3", v.kpis[1].value === "3", v.kpis[1].value);
check("new-this-year delta = +3", v.kpis[1].delta?.value === "+3", v.kpis[1].delta);
check(
  "projects hint = '2 in progress'",
  v.kpis[1].hint === "2 in progress",
  v.kpis[1].hint,
);
check(
  "portfolio margin = 39.1% (62.5k / 160k)",
  v.kpis[2].value === "39.1%",
  v.kpis[2].value,
);
check("outstanding = ₹21,000 (12k + 9k)", v.kpis[3].value === "₹21,000", v.kpis[3].value);
check(
  "revenue KPI shows annual-target progress (134k / (50k×12) = 22%)",
  Math.round(v.kpis[0].progress ?? 0) === 22 &&
    v.kpis[0].hint === "₹1,34,000 in 2026 · 22% of target",
  { progress: v.kpis[0].progress, hint: v.kpis[0].hint },
);
check("profit series has 12 points", v.profit.points.length === 12, v.profit.points.length);
check("yMax is a positive multiple of 500", v.profit.yMax > 0 && v.profit.yMax % 500 === 0, v.profit.yMax);
check(
  "service mix sums to ~100%",
  Math.abs(v.services.reduce((s, x) => s + x.value, 0) - 100) <= 2,
  v.services,
);
check("top projects sorted by margin desc", v.topProjects.every((p, i, a) => i === 0 || a[i - 1].margin >= p.margin));
check(
  "top projects span all open projects, not just active (Old Delivered @ 50% ranks first)",
  v.topProjects[0]?.name === "Old Delivered",
  v.topProjects[0],
);
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

console.log("\nanalytics csv:");
const csv = profitabilityCsv([
  {
    id: "p1",
    name: 'Re"brand, Ltd',
    client: "Acme",
    status: "active",
    serviceType: "design",
    contractValue: 50000,
    teamCost: 20000,
    expenses: 3000,
    overhead: 1000,
    totalCost: 24000,
    profit: 26000,
    margin: 52,
  },
]);
const csvLines = csv.split("\n");
check("csv has a header + one row", csvLines.length === 2);
check(
  "csv quotes fields with commas/quotes",
  csvLines[1].startsWith('"Re""brand, Ltd",Acme,active'),
  csvLines[1],
);
check("csv ends with the margin value", csvLines[1].endsWith(",52"));

console.log("\noverhead:");
const oNow = new Date("2026-09-15T12:00:00Z");
const oDay = (offset: number) => new Date(oNow.getTime() + offset * 86_400_000);

const pool = overheadMonthlyPool(
  [
    { amount: 6_500, dateIncurred: oDay(-5), isRecurring: true, recurringFrequency: "monthly" },
    { amount: 900, dateIncurred: oDay(-5), isRecurring: true, recurringFrequency: "quarterly" }, // 300/mo
    { amount: 1_200, dateIncurred: oDay(-5), isRecurring: true, recurringFrequency: "annually" }, // 100/mo
    { amount: 9_000, dateIncurred: oDay(-30), isRecurring: false, recurringFrequency: null }, // 3000/mo
    { amount: 6_000, dateIncurred: oDay(-120), isRecurring: false, recurringFrequency: null }, // excluded (>90d)
  ],
  oNow,
);
check("overhead pool = recurring run-rate + trailing one-offs/3", Math.round(pool) === 9_900, pool);

check(
  "duration months clamps to [1,18]",
  overheadDurationMonths(oDay(-390), oDay(0)) === 13 &&
    overheadDurationMonths(oDay(-2000), oDay(0)) === 18 &&
    overheadDurationMonths(null, null) === 3,
);

const threeMo: OverheadProjectInput[] = [
  { id: "a", status: "active", contractValue: 100_000, startDate: oDay(-45), deadline: oDay(45), overrideOverhead: 0 },
  { id: "b", status: "in_review", contractValue: 300_000, startDate: oDay(-45), deadline: oDay(45), overrideOverhead: 0 },
  { id: "c", status: "closed", contractValue: 50_000, startDate: oDay(-45), deadline: oDay(45), overrideOverhead: 0 },
];

const evenMap = allocateOverhead({ method: "even", percentRate: 0 }, 9_000, threeMo);
check("even: non-closed split, x duration months", evenMap.get("a") === 13_500 && evenMap.get("b") === 13_500, [
  evenMap.get("a"),
  evenMap.get("b"),
]);
check("even: closed project gets 0", evenMap.get("c") === 0);

const shareMap = allocateOverhead({ method: "contract_share", percentRate: 0 }, 4_000, threeMo);
check("contract_share: weighted by contract value", shareMap.get("a") === 3_000 && shareMap.get("b") === 9_000, [
  shareMap.get("a"),
  shareMap.get("b"),
]);

const pctMap = allocateOverhead({ method: "percent", percentRate: 0.05 }, 0, threeMo);
check("percent: rate x contract value", pctMap.get("a") === 5_000 && pctMap.get("b") === 15_000);

const pinned: OverheadProjectInput[] = [
  { id: "x", status: "active", contractValue: 100_000, startDate: oDay(-45), deadline: oDay(45), overrideOverhead: 2_000 },
  { id: "y", status: "active", contractValue: 100_000, startDate: oDay(-45), deadline: oDay(45), overrideOverhead: 0 },
];
const pinMap = allocateOverhead({ method: "even", percentRate: 0 }, 6_000, pinned);
check("pinned value wins and is excluded from the split", pinMap.get("x") === 2_000 && pinMap.get("y") === 18_000, [
  pinMap.get("x"),
  pinMap.get("y"),
]);

check(
  "manual method allocates nothing (override-only)",
  allocateOverhead({ method: "manual", percentRate: 0 }, 9_000, threeMo).get("a") === 0,
);

console.log("\ninvoice totals:");
const it1 = invoiceTotals(
  [
    { quantity: 2, unitPrice: 15000 },
    { quantity: 1, unitPrice: 8000 },
  ],
  18,
);
check("subtotal = Σ(qty×rate)", it1.subtotal === 38000, it1);
check("tax = subtotal × rate%", it1.tax === 6840, it1);
check("total = subtotal + tax", it1.total === 44840, it1);
check("no tax → total = subtotal", invoiceTotals([{ quantity: 1, unitPrice: 500 }], 0).total === 500);
check("empty → zeros", invoiceTotals([], 18).total === 0);
check("lineAmount rounds to 2dp", lineAmount({ quantity: 3, unitPrice: 33.333 }) === 100);

console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
