import fs from "fs";
import path from "path";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  renderToBuffer,
} from "@react-pdf/renderer";
import { invoiceTotals, lineAmount } from "@/lib/invoice-total";
import type { InvoicePrintData } from "@/lib/queries/invoices";

/* Bundled font so ₹-less "Rs." text renders identically everywhere. */
const fontDir = path.join(process.cwd(), "src", "assets", "fonts");
const dataUri = (file: string) =>
  `data:font/ttf;base64,${fs.readFileSync(path.join(fontDir, file)).toString("base64")}`;

let registered = false;
function ensureFont() {
  if (registered) return;
  Font.register({
    family: "Roboto",
    fonts: [
      { src: dataUri("Roboto-regular.ttf") },
      { src: dataUri("Roboto-bold.ttf"), fontWeight: "bold" },
    ],
  });
  registered = true;
}

const money = (n: number) =>
  "Rs. " + Math.round(n).toLocaleString("en-IN");

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const s = StyleSheet.create({
  page: {
    fontFamily: "Roboto",
    fontSize: 10,
    color: "#171717",
    padding: 44,
    lineHeight: 1.4,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 2,
    paddingBottom: 16,
    marginBottom: 20,
  },
  agencyMark: {
    width: 26,
    height: 26,
    borderRadius: 3,
    color: "#fff",
    fontSize: 13,
    fontWeight: "bold",
    textAlign: "center",
    paddingTop: 5,
    marginBottom: 6,
  },
  agencyName: { fontSize: 12, fontWeight: "bold" },
  invoiceTitle: { fontSize: 20, fontWeight: "bold", lineHeight: 1.1, marginBottom: 4 },
  invoiceNo: { fontSize: 10, color: "#737373" },
  status: {
    marginTop: 8,
    alignSelf: "flex-end",
    fontSize: 8,
    color: "#525252",
    backgroundColor: "#f5f5f5",
    paddingVertical: 2,
    paddingHorizontal: 5,
    borderRadius: 3,
    textTransform: "uppercase",
  },
  metaRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 22 },
  metaLabel: {
    fontSize: 8,
    color: "#a3a3a3",
    textTransform: "uppercase",
    marginBottom: 3,
    fontWeight: "bold",
  },
  muted: { color: "#525252" },
  tableHead: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#e5e5e5",
    paddingBottom: 5,
    fontSize: 8,
    color: "#a3a3a3",
    textTransform: "uppercase",
    fontWeight: "bold",
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#f5f5f5",
    paddingVertical: 7,
  },
  cDesc: { flex: 1 },
  cNum: { width: 90, textAlign: "right" },
  totals: { marginLeft: "auto", width: 200, marginTop: 12 },
  totalLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2,
    color: "#525252",
  },
  grandTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 2,
    marginTop: 3,
    paddingTop: 6,
    fontSize: 12,
    fontWeight: "bold",
    color: "#171717",
  },
  notes: {
    marginTop: 26,
    borderTopWidth: 1,
    borderColor: "#e5e5e5",
    paddingTop: 10,
    color: "#525252",
    fontSize: 9,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 44,
    right: 44,
    textAlign: "center",
    fontSize: 8,
    color: "#a3a3a3",
    borderTopWidth: 1,
    borderColor: "#e5e5e5",
    paddingTop: 8,
  },
});

function InvoicePdfDoc({ data }: { data: InvoicePrintData }) {
  const accent = /^#[0-9a-fA-F]{6}$/.test(data.agency.brandColor)
    ? data.agency.brandColor
    : "#9933ff";
  const { subtotal, tax, total } = invoiceTotals(data.lineItems, data.taxRatePct);
  const paid = data.amountPaid ?? 0;
  const balance = Math.max(0, total - paid);

  const addr = [
    data.client.address,
    [data.client.city, data.client.state].filter(Boolean).join(", "),
    [data.client.country, data.client.zipCode].filter(Boolean).join(" "),
  ].filter((l) => l && l.trim());

  return (
    <Document title={data.invoiceNumber}>
      <Page size="A4" style={s.page}>
        <View style={[s.headerRow, { borderColor: accent }]}>
          <View>
            <Text style={[s.agencyMark, { backgroundColor: accent }]}>
              {data.agency.name.charAt(0)}
            </Text>
            <Text style={s.agencyName}>{data.agency.name}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={s.invoiceTitle}>Invoice</Text>
            <Text style={s.invoiceNo}>{data.invoiceNumber}</Text>
            <Text style={s.status}>{data.status}</Text>
          </View>
        </View>

        <View style={s.metaRow}>
          <View>
            <Text style={s.metaLabel}>Billed to</Text>
            <Text style={{ fontWeight: "bold" }}>{data.client.companyName}</Text>
            <Text style={s.muted}>{data.client.contactName}</Text>
            <Text style={s.muted}>{data.client.email}</Text>
            {addr.map((l, i) => (
              <Text key={i} style={s.muted}>
                {l}
              </Text>
            ))}
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={s.metaLabel}>Details</Text>
            {data.issueDate && (
              <Text style={s.muted}>Issued {fmtDate(data.issueDate)}</Text>
            )}
            <Text style={s.muted}>Due {fmtDate(data.dueDate)}</Text>
          </View>
        </View>

        <View style={s.tableHead}>
          <Text style={s.cDesc}>Description</Text>
          <Text style={s.cNum}>Qty</Text>
          <Text style={s.cNum}>Rate</Text>
          <Text style={s.cNum}>Amount</Text>
        </View>
        {data.lineItems.map((li) => (
          <View key={li.id} style={s.row}>
            <Text style={s.cDesc}>{li.description || "-"}</Text>
            <Text style={s.cNum}>
              {li.quantity % 1 === 0 ? li.quantity : li.quantity.toFixed(2)}
            </Text>
            <Text style={s.cNum}>{money(li.unitPrice)}</Text>
            <Text style={s.cNum}>{money(lineAmount(li))}</Text>
          </View>
        ))}

        <View style={s.totals}>
          <View style={s.totalLine}>
            <Text>Subtotal</Text>
            <Text>{money(subtotal)}</Text>
          </View>
          {data.taxRatePct > 0 && (
            <View style={s.totalLine}>
              <Text>Tax ({data.taxRatePct}%)</Text>
              <Text>{money(tax)}</Text>
            </View>
          )}
          {paid > 0 && (
            <View style={s.totalLine}>
              <Text>Paid</Text>
              <Text>- {money(paid)}</Text>
            </View>
          )}
          <View style={[s.grandTotal, { borderColor: accent }]}>
            <Text>{paid > 0 ? "Balance due" : "Total"}</Text>
            <Text>{money(paid > 0 ? balance : total)}</Text>
          </View>
        </View>

        {data.notes ? (
          <View style={s.notes}>
            <Text style={{ fontWeight: "bold", marginBottom: 3 }}>Notes</Text>
            <Text>{data.notes}</Text>
          </View>
        ) : null}

        <Text style={s.footer}>
          {data.agency.name} · {data.invoiceNumber}
        </Text>
      </Page>
    </Document>
  );
}

export async function renderInvoicePdf(data: InvoicePrintData): Promise<Buffer> {
  ensureFont();
  return renderToBuffer(<InvoicePdfDoc data={data} />);
}
