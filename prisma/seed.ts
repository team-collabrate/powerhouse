/*
  Seeds an agency with realistic demo data so the dashboard shows live numbers
  that look like a healthy studio ~1 week into the month.

  Default: creates/reuses a standalone "Meridian Studio" demo agency.
  To attach the data to YOUR signed-up account instead:

    add  SEED_EMAIL="you@example.com"  to .env.local, then  npm run db:seed

  Re-running is idempotent (clears the agency's projects / clients / invoices
  first, then re-inserts).
*/
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

const day = (offset: number) => {
  const x = new Date();
  x.setHours(12, 0, 0, 0);
  x.setDate(x.getDate() + offset);
  return x;
};
const monthStart = (back: number) => {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth() - back, 8, 12);
};
const D = (v: number) => new Prisma.Decimal(Math.round(v * 100) / 100);

async function resolveAgency() {
  const email = process.env.SEED_EMAIL;
  if (email) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new Error(
        `SEED_EMAIL=${email} has no user row yet. Sign up in the app first, then re-run.`,
      );
    }
    return { agencyId: user.agencyId, primaryUserId: user.id };
  }
  const agency = await prisma.agency.upsert({
    where: { subdomain: "meridian-demo" },
    update: {},
    create: {
      name: "Meridian Studio",
      subdomain: "meridian-demo",
      monthlyRevenueTarget: D(90_000),
    },
  });
  const owner = await prisma.user.upsert({
    where: { email: "owner@meridian.demo" },
    update: {},
    create: {
      email: "owner@meridian.demo",
      fullName: "Bella Ford",
      role: "admin",
      agencyId: agency.id,
    },
  });
  return { agencyId: agency.id, primaryUserId: owner.id };
}

