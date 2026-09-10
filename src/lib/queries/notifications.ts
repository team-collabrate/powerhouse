import { prisma } from "@/lib/prisma";
import { calculateProjectProfit } from "@/lib/profit";
import { displayInvoiceStatus } from "@/lib/invoice-status";
import { resolveAgencyOverhead } from "@/lib/queries/overhead";
import { cacheAgencyRead } from "@/lib/cache";
import {
  assembleNotifications,
  classifyInvoice,
  classifyProjectMargin,
  classifyProjectDeadline,
  classifyMilestone,
  classifyDraftInvoice,
  classifyRevenueShortfall,
  type NotificationsData,
} from "@/lib/reports/notifications";

export type {
  NotificationKind,
  NotificationItem,
  NotificationsData,
} from "@/lib/reports/notifications";

const num = (d: unknown): number => (d == null ? 0 : Number(d));

export async function buildNotifications(
  agencyId: string,
): Promise<NotificationsData> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [openInvoices, drafts, projects, milestones, agency, mtdPayments, overhead] =
    await Promise.all([
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
      prisma.invoice.findMany({
        where: { agencyId, status: "draft" },
        select: {
          id: true,
          invoiceNumber: true,
          createdAt: true,
          client: { select: { name: true } },
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
      prisma.milestone.findMany({
        where: { project: { agencyId }, status: { not: "completed" } },
        select: {
          id: true,
          name: true,
          status: true,
          dueDate: true,
          project: { select: { id: true, name: true } },
        },
      }),
      prisma.agency.findUnique({
        where: { id: agencyId },
        select: { monthlyRevenueTarget: true },
      }),
      prisma.payment.findMany({
        where: { invoice: { agencyId }, paymentDate: { gte: monthStart } },
        select: { amount: true },
      }),
      resolveAgencyOverhead(agencyId),
    ]);

  const items = [
    ...openInvoices.map((i) => {
      const amount = num(i.amount);
      const paid = i.payments.reduce((s, p) => s + num(p.amount), 0);
      return classifyInvoice(
        {
          id: i.id,
          invoiceNumber: i.invoiceNumber,
          clientName: i.client.name,
          balance: Math.max(0, amount - paid),
          dueDate: i.dueDate,
          display: displayInvoiceStatus(i.status, i.dueDate, amount, paid, now),
        },
        now,
      );
    }),
    ...drafts.map((d) =>
      classifyDraftInvoice(
        {
          id: d.id,
          invoiceNumber: d.invoiceNumber,
          clientName: d.client.name,
          createdAt: d.createdAt,
        },
        now,
      ),
    ),
    ...projects.flatMap((p) => {
      const contractValue = num(p.contractValue);
      const { profitMargin } = calculateProjectProfit({
        contractValue,
        teamCost: num(p.teamCost),
        allocatedOverhead: overhead.overheadFor(p.id),
        expenses: p.projectExpenses.map((e) => ({ amount: num(e.amount) })),
      });
      const input = {
        id: p.id,
        name: p.name,
        contractValue,
        profitMargin,
        deadline: p.deadline,
      };
      return [classifyProjectMargin(input), classifyProjectDeadline(input, now)];
    }),
    ...milestones.map((m) =>
      classifyMilestone(
        {
          id: m.id,
          name: m.name,
          projectId: m.project.id,
          projectName: m.project.name,
          status: m.status,
          dueDate: m.dueDate,
        },
        now,
      ),
    ),
    classifyRevenueShortfall({
      monthlyTarget: num(agency?.monthlyRevenueTarget),
      mtdReceived: mtdPayments.reduce((s, p) => s + num(p.amount), 0),
      now,
    }),
  ];

  return assembleNotifications(items);
}

export const getNotifications = cacheAgencyRead(
  buildNotifications,
  ["notifications"],
  60,
);
