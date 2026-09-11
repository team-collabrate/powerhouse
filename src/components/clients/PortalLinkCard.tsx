"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, ExternalLink, Link2, RefreshCw } from "react-feather";
import { Card, CardHeader } from "@/components/dashboard/Card";
import { useCan } from "@/components/providers/SessionProvider";

export function PortalLinkCard({
  clientId,
  token,
}: {
  clientId: string;
  token: string | null;
}) {
  const router = useRouter();
  const canWrite = useCan("client:write");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmRegen, setConfirmRegen] = useState(false);

  const origin =
    typeof window !== "undefined" ? window.location.origin : "";
  const url = token ? `${origin}/portal/${token}` : "";

  async function generate() {
    setBusy(true);
    const res = await fetch(`/api/clients/${clientId}/portal-token`, {
      method: "POST",
    });
    setBusy(false);
    setConfirmRegen(false);
    if (res.ok) router.refresh();
  }

  async function copy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked; user can select manually */
    }
  }

  return (
    <Card>
      <CardHeader
        title="Client portal"
        subtitle="A read-only link (no login). Shows this client their projects and invoices."
        menu={false}
      />
      <div className="px-5 pb-5 pt-3">
        {!token ? (
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-[13px] text-ink-3">No portal link yet.</p>
            {canWrite && (
              <button
                onClick={generate}
                disabled={busy}
                className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-sm)] bg-accent px-3.5 text-[13px] font-medium text-white hover:bg-accent-strong disabled:opacity-50"
              >
                <Link2 size={14} />
                {busy ? "Generating…" : "Generate link"}
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-hairline bg-surface-sunken px-3 py-2">
              <span className="flex-1 truncate font-mono text-[12px] text-ink-2">
                {url}
              </span>
              <button
                onClick={copy}
                className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-[12px] font-medium text-ink-2 hover:bg-surface"
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? "Copied" : "Copy"}
              </button>
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="grid h-7 w-7 place-items-center rounded-md text-ink-3 hover:bg-surface hover:text-ink-2"
                aria-label="Open portal"
              >
                <ExternalLink size={13} />
              </a>
            </div>

            {canWrite &&
              (confirmRegen ? (
                <span className="inline-flex items-center gap-2 text-[12px]">
                  <span className="text-ink-2">
                    Regenerate? The current link stops working.
                  </span>
                  <button
                    onClick={generate}
                    disabled={busy}
                    className="font-medium text-loss hover:underline disabled:opacity-50"
                  >
                    {busy ? "…" : "Regenerate"}
                  </button>
                  <button
                    onClick={() => setConfirmRegen(false)}
                    className="text-ink-3 hover:underline"
                  >
                    Cancel
                  </button>
                </span>
              ) : (
                <button
                  onClick={() => setConfirmRegen(true)}
                  className="inline-flex items-center gap-1 text-[12px] font-medium text-ink-3 hover:text-ink-2"
                >
                  <RefreshCw size={12} />
                  Regenerate link
                </button>
              ))}
          </div>
        )}
      </div>
    </Card>
  );
}