async function main() {
  const { agencyId, primaryUserId } = await resolveAgency();

  await prisma.payment.deleteMany({ where: { invoice: { agencyId } } });
  await prisma.invoice.deleteMany({ where: { agencyId } });
  await prisma.projectExpense.deleteMany({ where: { project: { agencyId } } });
  await prisma.milestone.deleteMany({ where: { project: { agencyId } } });
  await prisma.project.deleteMany({ where: { agencyId } });
  await prisma.client.deleteMany({ where: { agencyId } });
  await prisma.companyExpense.deleteMany({ where: { agencyId } });
  await prisma.user.deleteMany({
    where: {
      agencyId,
      id: { not: primaryUserId },
      email: { endsWith: "@meridian.demo" },
    },
  });

  // ---- team ----
  await Promise.all(
    ["Priya Anand", "Marcus Lee", "Tomás Rivera", "Dana Whitfield"].map(
      (fullName, i) =>
        prisma.user.create({
          data: {
            email: `member${i + 1}.${agencyId.slice(-6)}@meridian.demo`,
            fullName,
            role: "team_member",
            agencyId,
          },
        }),
    ),
  );

  // ---- clients (weighted toward recent months) ----
  const clientSpecs = [
    // projects reference the first 8 by company name
    ["Northwind Traders", "Isla Fenn", 5],
    ["Cobalt Health", "Nina Park", 4],
    ["Helio Labs", "Ken Ortho", 4],
    ["Vector Studio", "Paul Mreen", 3],
    ["Acre & Co.", "Rosa Dane", 2],
    ["Meridian Group", "Ada Cole", 2],
    ["Brightpath", "Sam Rueda", 1],
    ["Lumen Retail", "Guy Tran", 1],
    // additional clients for a fuller, gently rising growth curve
    ["Sable & Finch", "Nora Beck", 5],
    ["Pinehill Co-op", "Omar Diaz", 3],
    ["Kestrel Media", "Ivy Lang", 3],
    ["Drift Coffee", "Wes Munro", 2],
    ["Halcyon Spa", "Tara Vance", 1],
    ["Meadowlark", "Cole Prieto", 0],
    ["Fernbank Cafe", "Mara Ives", 0],
    ["Onyx Fitness", "Leo Six", 0],
    ["Bluewave Swim", "Jae Sun", 0],
  ] as const;
  const clients = await Promise.all(
    clientSpecs.map(([name, contact, back]) =>
      prisma.client.create({
        data: {
          agencyId,
          name: contact,
          companyName: name,
          email: `hello@${name.toLowerCase().replace(/[^a-z]/g, "")}.example`,
          createdAt: monthStart(back),
        },
      }),
    ),
  );
  const cid = (name: string) =>
    clients[clientSpecs.findIndex((c) => c[0] === name)].id;

  // ---- projects: `teamCost` is the estimated internal labour cost, tuned so
  // each project lands on a sensible margin. Acre is deliberately under 15%
  // so the "under margin" insight fires. `since` = project age in days. ----
  const P = [
    { name: "Northwind Rebrand", client: "Northwind Traders", service: "design", status: "active", value: 84_000, overhead: 4_000, since: 74, teamCost: 30_000, progress: 62 },
    { name: "Helio App Launch", client: "Helio Labs", service: "web_dev", status: "active", value: 145_000, overhead: 7_000, since: 74, teamCost: 47_000, progress: 48 },
    { name: "Acre Storefront", client: "Acre & Co.", service: "web_dev", status: "active", value: 32_000, overhead: 2_500, since: 74, teamCost: 18_000, progress: 70, bigExpense: 7_000 },
    { name: "Vector Site Refresh", client: "Vector Studio", service: "web_dev", status: "active", value: 41_000, overhead: 2_000, since: 62, teamCost: 15_000, progress: 55 },
    { name: "Meridian Campaign", client: "Meridian Group", service: "marketing", status: "active", value: 52_000, overhead: 2_500, since: 55, teamCost: 21_000, progress: 44 },
    { name: "Brightpath Advisory", client: "Brightpath", service: "consulting", status: "active", value: 33_000, overhead: 1_500, since: 40, teamCost: 13_000, progress: 38 },
    { name: "Lumen Storefront", client: "Lumen Retail", service: "web_dev", status: "active", value: 60_000, overhead: 3_000, since: 22, teamCost: 16_000, progress: 22 },
    { name: "Cobalt Brand System", client: "Cobalt Health", service: "design", status: "delivered", value: 64_000, overhead: 3_000, since: 130, teamCost: 30_000, progress: 100 },
  ];

  const projects = await Promise.all(
    P.map((p) =>
      prisma.project.create({
        data: {
          agencyId,
          clientId: cid(p.client),
          name: p.name,
          status: p.status,
          serviceType: p.service,
          contractValue: D(p.value),
          teamCost: D(p.teamCost),
          allocatedOverhead: D(p.overhead),
          startDate: day(-p.since),
          deadline: day(p.status === "delivered" ? -10 : 55 - p.since / 2),
          progressPercentage: p.progress,
          createdAt: day(-p.since),
        },
      }),
    ),
  );

  // ---- project expenses: 5 small items per project at well-spread dates ----
  const expenseRows: Prisma.ProjectExpenseCreateManyInput[] = [];
  const cats = ["software", "design", "freelance", "hosting", "materials"];
  projects.forEach((proj, idx) => {
    const spec = P[idx];
    for (let k = 0; k < 5; k++) {
      const back = 4 + ((idx * 7 + k * 11) % 27); // 4..30, deterministic spread
      expenseRows.push({
        projectId: proj.id,
        category: cats[k],
        amount: D(320 + ((idx + k) % 4) * 260), // 320..1100
        description: `${cats[k]} — ${proj.name}`,
        dateIncurred: day(-back),
        createdBy: primaryUserId,
      });
    }
    if (spec.bigExpense) {
      expenseRows.push({
        projectId: proj.id,
        category: "freelance",
        amount: D(spec.bigExpense),
        description: `Contract build help — ${proj.name}`,
        dateIncurred: day(-19),
        createdBy: primaryUserId,
      });
    }
  });
  await prisma.projectExpense.createMany({ data: expenseRows });

  const yr = new Date().getFullYear();
  let seq = 20;
  const invNo = () => `INV-${yr}-${String(seq++).padStart(3, "0")}`;
  const helio = projects.find((p) => p.name === "Helio App Launch")!;
  const northwind = projects.find((p) => p.name === "Northwind Rebrand")!;

  async function paidInvoice(project: { id: string; clientId: string }, amount: number, back: number) {
    const inv = await prisma.invoice.create({
      data: {
        agencyId,
        clientId: project.clientId,
        projectId: project.id,
        invoiceNumber: invNo(),
        amount: D(amount),
        status: "paid",
        issueDate: day(-back - 6),
        dueDate: day(-back + 3),
        sentDate: day(-back - 6),
        paidDate: day(-back),
        createdBy: primaryUserId,
      },
    });
    await prisma.payment.create({
      data: {
        invoiceId: inv.id,
        amount: D(amount),
        paymentDate: day(-back),
        paymentMethod: back % 2 ? "card" : "bank_transfer",
        recordedBy: primaryUserId,
      },
    });
  }

  // Historical milestone payments — build lifetime revenue + the MoM baseline
  // (two land in the first days of last month), none inside the 30-day chart.
  await paidInvoice(helio, 41_000, 62);
  await paidInvoice(projects.find((p) => p.name === "Cobalt Brand System")!, 34_000, 50);
  // two land in the first days of last month -> the MoM comparison baseline
  await paidInvoice(northwind, 27_000, 37);
  await paidInvoice(projects.find((p) => p.name === "Vector Site Refresh")!, 30_000, 34);

  // Progress payments every ~2.5 days across the 30-day window -> the revenue
  // curve on the profit chart, plus a believable month-to-date figure.
  // ~18 progress payments, roughly every 1.6 days, so any 7-day window catches
  // a consistent number of them and the revenue line stays smooth.
  for (let i = 0; i < 18; i++) {
    const back = Math.max(1, Math.round(30 - i * 1.65));
    const amount = 12_500 + (i % 3) * 1_500 + (i % 2) * 1_100;
    await paidInvoice(i % 2 ? helio : northwind, amount, back);
  }

  // Open receivables — created last so they're the "recent" rows in the table.
  const open: [string, number, number, number, string][] = [
    // project, amount, issuedBack, dueBack, status
    ["Meridian Campaign", 18_000, 10, -18, "sent"],
    ["Lumen Storefront", 12_500, 3, -27, "draft"],
    ["Helio App Launch", 24_000, 7, -21, "sent"],
    ["Acre Storefront", 9_800, 54, 39, "sent"], // overdue >30d
    ["Brightpath Advisory", 14_500, 46, 34, "sent"], // overdue >30d
  ];
  for (const [name, amount, issued, due, status] of open) {
    const proj = projects.find((p) => p.name === name)!;
    await prisma.invoice.create({
      data: {
        agencyId,
        clientId: proj.clientId,
        projectId: proj.id,
        invoiceNumber: invNo(),
        amount: D(amount),
        status,
        issueDate: day(-issued),
        dueDate: day(-due),
        sentDate: status === "draft" ? null : day(-issued),
        createdBy: primaryUserId,
      },
    });
  }

  const [pc, cc, ic, ec] = await prisma.$transaction([
    prisma.project.count({ where: { agencyId } }),
    prisma.client.count({ where: { agencyId } }),
    prisma.invoice.count({ where: { agencyId } }),
    prisma.projectExpense.count({ where: { project: { agencyId } } }),
  ]);
  console.log(
    `Seeded agency ${agencyId}: ${pc} projects, ${cc} clients, ${ic} invoices, ${ec} expenses.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
