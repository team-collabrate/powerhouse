/**
 * Pure "needs attention" classifiers. `src/lib/queries/notifications.ts`
 * fetches the rows, normalises them, and feeds them here.
 */
import { formatCurrency } from "@/lib/format";

const DAY = 86_400_000;
export const DUE_SOON_DAYS = 5;
export const MARGIN_FLOOR = 15;
export const DRAFT_AGING_DAYS = 14;

export const NOTIFICATION_KINDS = [
  "overdue",
  "due_soon",
  "under_margin",
  "past_deadline",
  "milestone_overdue",
  "milestone_due",
  "draft_aging",
  "revenue_shortfall",
] as const;
export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];

export interface NotificationItem {
  id: string;
  kind: NotificationKind;
  title: string;
  detail: string;
  href: string;
  severity: "high" | "medium";
  /** larger = more urgent, within a severity band */
  sortAt: number;
}

export interface NotificationsData {
  items: NotificationItem[];
  /** high-severity count, for the bell badge */
  count: number;
}

const plural = (n: number) => (n === 1 ? "" : "s");

export interface InvoiceInput {
  id: string;
  invoiceNumber: string;
  clientName: string;
  balance: number;
  dueDate: Date;
  display: string; // displayInvoiceStatus
}

export function classifyInvoice(
  i: InvoiceInput,
  now: Date,
): NotificationItem | null {
  if (i.balance <= 0) return null;
  if (i.display === "overdue") {
    const days = Math.floor((now.getTime() - i.dueDate.getTime()) / DAY);
    return {
      id: `inv-${i.id}`,
      kind: "overdue",
      title: `${i.invoiceNumber} is ${days} day${plural(days)} overdue`,
      detail: `${i.clientName} · ${formatCurrency(i.balance)} outstanding`,
      href: `/invoices/${i.id}`,
      severity: "high",
      sortAt: now.getTime() - i.dueDate.getTime(),
    };
  }
  if (i.dueDate.getTime() <= now.getTime() + DUE_SOON_DAYS * DAY) {
    const days = Math.max(
      0,
      Math.ceil((i.dueDate.getTime() - now.getTime()) / DAY),
    );
    return {
      id: `inv-${i.id}`,
      kind: "due_soon",
      title: `${i.invoiceNumber} due in ${days} day${plural(days)}`,
      detail: `${i.clientName} · ${formatCurrency(i.balance)}`,
      href: `/invoices/${i.id}`,
      severity: "medium",
      sortAt: DUE_SOON_DAYS * DAY - (i.dueDate.getTime() - now.getTime()),
    };
  }
  return null;
}

export interface ProjectInput {
  id: string;
  name: string;
  contractValue: number;
  profitMargin: number;
  deadline: Date | null;
}

export function classifyProjectMargin(p: ProjectInput): NotificationItem | null {
  if (p.contractValue <= 0 || p.profitMargin >= MARGIN_FLOOR) return null;
  return {
    id: `mgn-${p.id}`,
    kind: "under_margin",
    title: `${p.name} is under margin`,
    detail: `Projected ${p.profitMargin.toFixed(0)}% on ${formatCurrency(p.contractValue)}`,
    href: `/projects/${p.id}`,
    severity: "high",
    sortAt: (MARGIN_FLOOR - p.profitMargin) * DAY,
  };
}

export function classifyProjectDeadline(
  p: ProjectInput,
  now: Date,
): NotificationItem | null {
  if (!p.deadline || p.deadline >= now) return null;
  const days = Math.floor((now.getTime() - p.deadline.getTime()) / DAY);
  return {
    id: `dl-${p.id}`,
    kind: "past_deadline",
    title: `${p.name} is ${days} day${plural(days)} past deadline`,
    detail: "Still marked active",
    href: `/projects/${p.id}`,
    severity: "medium",
    sortAt: now.getTime() - p.deadline.getTime(),
  };
}

export interface MilestoneInput {
  id: string;
  name: string;
  projectId: string;
  projectName: string;
  status: string;
  dueDate: Date;
}

export function classifyMilestone(
  m: MilestoneInput,
  now: Date,
): NotificationItem | null {
  if (m.status === "completed") return null;
  if (m.dueDate < now) {
    const days = Math.floor((now.getTime() - m.dueDate.getTime()) / DAY);
    return {
      id: `ms-${m.id}`,
      kind: "milestone_overdue",
      title: `"${m.name}" is ${days} day${plural(days)} overdue`,
      detail: m.projectName,
      href: `/projects/${m.projectId}`,
      severity: "high",
      sortAt: now.getTime() - m.dueDate.getTime(),
    };
  }
  if (m.dueDate.getTime() <= now.getTime() + DUE_SOON_DAYS * DAY) {
    const days = Math.max(
      0,
      Math.ceil((m.dueDate.getTime() - now.getTime()) / DAY),
    );
    return {
      id: `ms-${m.id}`,
      kind: "milestone_due",
      title: `"${m.name}" due in ${days} day${plural(days)}`,
      detail: m.projectName,
      href: `/projects/${m.projectId}`,
      severity: "medium",
      sortAt: DUE_SOON_DAYS * DAY - (m.dueDate.getTime() - now.getTime()),
    };
  }
  return null;
}

export interface DraftInput {
  id: string;
  invoiceNumber: string;
  clientName: string;
  createdAt: Date;
}

export function classifyDraftInvoice(
  d: DraftInput,
  now: Date,
): NotificationItem | null {
  const days = Math.floor((now.getTime() - d.createdAt.getTime()) / DAY);
  if (days < DRAFT_AGING_DAYS) return null;
  return {
    id: `draft-${d.id}`,
    kind: "draft_aging",
    title: `Draft ${d.invoiceNumber} is ${days} days old`,
    detail: `${d.clientName} · never sent`,
    href: `/invoices/${d.id}/edit`,
    severity: "medium",
    sortAt: days * DAY,
  };
}

export function classifyRevenueShortfall(input: {
  monthlyTarget: number;
  mtdReceived: number;
  now: Date;
}): NotificationItem | null {
  const { monthlyTarget, mtdReceived, now } = input;
  if (monthlyTarget <= 0) return null;
  const daysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
  ).getDate();
  // only fire in the last week of the month
  if (now.getDate() < daysInMonth - 7) return null;
  if (mtdReceived >= monthlyTarget * 0.6) return null;
  const pct = Math.round((mtdReceived / monthlyTarget) * 100);
  return {
    id: "rev-shortfall",
    kind: "revenue_shortfall",
    title: `Revenue at ${pct}% of target with days left`,
    detail: `${formatCurrency(mtdReceived)} of ${formatCurrency(monthlyTarget)} this month`,
    href: "/analytics",
    severity: "medium",
    sortAt: (monthlyTarget - mtdReceived) * 1,
  };
}

/** Sort (high severity first, most urgent first), trim, and count. */
export function assembleNotifications(
  items: (NotificationItem | null)[],
  limit = 15,
): NotificationsData {
  const clean = items.filter((x): x is NotificationItem => x != null);
  clean.sort((a, b) => {
    if (a.severity !== b.severity) return a.severity === "high" ? -1 : 1;
    return b.sortAt - a.sortAt;
  });
  const trimmed = clean.slice(0, limit);
  return {
    items: trimmed,
    count: trimmed.filter((i) => i.severity === "high").length,
  };
}
