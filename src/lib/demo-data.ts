import type { DashboardView, ProfitPoint } from "./dashboard-types";

/*
  Static placeholder used when there is no database connection or the agency
  has no rows yet. Shape matches the live query output in
  src/lib/queries/dashboard.ts exactly. Figures are in ₹ for an Indian studio.
*/

const dayLabels = [
  "1 Sep", "4 Sep", "7 Sep", "10 Sep", "13 Sep", "16 Sep",
  "19 Sep", "22 Sep", "25 Sep", "27 Sep", "29 Sep", "30 Sep",
];
const revenue = [
  128000, 144000, 136000, 168000, 184000, 176000,
  208000, 200000, 224000, 244000, 236000, 256000,
];
const cost = [
  84000, 92000, 88000, 104000, 100000, 108000,
  120000, 116000, 124000, 132000, 128000, 136000,
];

const points: ProfitPoint[] = dayLabels.map((label, i) => ({
  label,
  revenue: revenue[i],
  cost: cost[i],
  profit: revenue[i] - cost[i],
}));

export const DEMO_DASHBOARD: DashboardView = {
  greetingName: "there",
  isDemo: true,
  isEmpty: false,
  kpis: [
    {
      id: "revenue",
      label: "Revenue (all-time)",
      value: "₹51,20,000",
      icon: "trending-up",
      hint: "₹34,80,000 in 2026 · 58% of target",
      progress: 58,
    },
    {
      id: "projects",
      label: "Projects",
      value: "18",
      delta: { value: "+11", direction: "up" },
      icon: "briefcase",
      hint: "5 in progress",
    },
    {
      id: "margin",
      label: "Profit Margin",
      value: "42.8%",
      icon: "percent",
    },
    {
      id: "outstanding",
      label: "Outstanding",
      value: "₹9,25,000",
      delta: { value: "-2.4%", direction: "down" },
      icon: "clock",
    },
  ],
  profit: {
    points,
    yMax: 280000,
    tickIndices: [0, 2, 4, 6, 8, 10, 11],
  },
  services: [
    { label: "Web Development", value: 38, margin: 46, color: "var(--accent)" },
    { label: "Brand & Design", value: 27, margin: 39, color: "#c9a3ff" },
    { label: "Marketing", value: 21, margin: 58, color: "#e4d3ff" },
    { label: "Consulting", value: 14, margin: 33, color: "#efeaf5" },
  ],
  topProjects: [
    { name: "Kirana Fresh Rebrand", client: "Kirana Fresh", margin: 61.2, contract: "₹33,60,000", profit: "₹20,56,000" },
    { name: "Surya Labs App Launch", client: "Surya Labs", margin: 48.5, contract: "₹48,00,000", profit: "₹23,28,000" },
    { name: "Bhoomi Storefront", client: "Bhoomi & Co.", margin: 33.9, contract: "₹18,40,000", profit: "₹6,24,000" },
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
    { id: "", number: "INV-2026-041", client: "Surya Labs", status: "paid", amount: "₹9,60,000" },
    { id: "", number: "INV-2026-040", client: "Kirana Fresh", status: "sent", amount: "₹7,40,000" },
    { id: "", number: "INV-2026-039", client: "Bhoomi & Co.", status: "overdue", amount: "₹3,68,000" },
    { id: "", number: "INV-2026-038", client: "Chitra Studio", status: "paid", amount: "₹12,70,000" },
    { id: "", number: "INV-2026-037", client: "Sankalp Group", status: "draft", amount: "₹4,80,000" },
  ],
  insights: [
    {
      title: "Bhoomi Storefront is trending under margin",
      body: "Projected margin is 8% on a ₹18,40,000 contract.",
      icon: "alert-triangle",
    },
    {
      title: "2 invoices worth ₹11,08,000 are unpaid past 30 days",
      body: "Kirana Fresh and Bhoomi & Co. Consider a reminder before month-end close.",
      icon: "file-text",
    },
  ],
  deliverables: {
    overdue: [
      {
        id: "d1",
        name: "Design sign-off",
        projectId: "",
        projectName: "Surya Labs App Launch",
        daysAway: -3,
      },
    ],
    upcoming: [
      {
        id: "d2",
        name: "Beta release",
        projectId: "",
        projectName: "Kirana Fresh Rebrand",
        daysAway: 4,
      },
      {
        id: "d3",
        name: "Content handover",
        projectId: "",
        projectName: "Bhoomi Storefront",
        daysAway: 11,
      },
    ],
  },
};
