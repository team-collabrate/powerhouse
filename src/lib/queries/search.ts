import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/format";

const num = (d: unknown): number => (d == null ? 0 : Number(d));

export interface SearchHit {
  id: string;
  label: string;
  sub: string;
  href: string;
}

export interface SearchResults {
  projects: SearchHit[];
  clients: SearchHit[];
  invoices: SearchHit[];
  total: number;
}

const EMPTY: SearchResults = {
  projects: [],
  clients: [],
  invoices: [],
  total: 0,
};

export async function searchAgency(
  agencyId: string,
  query: string,
): Promise<SearchResults> {
  const term = query.trim();
  if (term.length < 2) return EMPTY;
  const contains = { contains: term, mode: "insensitive" as const };

  const [projects, clients, invoices] = await Promise.all([
    prisma.project.findMany({
      where: { agencyId, name: contains },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        name: true,
        status: true,
        client: { select: { companyName: true, name: true } },
      },
    }),
    prisma.client.findMany({
      where: {
        agencyId,
        OR: [
          { companyName: contains },
          { name: contains },
          { email: contains },
        ],
      },
      orderBy: { companyName: "asc" },
      take: 6,
      select: { id: true, companyName: true, name: true, email: true },
    }),
    prisma.invoice.findMany({
      where: { agencyId, invoiceNumber: contains },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        invoiceNumber: true,
        amount: true,
        client: { select: { name: true } },
      },
    }),
  ]);

  const results: SearchResults = {
    projects: projects.map((p) => ({
      id: p.id,
      label: p.name,
      sub: `${p.client.companyName ?? p.client.name} · ${p.status.replace("_", " ")}`,
      href: `/projects/${p.id}`,
    })),
    clients: clients.map((c) => ({
      id: c.id,
      label: c.companyName ?? c.name,
      sub: c.email,
      href: `/clients/${c.id}`,
    })),
    invoices: invoices.map((i) => ({
      id: i.id,
      label: i.invoiceNumber,
      sub: `${i.client.name} · ${formatCurrency(num(i.amount))}`,
      href: `/invoices/${i.id}`,
    })),
    total: 0,
  };
  results.total =
    results.projects.length + results.clients.length + results.invoices.length;
  return results;
}
