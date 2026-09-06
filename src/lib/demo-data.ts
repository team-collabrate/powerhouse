import type { DashboardView, ProfitPoint } from "./dashboard-types";

/*
  Static placeholder used when there is no database connection or the agency
  has no rows yet. Shape matches the live query output in
  src/lib/queries/dashboard.ts exactly.
*/

const dayLabels = [
  "Sep 1", "Sep 4", "Sep 7", "Sep 10", "Sep 13", "Sep 16",
  "Sep 19", "Sep 22", "Sep 25", "Sep 27", "Sep 29", "Sep 30",
];
const revenue = [3200, 3600, 3400, 4200, 4600, 4400, 5200, 5000, 5600, 6100, 5900, 6400];
const cost = [2100, 2300, 2200, 2600, 2500, 2700, 3000, 2900, 3100, 3300, 3200, 3400];

const points: ProfitPoint[] = dayLabels.map((label, i) => ({
  label,
  revenue: revenue[i],
  cost: cost[i],
  profit: revenue[i] - cost[i],
}));

export const DEMO_DASHBOARD: DashboardView = {
  greetingName: "there",
  isDemo: true,
  kpis: [
    {
      id: "revenue",
      label: "Revenue (MTD)",
      value: "$128,400",
      delta: { value: "+12.4%", direction: "up" },
      icon: "trending-up",
      hint: "86% of $150,000 target",
      progress: 86,
    },
    {
      id: "projects",
      label: "Active Projects",
      value: "18",
      delta: { value: "+3", direction: "up" },
      icon: "briefcase",
    },
    {
      id: "margin",
      label: "Avg. Profit Margin",
      value: "42.8%",
      delta: { value: "+5.2%", direction: "up" },
      icon: "percent",
    },
    {
      id: "outstanding",
      label: "Outstanding",
      value: "$23,150",
      delta: { value: "-2.4%", direction: "down" },
      icon: "clock",
    },
  ],
  profit: {
    points,
    yMax: 7000,
    tickIndices: [0, 2, 4, 6, 8, 10, 11],
  },
  services: [
    { label: "Web Development", value: 38, color: "var(--accent)" },
    { label: "Brand & Design", value: 27, color: "#c9a3ff" },
    { label: "Marketing", value: 21, color: "#e4d3ff" },
    { label: "Consulting", value: 14, color: "#efeaf5" },
  ],
  topProjects: [
    { name: "Northwind Rebrand", client: "Northwind Traders", margin: 61.2, contract: "$84,000", profit: "$51,400" },
    { name: "Helio App Launch", client: "Helio Labs", margin: 48.5, contract: "$120,000", profit: "$58,200" },
    { name: "Acre Storefront", client: "Acre & Co.", margin: 33.9, contract: "$46,000", profit: "$15,600" },
  ],
  clientGrowth: {
    yMax: 24,
    netNew: 10,
    caption: "Net new clients per month, April to September.",
    bars: [
      { label: "Apr", value: 12 },
      { label: "May", value: 14 },
      { label: "Jun", value: 13 },
      { label: "Jul", value: 17 },
      { label: "Aug", value: 19 },
      { label: "Sep", value: 22, highlight: true },
    ],
  },
  recentInvoices: [
    { id: "", number: "INV-2026-041", client: "Helio Labs", status: "paid", amount: "$24,000" },
    { id: "", number: "INV-2026-040", client: "Northwind Traders", status: "sent", amount: "$18,500" },
    { id: "", number: "INV-2026-039", client: "Acre & Co.", status: "overdue", amount: "$9,200" },
    { id: "", number: "INV-2026-038", client: "Vector Studio", status: "paid", amount: "$31,750" },
    { id: "", number: "INV-2026-037", client: "Meridian Group", status: "draft", amount: "$12,000" },
  ],
  insights: [
    {
      title: "Acre Storefront is trending under margin",
      body: "Logged hours are 18% over estimate with 3 weeks to deadline.",
      icon: "alert-triangle",
    },
    {
      title: "2 invoices worth $27,700 are unpaid past 30 days",
      body: "Northwind and Acre. Consider a reminder before month-end close.",
      icon: "file-text",
    },
  ],
};
