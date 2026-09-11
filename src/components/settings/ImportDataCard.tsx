"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, Copy, Upload } from "react-feather";
import { Card, CardHeader } from "@/components/dashboard/Card";
import { DATA_IMPORT_PROMPT } from "@/lib/import/prompt";

type FileKey = "clients" | "projects" | "invoices" | "payments";
const FILE_SLOTS: { key: FileKey; label: string; required: boolean }[] = [
  { key: "clients", label: "clients.csv", required: true },
  { key: "projects", label: "projects.csv", required: true },
  { key: "invoices", label: "invoices.csv", required: false },
  { key: "payments", label: "payments.csv", required: false },
];

interface RowIssue {
  file: string;
  row: number;
  message: string;
}
interface PreviewState {
  counts: { clients: number; projects: number; invoices: number; payments: number };
  errors: RowIssue[];
  warnings: RowIssue[];
}

export function ImportDataCard() {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [files, setFiles] = useState<Partial<Record<FileKey, File>>>({});
  const [busy, setBusy] = useState<"preview" | "commit" | null>(null);
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [committed, setCommitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRefs = useRef<Partial<Record<FileKey, HTMLInputElement | null>>>({});

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(DATA_IMPORT_PROMPT);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setError("Couldn't copy — your browser blocked clipboard access.");
    }
  }

  function pickFile(key: FileKey, file: File | undefined) {
    setPreview(null);
    setCommitted(false);
    setError(null);
    setFiles((f) => ({ ...f, [key]: file }));
  }

  function buildForm(commit: boolean): FormData {
    const fd = new FormData();
    for (const { key } of FILE_SLOTS) {
      const f = files[key];
      if (f) fd.append(key, f);
    }
    fd.append("commit", String(commit));
    return fd;
  }

  async function runPreview() {
    setBusy("preview");
    setError(null);
    setPreview(null);
    const res = await fetch("/api/settings/import", { method: "POST", body: buildForm(false) });
    const json = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) {
      if (json.error?.details?.errors) {
        setPreview({
          counts: json.error.details.counts,
          errors: json.error.details.errors,
          warnings: json.error.details.warnings ?? [],
        });
      } else {
        setError(json.error?.message ?? "Preview failed");
      }
      return;
    }
    setPreview({ counts: json.data.counts, errors: [], warnings: json.data.warnings ?? [] });
  }

  async function runCommit() {
    setBusy("commit");
    setError(null);
    const res = await fetch("/api/settings/import", { method: "POST", body: buildForm(true) });
    const json = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) {
      setError(json.error?.message ?? "Import failed — nothing was changed.");
      return;
    }
    setCommitted(true);
    setPreview({ counts: json.data.counts, errors: [], warnings: json.data.warnings ?? [] });
    router.refresh();
  }

  const canPreview = !!files.clients && !!files.projects;
  const canCommit = preview && preview.errors.length === 0 && !committed;

  return (
    <Card>
      <CardHeader
        title="Import your data"
        subtitle="Bring in clients, projects, invoices, and payments from a spreadsheet"
        menu={false}
      />
      <div className="space-y-4 px-5 pb-5 pt-2">
        <div className="rounded-[var(--radius-sm)] border border-hairline bg-surface-sunken p-3.5">
          <p className="text-[13px] text-ink-2">
            Don&apos;t have a clean spreadsheet? Copy this prompt, paste it into
            ChatGPT/Claude/etc. along with whatever records you already have
            (Excel, PDF, notes), and it&apos;ll hand back the 4 files below.
            Your data goes straight to the LLM you choose — never through us.
          </p>
          <button
            type="button"
            onClick={copyPrompt}
            className="mt-2.5 inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-sm)] border border-hairline-strong bg-surface px-2.5 text-[12.5px] font-medium text-ink hover:bg-surface-raised"
          >
            {copied ? <Check size={13} className="text-profit" /> : <Copy size={13} />}
            {copied ? "Copied" : "Copy prompt"}
          </button>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-2">
          {FILE_SLOTS.map(({ key, label, required }) => (
            <div key={key}>
              <button
                type="button"
                onClick={() => inputRefs.current[key]?.click()}
                className="flex h-10 w-full items-center gap-2 rounded-[var(--radius-sm)] border border-dashed border-hairline-strong bg-surface px-3 text-left text-[13px] text-ink-2 hover:bg-surface-sunken"
              >
                <Upload size={14} className="shrink-0 text-ink-3" />
                <span className="truncate">
                  {files[key]?.name ?? label}
                  {required && !files[key] && <span className="text-loss"> *</span>}
                </span>
              </button>
              <input
                ref={(el) => {
                  inputRefs.current[key] = el;
                }}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => pickFile(key, e.target.files?.[0])}
              />
            </div>
          ))}
        </div>

        {error && <p className="text-[12.5px] text-loss">{error}</p>}

        {preview && (
          <div className="rounded-[var(--radius-sm)] border border-hairline p-3.5">
            {committed ? (
              <p className="flex items-center gap-1.5 text-[13px] font-medium text-profit">
                <Check size={14} /> Imported successfully
              </p>
            ) : (
              <p className="text-[13px] font-medium text-ink">
                {preview.errors.length === 0 ? "Ready to import" : "Fix these before importing"}
              </p>
            )}
            <p className="mt-1 text-[12.5px] text-ink-3">
              {preview.counts.clients} clients · {preview.counts.projects} projects ·{" "}
              {preview.counts.invoices} invoices · {preview.counts.payments} payments
            </p>
            {preview.errors.length > 0 && (
              <ul className="mt-2 space-y-1">
                {preview.errors.slice(0, 20).map((e, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-[12.5px] text-loss">
                    <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                    <span>
                      {e.file}.csv, row {e.row}: {e.message}
                    </span>
                  </li>
                ))}
                {preview.errors.length > 20 && (
                  <li className="text-[12.5px] text-ink-3">
                    …and {preview.errors.length - 20} more
                  </li>
                )}
              </ul>
            )}
            {preview.warnings.length > 0 && (
              <ul className="mt-2 space-y-1">
                {preview.warnings.slice(0, 10).map((w, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-[12.5px] text-ink-3">
                    <AlertTriangle size={12} className="mt-0.5 shrink-0 text-[color:var(--accent)]" />
                    <span>
                      {w.file}.csv, row {w.row}: {w.message}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!canPreview || busy !== null}
            onClick={runPreview}
            className="inline-flex h-9 items-center rounded-[var(--radius-sm)] border border-hairline-strong bg-surface px-3.5 text-[13px] font-medium text-ink hover:bg-surface-sunken disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy === "preview" ? "Checking…" : "Preview"}
          </button>
          <button
            type="button"
            disabled={!canCommit || busy !== null}
            onClick={runCommit}
            className="inline-flex h-9 items-center rounded-[var(--radius-sm)] bg-accent px-3.5 text-[13px] font-medium text-white hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy === "commit" ? "Importing…" : "Import"}
          </button>
        </div>
        <p className="text-[12px] text-ink-3">
          Always Preview first — Import writes straight to your live data and
          can&apos;t be undone from here.
        </p>
      </div>
    </Card>
  );
}
