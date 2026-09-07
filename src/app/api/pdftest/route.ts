import { NextResponse } from "next/server";
import { renderInvoicePdf } from "@/lib/invoice-pdf";
import type { InvoicePrintData } from "@/lib/queries/invoices";

export const runtime = "nodejs";

const SAMPLE: InvoicePrintData = {
  agency: { name: "Nayan Studio", logoUrl: null, brandColor: "#9933ff" },
  client: {
    companyName: "Surya Labs",
    contactName: "Kabir Shah",
    email: "kabir@suryalabs.example",
    address: "4th Floor, Prestige Tech Park",
    city: "Bengaluru",
    state: "KA",
    country: "India",
    zipCode: "560103",
  },
  invoiceNumber: "INV-2026-099",
  projectName: "Surya Labs App Launch",
  lineItems: [
    { id: "1", description: "UX design", quantity: 3, unitPrice: 45000 },
    { id: "2", description: "Front-end build", quantity: 1, unitPrice: 220000 },
  ],
  subtotal: 355000,
  taxRatePct: 18,
  tax: 63900,
  amount: 418900,
  amountPaid: 100000,
  balance: 318900,
  status: "sent",
  issueDate: new Date().toISOString(),
  dueDate: new Date(Date.now() + 14 * 864e5).toISOString(),
  notes: "Temporary route to verify PDF rendering on Vercel — remove after.",
};

export async function GET() {
  try {
    const pdf = await renderInvoicePdf(SAMPLE);
    return new NextResponse(new Uint8Array(pdf), {
      headers: { "Content-Type": "application/pdf" },
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
