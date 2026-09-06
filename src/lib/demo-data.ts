/*
  Static demo data for the dashboard shell. Replace with API queries in Sprint 3.
  Numbers are illustrative only.
*/

export const KPIS = [
  {
    id: "revenue",
    label: "Revenue (MTD)",
    value: "$128,400",
    delta: { value: "+12.4%", direction: "up" as const },
    icon: "trending-up" as const,
  },
  {
    id: "projects",
    label: "Active Projects",
    value: "18",
    delta: { value: "+3", direction: "up" as const },
    icon: "briefcase" as const,
  },
  {
    id: "margin",
    label: "Avg. Profit Margin",
    value: "42.8%",
    delta: { value: "+5.2%", direction: "up" as const },
    icon: "percent" as const,
  },
  {
    id: "outstanding",
    label: "Outstanding",
    value: "$23,150",
    delta: { value: "-2.4%", direction: "down" as const },
    icon: "clock" as const,
  },
];

// 30-day series, sampled every ~3 days for the x-axis ticks.
export const PROFIT_SERIES = {
  ticks: ["Sep 1", "Sep 6", "Sep 11", "Sep 16", "Sep 21", "Sep 26", "Sep 30"],
  // one label per data point (12 points across the month)
  days: [
    "Sep 1", "Sep 4", "Sep 7", "Sep 10", "Sep 13", "Sep 16",
    "Sep 19", "Sep 22", "Sep 25", "Sep 27", "Sep 29", "Sep 30",
  ],
  yMax: 7000,
  revenue: [3200, 3600, 3400, 4200, 4600, 4400, 5200, 5000, 5600, 6100, 5900, 6400],
  cost: [2100, 2300, 2200, 2600, 2500, 2700, 3000, 2900, 3100, 3300, 3200, 3400],
  get profit() {
    return this.revenue.map((r, i) => r - this.cost[i]);
  },
  highlight: {
    index: 6,
    label: "Sep 18",
    revenue: 5200,
    cost: 3000,
    profit: 2200,
  },
};

export const SERVICE_MIX = [
  { label: "Web Development", value: 38, color: "var(--accent)" },
  { label: "Brand & Design", value: 27, color: "#c9a3ff" },
  { label: "Marketing", value: 21, color: "#e4d3ff" },
  { label: "Consulting", value: 14, color: "#efeaf5" },
];

export const TOP_PROJECTS = [
  {
    name: "Northwind Rebrand",
    client: "Northwind Traders",
    margin: 61.2,
    contract: "$84,000",
    profit: "$51,400",
  },
  {
    name: "Helio App Launch",
    client: "Helio Labs",
    margin: 48.5,
    contract: "$120,000",
    profit: "$58,200",
  },
  {
    name: "Acre Storefront",
    client: "Acre & Co.",
    margin: 33.9,
    contract: "$46,000",
    profit: "$15,600",
  },
];

export const CLIENT_GROWTH = {
  yMax: 24,
  bars: [
    { label: "Apr", value: 12 },
    { label: "May", value: 14 },
    { label: "Jun", value: 13 },
    { label: "Jul", value: 17 },
    { label: "Aug", value: 19 },
    { label: "Sep", value: 22, highlight: true },
  ],
};

export type InvoiceStatus = "paid" | "sent" | "overdue" | "draft";

export const RECENT_INVOICES: {
  number: string;
  client: string;
  status: InvoiceStatus;
  amount: string;
}[] = [
  { number: "INV-2026-041", client: "Helio Labs", status: "paid", amount: "$24,000" },
  { number: "INV-2026-040", client: "Northwind Traders", status: "sent", amount: "$18,500" },
  { number: "INV-2026-039", client: "Acre & Co.", status: "overdue", amount: "$9,200" },
  { number: "INV-2026-038", client: "Vector Studio", status: "paid", amount: "$31,750" },
  { number: "INV-2026-037", client: "Meridian Group", status: "draft", amount: "$12,000" },
];

export const INSIGHTS = [
  {
    title: "Acre Storefront is trending under margin",
    body: "Logged hours are 18% over estimate with 3 weeks to deadline.",
    icon: "alert-triangle" as const,
  },
  {
    title: "2 invoices worth $27,700 are unpaid past 30 days",
    body: "Northwind and Acre. Consider a reminder before month-end close.",
    icon: "file-text" as const,
  },
];
