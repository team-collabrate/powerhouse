export type InvoiceStatus =
  | "paid"
  | "partial"
  | "sent"
  | "overdue"
  | "draft"
  | "cancelled";

export interface Delta {
  value: string;
  direction: "up" | "down";
}

export type KpiIcon = "trending-up" | "briefcase" | "percent" | "clock";

export interface KpiView {
  id: string;
  label: string;
  value: string;
  delta?: Delta;
  icon: KpiIcon;
  /** small secondary line, e.g. "63% of $90k target" */
  hint?: string;
  /** 0–100, renders a thin progress bar at the card foot */
  progress?: number;
}

export interface ProfitPoint {
  label: string;
  revenue: number;
  cost: number;
  profit: number;
}

export interface ProfitSeriesView {
  points: ProfitPoint[];
  yMax: number;
  /** indices of `points` to label on the x-axis */
  tickIndices: number[];
}

export interface ServiceSlice {
  label: string;
  value: number; // percentage 0-100
  color: string;
}

export interface TopProjectView {
  name: string;
  client: string;
  margin: number;
  contract: string;
  profit: string;
}

export interface ClientGrowthBar {
  label: string;
  value: number;
  highlight?: boolean;
}

export interface ClientGrowthView {
  bars: ClientGrowthBar[];
  yMax: number;
  netNew: number;
  caption: string;
}

export interface InvoiceRowView {
  id: string;
  number: string;
  client: string;
  status: InvoiceStatus;
  amount: string;
}

export type InsightIcon = "alert-triangle" | "file-text";

export interface InsightView {
  title: string;
  body: string;
  icon: InsightIcon;
}

export interface DeliverableRow {
  id: string;
  name: string;
  projectId: string;
  projectName: string;
  /** whole days from now; negative = overdue */
  daysAway: number;
}

export interface DeliverablesView {
  overdue: DeliverableRow[];
  upcoming: DeliverableRow[];
}

export interface DashboardView {
  greetingName: string;
  kpis: KpiView[];
  profit: ProfitSeriesView;
  services: ServiceSlice[];
  topProjects: TopProjectView[];
  clientGrowth: ClientGrowthView;
  recentInvoices: InvoiceRowView[];
  insights: InsightView[];
  deliverables: DeliverablesView;
  /** true when served from static placeholder data (no DB / no rows yet) */
  isDemo: boolean;
  /** true when the agency exists but has no projects or invoices yet */
  isEmpty: boolean;
}

export const SERVICE_LABELS: Record<string, string> = {
  web_dev: "Web Development",
  design: "Brand & Design",
  marketing: "Marketing",
  consulting: "Consulting",
  other: "Other",
};

export const SERVICE_COLORS = [
  "var(--accent)",
  "#c9a3ff",
  "#e4d3ff",
  "#efeaf5",
  "#f4f1f8",
];
