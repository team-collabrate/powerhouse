/*
  Seeds an agency with realistic demo data so the dashboard shows live numbers
  that look like a healthy studio ~1 week into the month.

  Default: creates/reuses a standalone "Nayan Studio" demo agency.
  To attach the data to YOUR signed-up account instead:

    add  SEED_EMAIL="you@example.com"  to .env.local, then  npm run db:seed

  Re-running is idempotent (clears the agency's projects / clients / invoices
  first, then re-inserts).
*/
import { randomBytes } from "crypto";
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
// Demo money is authored in "base units"; ×R scales it to rupees so the
// figures read right for an Indian studio (a ~₹30L project, ~₹25L/mo payroll).
const R = 40;
const money = (v: number) => D(v * R);

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
    where: { subdomain: "nayan-demo" },
    update: {},
    create: {
      name: "Nayan Studio",
      subdomain: "nayan-demo",
      monthlyRevenueTarget: money(90_000),
    },
  });
  const owner = await prisma.user.upsert({
    where: { email: "owner@nayanstudio.demo" },
    update: {},
    create: {
      email: "owner@nayanstudio.demo",
      fullName: "Ananya Rao",
      role: "admin",
      agencyId: agency.id,
    },
  });
  return { agencyId: agency.id, primaryUserId: owner.id };
}

