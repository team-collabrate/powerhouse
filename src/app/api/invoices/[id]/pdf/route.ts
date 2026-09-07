import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api";
import { getInvoicePrintData } from "@/lib/queries/invoices";
import { renderInvoicePdf } from "@/lib/invoice-pdf";

export const runtime = "nodejs";
export const maxDuration = 30;

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const auth = await requireSession();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  const data = await getInvoicePrintData(auth.agencyId, id);
  if (!data) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "Invoice not found" } },
      { status: 404 },
    );
  }

  const pdf = await renderInvoicePdf(data);
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${data.invoiceNumber}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
