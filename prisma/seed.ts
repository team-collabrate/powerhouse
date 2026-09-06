/*
  Seeds an agency with realistic demo data so the dashboard shows live numbers.

  By default it creates (or reuses) a standalone "Meridian Studio" demo agency.
  To attach the data to YOUR signed-up account instead, set SEED_EMAIL:

    SEED_EMAIL=you@example.com npm run db:seed

  Re-running is idempotent: it clears the agency's projects / clients / invoices
  first, then re-inserts.
*/
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

const daysAgo = (d: number) => {
  const x = new Date();
  x.setDate(x.getDate() - d);
  return x;
};
const monthsAgo = (m: number) => {
  const x = new Date();
  x.setMonth(x.getMonth() - m, 12);
  return x;
};
const D = (n: number) => new Prisma.Decimal(n);

async function resolveAgency() {
  const email = process.env.SEED_EMAIL;
  if (email) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new Error(
        `SEED_EMAIL=${email} has no user row. Sign up first, then re-run.`,
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
      internalCostRate: D(0),
    },
  });
  return { agencyId: agency.id, primaryUserId: owner.id };
}

async function main() {
  const { agencyId, primaryUserId } = await resolveAgency();

  // --- reset agency-scoped demo data ---
  await prisma.payment.deleteMany({ where: { invoice: { agencyId } } });
  await prisma.invoice.deleteMany({ where: { agencyId } });
  await prisma.projectHours.deleteMany({ where: { project: { agencyId } } });
  await prisma.projectExpense.deleteMany({ where: { project: { agencyId } } });
  await prisma.milestone.deleteMany({ where: { project: { agencyId } } });
  await prisma.project.deleteMany({ where: { agencyId } });
  await prisma.client.deleteMany({ where: { agencyId } });
  await prisma.companyExpense.deleteMany({ where: { agencyId } });
  await prisma.user.deleteMany({
    where: { agencyId, id: { not: primaryUserId }, email: { endsWith: "@meridian.demo" } },
  });

  // --- team (billable cost rates) ---
  const team = await Promise.all(
    [
      ["Priya Anand", 95],
      ["Marcus Lee", 120],
      ["Tomás Rivera", 80],
      ["Dana Whitfield", 140],
    ].map(([fullName, rate], i) =>
      prisma.user.create({
        data: {
          email: `member${i + 1}@meridian.demo`,
          fullName: fullName as string,
          role: "team_member",
          agencyId,
          internalCostRate: D(rate as number),
        },
      }),
    ),
  );
  await prisma.user.update({
    where: { id: primaryUserId },
    data: { internalCostRate: D(150) },
  });
  const staff = [{ id: primaryUserId, rate: 150 }, ...team.map((t) => ({ id: t.id, rate: Number(t.internalCostRate) }))];

  // --- clients spread across the last 6 months ---
  const clientSpecs = [
    ["Northwind Traders", "Isla Fenn", 5],
    ["Helio Labs", "Ken Ortho", 5],
    ["Acre & Co.", "Rosa Dane", 4],
    ["Vector Studio", "Paul Mreen", 3],
    ["Meridian Group", "Ada Cole", 2],
    ["Brightpath", "Sam Rueda", 1],
    ["Cobalt Health", "Nina Park", 0],
  ] as const;
  const clients = await Promise.all(
    clientSpecs.map(([name, contact, m]) =>
      prisma.client.create({
        data: {
          agencyId,
          name: contact,
          companyName: name,
          email: `hello@${name.toLowerCase().replace(/[^a-z]/g, "")}.com`,
          createdAt: monthsAgo(m),
        },
      }),
    ),
  );
  const clientId = (name: string) =>
    clients[clientSpecs.findIndex((c) => c[0] === name)].id;

  // --- projects ---
  const projectSpecs = [
    { name: "Northwind Rebrand", client: "Northwind Traders", service: "design", status: "active", value: 84_000, overhead: 4_000 },
    { name: "Helio App Launch", client: "Helio Labs", service: "web_dev", status: "active", value: 120_000, overhead: 6_000 },
    { name: "Acre Storefront", client: "Acre & Co.", service: "web_dev", status: "active", value: 46_000, overhead: 3_000 },
    { name: "Vector Site Refresh", client: "Vector Studio", service: "web_dev", status: "active", value: 38_000, overhead: 2_000 },
    { name: "Meridian Campaign Q3", client: "Meridian Group", service: "marketing", status: "active", value: 52_000, overhead: 2_500 },
    { name: "Brightpath Advisory", client: "Brightpath", service: "consulting", status: "active", value: 30_000, overhead: 1_500 },
    { name: "Cobalt Brand System", client: "Cobalt Health", service: "design", status: "delivered", value: 64_000, overhead: 3_000 },
    { name: "Helio Growth Retainer", client: "Helio Labs", service: "marketing", status: "active", value: 24_000, overhead: 1_000 },
  ];

  const projects = await Promise.all(
    projectSpecs.map((p) =>
      prisma.project.create({
        data: {
          agencyId,
          clientId: clientId(p.client),
          name: p.name,
          status: p.status,
          serviceType: p.service,
          contractValue: D(p.value),
          allocatedOverhead: D(p.overhead),
          startDate: daysAgo(60),
          deadline: daysAgo(-30),
          progressPercentage: 55,
        },
      }),
    ),
  );

  // --- hours: spread across the last 30 days, weighted so margins vary ---
  const hourRows: Prisma.ProjectHoursCreateManyInput[] = [];
  projects.forEach((proj, idx) => {
    const intensity = [3, 5, 8, 4, 4, 2, 1, 2][idx]; // Acre (idx 2) burns hot -> thin margin
    for (let day = 0; day < 30; day += 2) {
      const person = staff[(idx + day) % staff.length];
      hourRows.push({
        projectId: proj.id,
        userId: person.id,
        hoursLogged: D(intensity + ((day % 3) - 1)),
        dateLogged: daysAgo(day),
        description: "Project work",
      });
    }
  });
  await prisma.projectHours.createMany({ data: hourRows });

  // --- project expenses ---
  const expenseRows: Prisma.ProjectExpenseCreateManyInput[] = [];
  projects.forEach((proj, idx) => {
    [
      ["freelance", 4200],
      ["software", 900],
      ["design", 1500],
    ].forEach(([category, amount], j) => {
      expenseRows.push({
        projectId: proj.id,
        category: category as string,
        amount: D((amount as number) * (1 + idx * 0.15)),
        description: `${category} — ${proj.name}`,
        dateIncurred: daysAgo(5 + j * 7),
        createdBy: primaryUserId,
      });
    });
  });
  await prisma.projectExpense.createMany({ data: expenseRows });

  // --- invoices + payments ---
  const now = new Date();
  const yr = now.getFullYear();
  const invoiceSpecs = [
    { project: "Helio App Launch", amount: 24_000, status: "paid", issued: daysAgo(20), due: daysAgo(6), paidOn: daysAgo(4) },
    { project: "Northwind Rebrand", amount: 18_500, status: "sent", issued: daysAgo(12), due: daysAgo(-15) },
    { project: "Acre Storefront", amount: 9_200, status: "sent", issued: daysAgo(55), due: daysAgo(40) }, // -> overdue
    { project: "Vector Site Refresh", amount: 31_750, status: "paid", issued: daysAgo(38), due: daysAgo(20), paidOn: daysAgo(15) },
    { project: "Meridian Campaign Q3", amount: 12_000, status: "draft", issued: daysAgo(2), due: daysAgo(-28) },
    { project: "Cobalt Brand System", amount: 40_000, status: "paid", issued: monthsAgo(1), due: daysAgo(45), paidOn: daysAgo(38) },
    { project: "Brightpath Advisory", amount: 15_000, status: "sent", issued: daysAgo(50), due: daysAgo(35) }, // -> overdue
  ];

  for (let i = 0; i < invoiceSpecs.length; i++) {
    const spec = invoiceSpecs[i];
    const proj = projects.find((p) => p.name === spec.project)!;
    const inv = await prisma.invoice.create({
      data: {
        agencyId,
        clientId: proj.clientId,
        projectId: proj.id,
        invoiceNumber: `INV-${yr}-${String(40 - i).padStart(3, "0")}`,
        amount: D(spec.amount),
        status: spec.status,
        issueDate: spec.issued,
        dueDate: spec.due,
        sentDate: spec.status === "draft" ? null : spec.issued,
        paidDate: spec.paidOn ?? null,
        createdBy: primaryUserId,
      },
    });
    if (spec.paidOn) {
      await prisma.payment.create({
        data: {
          invoiceId: inv.id,
          amount: D(spec.amount),
          paymentDate: spec.paidOn,
          paymentMethod: "bank_transfer",
          recordedBy: primaryUserId,
        },
      });
    }
  }

  // an extra payment landing this month so Revenue (MTD) is non-trivial
  const helioRetainer = projects.find((p) => p.name === "Helio Growth Retainer")!;
  const retainerInv = await prisma.invoice.create({
    data: {
      agencyId,
      clientId: helioRetainer.clientId,
      projectId: helioRetainer.id,
      invoiceNumber: `INV-${yr}-041`,
      amount: D(8_000),
      status: "paid",
      issueDate: daysAgo(10),
      dueDate: daysAgo(2),
      sentDate: daysAgo(10),
      paidDate: daysAgo(1),
      createdBy: primaryUserId,
    },
  });
  await prisma.payment.create({
    data: {
      invoiceId: retainerInv.id,
      amount: D(8_000),
      paymentDate: daysAgo(1),
      paymentMethod: "card",
      recordedBy: primaryUserId,
    },
  });

  console.log(`Seeded agency ${agencyId}: ${projects.length} projects, ${clients.length} clients, ${invoiceSpecs.length + 1} invoices.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