async function main() {
  const { agencyId, primaryUserId } = await resolveAgency();

  const { ensureDefaultServices } = await import("../src/lib/queries/services");
  await ensureDefaultServices(prisma, agencyId);

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
      email: { endsWith: "@nayanstudio.demo" },
    },
  });

  await prisma.agency.update({
    where: { id: agencyId },
    data: {
      name: "Nayan Studio",
      monthlyRevenueTarget: money(90_000),
      // Demo uses the `percent` rule (6% of contract value) so margins stay
      // realistic: this seed lists Core payroll under company overhead, which
      // the pool methods (even / contract_share) would over-allocate since
      // labour is already tracked per project as teamCost. Surya Labs App
      // Launch keeps a pinned per-project override below to show that path.
      overheadMethod: "percent",
      overheadRate: D(0.06),
    },
  });

  // ---- company overhead ----
  await prisma.companyExpense.createMany({
    data: (
      [
        ["rent", "Studio lease, Indiranagar", 6_500, true, "monthly"],
        ["salary", "Core payroll", 62_000, true, "monthly"],
        ["software", "Design + dev tool stack", 1_400, true, "monthly"],
        ["insurance", "Professional indemnity", 2_100, true, "quarterly"],
        ["utilities", "Power + internet", 380, true, "monthly"],
        ["other", "Team offsite, Coorg", 4_200, false, null],
      ] as const
    ).map(([category, description, amount, isRecurring, freq], i) => ({
      agencyId,
      category,
      description,
      amount: money(amount),
      dateIncurred: day(-4 - i * 3),
      isRecurring,
      recurringFrequency: freq,
      createdBy: primaryUserId,
    })),
  });

  // ---- team ----
  await Promise.all(
    ["Priya Nair", "Arjun Mehta", "Sneha Reddy", "Rahul Kulkarni"].map(
      (fullName, i) =>
        prisma.user.create({
          data: {
            email: `member${i + 1}.${agencyId.slice(-6)}@nayanstudio.demo`,
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
    ["Kirana Fresh", "Aarav Sharma", 5],
    ["Arogya Health", "Diya Menon", 4],
    ["Surya Labs", "Kabir Shah", 4],
    ["Chitra Studio", "Vivaan Rao", 3],
    ["Bhoomi & Co.", "Meera Pillai", 2],
    ["Sankalp Group", "Aditi Desai", 2],
    ["Disha Advisory", "Rohan Gupta", 1],
    ["Deepam Retail", "Ishaan Verma", 1],
    // additional clients for a fuller, gently rising growth curve
    ["Filter Coffee Co.", "Nisha Bhat", 5],
    ["Devgiri Co-op", "Karan Malhotra", 3],
    ["Garud Media", "Isha Kapoor", 3],
    ["Banyan Cafe", "Dev Joshi", 2],
    ["Ayur Spa", "Tara Nanda", 1],
    ["Koyal Foods", "Neha Sinha", 0],
    ["Neel Textiles", "Manav Rege", 0],
    ["Akhada Fitness", "Aryan Bose", 0],
    ["Neer Swimwear", "Riya Chawla", 0],
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

  // portal links for the clients that have work
  for (const c of clients.slice(0, 6)) {
    await prisma.client.update({
      where: { id: c.id },
      data: { portalToken: randomBytes(18).toString("base64url") },
    });
  }

  // ---- projects: `teamCost` is the estimated internal labour cost, tuned so
  // each project lands on a sensible margin. Bhoomi Storefront is deliberately
  // under 15% so the "under margin" insight fires. `since` = project age in days.
  // `overhead` is a per-project OVERRIDE, left at 0 so the agency rule
  // (6% of contract value) applies; Surya Labs pins its own value. ----
  const P = [
    { name: "Kirana Fresh Rebrand", client: "Kirana Fresh", service: "design", status: "active", value: 84_000, overhead: 0, since: 74, teamCost: 30_000, progress: 62 },
    { name: "Surya Labs App Launch", client: "Surya Labs", service: "web_dev", status: "active", value: 145_000, overhead: 7_000, since: 74, teamCost: 47_000, progress: 48 },
    { name: "Bhoomi Storefront", client: "Bhoomi & Co.", service: "web_dev", status: "active", value: 32_000, overhead: 0, since: 74, teamCost: 18_000, progress: 70, bigExpense: 7_000 },
    { name: "Chitra Site Refresh", client: "Chitra Studio", service: "web_dev", status: "active", value: 41_000, overhead: 0, since: 62, teamCost: 15_000, progress: 55 },
    { name: "Sankalp Campaign", client: "Sankalp Group", service: "marketing", status: "active", value: 52_000, overhead: 0, since: 55, teamCost: 21_000, progress: 44 },
    { name: "Disha Advisory Portal", client: "Disha Advisory", service: "consulting", status: "active", value: 33_000, overhead: 0, since: 40, teamCost: 13_000, progress: 38 },
    { name: "Deepam Storefront", client: "Deepam Retail", service: "web_dev", status: "active", value: 60_000, overhead: 0, since: 22, teamCost: 16_000, progress: 22 },
    { name: "Arogya Brand System", client: "Arogya Health", service: "design", status: "delivered", value: 64_000, overhead: 0, since: 130, teamCost: 30_000, progress: 100 },
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
          contractValue: money(p.value),
          teamCost: money(p.teamCost),
          allocatedOverhead: money(p.overhead),
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
        amount: money(320 + ((idx + k) % 4) * 260), // ~₹12.8k..44k
        description: `${cats[k]} for ${proj.name}`,
        dateIncurred: day(-back),
        createdBy: primaryUserId,
      });
    }
    if (spec.bigExpense) {
      expenseRows.push({
        projectId: proj.id,
        category: "freelance",
        amount: money(spec.bigExpense),
        description: `Contract build help for ${proj.name}`,
        dateIncurred: day(-19),
        createdBy: primaryUserId,
      });
    }
  });
  await prisma.projectExpense.createMany({ data: expenseRows });

  const yr = new Date().getFullYear();
  let seq = 20;
  const invNo = () => `INV-${yr}-${String(seq++).padStart(3, "0")}`;
  const helio = projects.find((p) => p.name === "Surya Labs App Launch")!;
  const northwind = projects.find((p) => p.name === "Kirana Fresh Rebrand")!;

  async function paidInvoice(project: { id: string; clientId: string }, amount: number, back: number) {
    const inv = await prisma.invoice.create({
      data: {
        agencyId,
        clientId: project.clientId,
        projectId: project.id,
        invoiceNumber: invNo(),
        amount: money(amount),
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
        amount: money(amount),
        paymentDate: day(-back),
        paymentMethod: back % 2 ? "card" : "bank_transfer",
        recordedBy: primaryUserId,
      },
    });
  }

  // Historical milestone payments: build lifetime revenue + the MoM baseline
  // (two land in the first days of last month), none inside the 30-day chart.
  await paidInvoice(helio, 41_000, 62);
  await paidInvoice(projects.find((p) => p.name === "Arogya Brand System")!, 34_000, 50);
  // two land in the first days of last month -> the MoM comparison baseline
  await paidInvoice(northwind, 27_000, 37);
  await paidInvoice(projects.find((p) => p.name === "Chitra Site Refresh")!, 30_000, 34);

  // Progress payments every ~2.5 days across the 30-day window -> the revenue
  // curve on the profit chart, plus a believable month-to-date figure.
  // ~18 progress payments, roughly every 1.6 days, so any 7-day window catches
  // a consistent number of them and the revenue line stays smooth.
  for (let i = 0; i < 18; i++) {
    const back = Math.max(1, Math.round(30 - i * 1.65));
    const amount = 12_500 + (i % 3) * 1_500 + (i % 2) * 1_100;
    await paidInvoice(i % 2 ? helio : northwind, amount, back);
  }

  // Open receivables, created last so they're the "recent" rows in the table.
  const open: [string, number, number, number, string][] = [
    // project, amount, issuedBack, dueBack, status
    ["Sankalp Campaign", 18_000, 10, -18, "sent"],
    ["Deepam Storefront", 12_500, 3, -27, "draft"],
    ["Surya Labs App Launch", 24_000, 7, -21, "sent"],
    ["Bhoomi Storefront", 9_800, 54, 39, "sent"], // overdue >30d
    ["Disha Advisory Portal", 14_500, 46, 34, "sent"], // overdue >30d
  ];
  for (const [name, amount, issued, due, status] of open) {
    const proj = projects.find((p) => p.name === name)!;
    await prisma.invoice.create({
      data: {
        agencyId,
        clientId: proj.clientId,
        projectId: proj.id,
        invoiceNumber: invNo(),
        amount: money(amount),
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
