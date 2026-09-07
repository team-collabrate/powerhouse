import { prisma } from "@/lib/prisma";
import { calculateProjectProfit } from "@/lib/profit";
import { displayInvoiceStatus } from "@/lib/invoice-status";
import { resolveAgencyOverhead } from "@/lib/queries/overhead";
import { cacheAgencyRead } from "@/lib/cache";
import { formatCurrency } from "@/lib/format";

const num = (d: unknown): number => (d == null ? 0 : Number(d));
const DAY = 86_400_000;

export type NotificationKind =
  | "overdue"
  | "due_soon"
  | "under_margin"
  | "past_deadline";

export interface NotificationItem {
  id: string;
  kind: NotificationKind;
  title: string;
  detail: string;
  href: string;
  severity: "high" | "medium";
  /** ISO — for sorting newest/most-urgent first */
  sortAt: number;
}

export interface NotificationsData {
  items: NotificationItem[];
  /** high-severity count, for the bell badge */
  count: number;
}

const DUE_SOON_DAYS = 5;
const MARGIN_FLOOR = 15;

export async function buildNotifications(
  agencyId: string,
): Promise<NotificationsData> {
  const now = new Date();
  const soon = new Date(now.getTime() + DUE_SOON_DAYS * DAY);

  const [invoices, projects, overhead] = await Promise.all([
    prisma.invoice.findMany({
      where: { agencyId, status: { in: ["sent", "partial", "overdue"] } },
      select: {
        id: true,
        invoiceNumber: true,
        amount: true,
        status: true,
        dueDate: true,
        client: { select: { name: true } },
        payments: { select: { amount: true } },
      },
    }),
    prisma.project.findMany({
      where: { agencyId, status: "active" },
      select: {
        id: true,
        name: true,
        contractValue: true,
        teamCost: true,
        deadline: true,
        projectExpenses: { select: { amount: true } },
      },
    }),
    resolveAgencyOverhead(agencyId),
  ]);

  const items: NotificationItem[] = [];

  for (const i of invoices) {
    const amount = num(i.amount);
    const paid = i.payments.reduce((s, p) => s + num(p.amount), 0);
    const display = displayInvoiceStatus(i.status, i.dueDate, amount, paid, now);
    const balance = Math.max(0, amount - paid);
    if (balance <= 0) continue;

    if (display === "overdue") {
      const days = Math.floor((now.getTime() - i.dueDate.getTime()) / DAY);
      items.push({
        id: `inv-${i.id}`,
        kind: "overdue",
        title: `${i.invoiceNumber} is ${days} day${days === 1 ? "" : "s"} overdue`,
        detail: `${i.client.name} · ${formatCurrency(balance)} outstanding`,
        href: `/invoices/${i.id}`,
        severity: "high",
        sortAt: now.getTime() - i.dueDate.getTime(),
      });
    } else if (i.dueDate <= soon) {
      const days = Math.max(0, Math.ceil((i.dueDate.getTime() - now.getTime()) / DAY));
      items.push({
        id: `inv-${i.id}`,
        kind: "due_soon",
        title: `${i.invoiceNumber} due in ${days} day${days === 1 ? "" : "s"}`,
        detail: `${i.client.name} · ${formatCurrency(balance)}`,
        href: `/invoices/${i.id}`,
        severity: "medium",
        sortAt: DUE_SOON_DAYS * DAY - (i.dueDate.getTime() - now.getTime()),
      });
    }
  }

  for (const p of projects) {
    const contractValue = num(p.contractValue);
    if (contractValue <= 0) continue;
    const { profitMargin } = calculateProjectProfit({
      contractValue,
      teamCost: num(p.teamCost),
      allocatedOverhead: overhead.overheadFor(p.id),
      expenses: p.projectExpenses.map((e) => ({ amount: num(e.amount) })),
    });
    if (profitMargin < MARGIN_FLOOR) {
      items.push({
        id: `mgn-${p.id}`,
        kind: "under_margin",
        title: `${p.name} is under margin`,
        detail: `Projected ${profitMargin.toFixed(0)}% on ${formatCurrency(contractValue)}`,
        href: `/projects/${p.id}`,
        severity: "high",
        sortAt: (MARGIN_FLOOR - profitMargin) * DAY,
      });
    }
    if (p.deadline && p.deadline < now) {
      const days = Math.floor((now.getTime() - p.deadline.getTime()) / DAY);
      items.push({
        id: `dl-${p.id}`,
        kind: "past_deadline",
        title: `${p.name} is ${days} day${days === 1 ? "" : "s"} past deadline`,
        detail: "Still marked active",
        href: `/projects/${p.id}`,
        severity: "medium",
        sortAt: now.getTime() - p.deadline.getTime(),
      });
    }
  }

  items.sort((a, b) => {
    if (a.severity !== b.severity) return a.severity === "high" ? -1 : 1;
    return b.sortAt - a.sortAt;
  });

  const trimmed = items.slice(0, 15);
  return {
    items: trimmed,
    count: trimmed.filter((i) => i.severity === "high").length,
  };
}

export const getNotifications = cacheAgencyRead(
  buildNotifications,
  ["notifications"],
  60,
);
