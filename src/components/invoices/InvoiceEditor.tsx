"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2 } from "react-feather";
import { Field } from "@/components/ui/Field";
import { Textarea } from "@/components/ui/Textarea";
import { formatCurrency } from "@/lib/format";
import { invoiceTotals, lineAmount } from "@/lib/invoice-total";
import {
  InvoiceDocument,
  type InvoiceDocLine,
} from "@/components/invoices/InvoiceDocument";

interface Row {
  description: string;
  quantity: string;
  unitPrice: string;
}

interface Props {
  invoiceId: string;
  invoiceNumber: string;
  agency: { name: string; logoUrl: string | null; brandColor: string };
  client: {
    companyName: string;
    contactName: string;
    email: string;
    addressLines: string[];
  };
  initial: {
    issueDate: string;
    dueDate: string;
    notes: string;
    taxRatePct: number;
    lineItems: { description: string; quantity: number; unitPrice: number }[];
  };
}

const toRow = (li: {
  description: string;
  quantity: number;
  unitPrice: number;
}): Row => ({
  description: li.description,
  quantity: String(li.quantity),
  unitPrice: String(li.unitPrice),
});

const numeric = (s: string) => {
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
};

export function InvoiceEditor({
  invoiceId,
  invoiceNumber,
  agency,
  client,
  initial,
}: Props) {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>(
    initial.lineItems.length ? initial.lineItems.map(toRow) : [{ description: "", quantity: "1", unitPrice: "0" }],
  );
  const [taxRatePct, setTaxRatePct] = useState(String(initial.taxRatePct || 0));
  const [issueDate, setIssueDate] = useState(initial.issueDate);
  const [dueDate, setDueDate] = useState(initial.dueDate);
  const [notes, setNotes] = useState(initial.notes);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<null | "save" | "send">(null);

  const docLines: InvoiceDocLine[] = useMemo(
    () =>
      rows.map((r) => ({
        description: r.description,
        quantity: numeric(r.quantity),
        unitPrice: numeric(r.unitPrice),
      })),
    [rows],
  );
  const totals = invoiceTotals(docLines, numeric(taxRatePct));

  function setRow(i: number, patch: Partial<Row>) {
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  function addRow() {
    setRows((rs) => [...rs, { description: "", quantity: "1", unitPrice: "0" }]);
  }
  function removeRow(i: number) {
    setRows((rs) => (rs.length === 1 ? rs : rs.filter((_, idx) => idx !== i)));
  }

  async function save(then: "stay" | "send") {
    setBusy(then === "send" ? "send" : "save");
    setErrors({});
    const res = await fetch(`/api/invoices/${invoiceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        issueDate: issueDate || undefined,
        dueDate: dueDate || undefined,
        notes,
        taxRatePct,
        lineItems: docLines,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      setBusy(null);
      if (json.error?.code === "VALIDATION_ERROR" && Array.isArray(json.error.details)) {
        const fe: Record<string, string> = {};
        for (const d of json.error.details) fe[d.field] = d.issue;
        setErrors(fe);
      } else {
        setErrors({ _: json.error?.message ?? "Save failed" });
      }
      return;
    }

    if (then === "send") {
      const sres = await fetch(`/api/invoices/${invoiceId}/send`, { method: "POST" });
      setBusy(null);
      if (!sres.ok) {
        const j = await sres.json().catch(() => null);
        setErrors({ _: j?.error?.message ?? "Saved, but sending failed" });
        return;
      }
      router.push(`/invoices/${invoiceId}`);
      router.refresh();
    } else {
      setBusy(null);
      router.push(`/invoices/${invoiceId}`);
      router.refresh();
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push(`/invoices/${invoiceId}`)}
          className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-ink-3 hover:text-ink-2"
        >
          <ArrowLeft size={14} />
          {invoiceNumber}
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => save("stay")}
            disabled={busy !== null}
            className="inline-flex h-9 items-center rounded-[var(--radius-sm)] border border-hairline-strong bg-surface px-3.5 text-[13px] font-medium text-ink hover:bg-surface-sunken disabled:opacity-50"
          >
            {busy === "save" ? "Saving…" : "Save draft"}
          </button>
          <button
            onClick={() => save("send")}
            disabled={busy !== null}
            className="inline-flex h-9 items-center rounded-[var(--radius-sm)] bg-accent px-3.5 text-[13px] font-medium text-white hover:bg-accent-strong disabled:opacity-50"
          >
            {busy === "send" ? "Sending…" : "Save & send"}
          </button>
        </div>
      </div>

      {errors._ && <p className="text-[13px] text-loss">{errors._}</p>}
      {errors.lineItems && (
        <p className="text-[13px] text-loss">{errors.lineItems}</p>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,440px)_1fr]">
        {/* ---- form ---- */}
        <div className="space-y-4">
          <div className="rounded-[var(--radius-md)] border border-hairline bg-surface-raised p-4">
            <p className="eyebrow mb-3">Line items</p>
            <div className="space-y-3">
              {rows.map((r, i) => (
                <div key={i} className="rounded-[var(--radius-sm)] border border-hairline p-2.5">
                  <input
                    value={r.description}
                    onChange={(e) => setRow(i, { description: e.target.value })}
                    placeholder="Description"
                    className="mb-2 h-8 w-full rounded-md border border-hairline bg-surface px-2 text-[13px] outline-none focus:border-accent"
                  />
                  <div className="flex items-center gap-2">
                    <label className="flex-1">
                      <span className="mb-0.5 block text-[10.5px] text-ink-3">Qty</span>
                      <input
                        type="number"
                        min={0}
                        step="1"
                        value={r.quantity}
                        onChange={(e) => setRow(i, { quantity: e.target.value })}
                        className="h-8 w-full rounded-md border border-hairline bg-surface px-2 text-[13px] outline-none focus:border-accent"
                      />
                    </label>
                    <label className="flex-1">
                      <span className="mb-0.5 block text-[10.5px] text-ink-3">Rate (₹)</span>
                      <input
                        type="number"
                        min={0}
                        step="100"
                        value={r.unitPrice}
                        onChange={(e) => setRow(i, { unitPrice: e.target.value })}
                        className="h-8 w-full rounded-md border border-hairline bg-surface px-2 text-[13px] outline-none focus:border-accent"
                      />
                    </label>
                    <div className="w-24 shrink-0 text-right">
                      <span className="mb-0.5 block text-[10.5px] text-ink-3">Amount</span>
                      <span className="tnum text-[13px] font-medium text-ink">
                        {formatCurrency(
                          lineAmount({
                            quantity: numeric(r.quantity),
                            unitPrice: numeric(r.unitPrice),
                          }),
                        )}
                      </span>
                    </div>
                    <button
                      onClick={() => removeRow(i)}
                      disabled={rows.length === 1}
                      aria-label="Remove line"
                      className="mt-3 grid h-7 w-7 shrink-0 place-items-center rounded-md text-ink-3 hover:bg-surface-sunken hover:text-ink-2 disabled:opacity-30"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={addRow}
              className="mt-3 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-accent-strong hover:underline"
            >
              <Plus size={13} /> Add line
            </button>

            <div className="mt-4 border-t border-hairline pt-3">
              <label className="flex items-center justify-between text-[13px]">
                <span className="text-ink-2">Tax rate (%)</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step="0.5"
                  value={taxRatePct}
                  onChange={(e) => setTaxRatePct(e.target.value)}
                  className="h-8 w-24 rounded-md border border-hairline bg-surface px-2 text-right text-[13px] outline-none focus:border-accent"
                />
              </label>
              <div className="mt-2 space-y-1 text-[12.5px]">
                <Row label="Subtotal" value={formatCurrency(totals.subtotal)} />
                {numeric(taxRatePct) > 0 && (
                  <Row label={`Tax`} value={formatCurrency(totals.tax)} />
                )}
                <Row label="Total" value={formatCurrency(totals.total)} strong />
              </div>
            </div>
          </div>

          <div className="rounded-[var(--radius-md)] border border-hairline bg-surface-raised p-4">
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Issue date"
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                error={errors.issueDate}
              />
              <Field
                label="Due date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                error={errors.dueDate}
              />
            </div>
            <div className="mt-3">
              <Textarea
                label="Notes (optional)"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                error={errors.notes}
              />
            </div>
          </div>
        </div>

        {/* ---- live preview ---- */}
        <div className="lg:sticky lg:top-20">
          <p className="eyebrow mb-2">Preview</p>
          <div className="overflow-hidden rounded-[var(--radius-md)] border border-hairline bg-neutral-100 p-4">
            <div className="origin-top scale-[0.82] sm:scale-90">
              <InvoiceDocument
                agency={agency}
                client={client}
                invoiceNumber={invoiceNumber}
                status="draft"
                issueDate={issueDate || null}
                dueDate={dueDate}
                lineItems={docLines}
                taxRatePct={numeric(taxRatePct)}
                notes={notes || null}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div
      className={`flex justify-between ${strong ? "border-t border-hairline pt-1 font-semibold text-ink" : "text-ink-3"}`}
    >
      <span>{label}</span>
      <span className="tnum">{value}</span>
    </div>
  );
}
