"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "react-feather";
import { Field } from "@/components/ui/Field";
import { Select } from "@/components/ui/Select";
import { ASSIGNABLE_ROLES } from "@/lib/validation/team";
import { ROLE_LABELS, type Role } from "@/lib/permissions";

export function InviteDialog({
  trigger,
}: {
  trigger: (open: () => void) => React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("team_member");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ link: string; note: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  function openDialog() {
    setEmail("");
    setRole("team_member");
    setErrors({});
    setResult(null);
    setCopied(false);
    setOpen(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    const res = await fetch("/api/team/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role }),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) {
      if (json.error?.code === "VALIDATION_ERROR" && Array.isArray(json.error.details)) {
        const fe: Record<string, string> = {};
        for (const d of json.error.details) fe[d.field] = d.issue;
        setErrors(fe);
      } else {
        setErrors({ email: json.error?.message ?? "Could not send invite" });
      }
      return;
    }
    setResult({ link: json.data.link, note: json.data.note });
    router.refresh();
  }

  return (
    <>
      {trigger(openDialog)}
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-8">
          <button
            aria-label="Close"
            className="fixed inset-0 bg-ink/25"
            onClick={() => setOpen(false)}
          />
          <div className="relative z-10 w-full max-w-[420px] rounded-[var(--radius-md)] border border-hairline bg-surface shadow-[var(--shadow-pop)]">
            <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
              <h3 className="text-[15px] font-semibold text-ink">Invite a teammate</h3>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="grid h-7 w-7 place-items-center rounded-md text-ink-3 hover:bg-surface-sunken"
              >
                <X size={16} />
              </button>
            </div>

            {result ? (
              <div className="space-y-3 px-5 py-5">
                <p className="text-[13px] text-ink-2">{result.note}</p>
                <div className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-hairline bg-surface-sunken px-3 py-2">
                  <span className="flex-1 truncate font-mono text-[12px] text-ink-2">
                    {result.link}
                  </span>
                  <button
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(result.link);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 1500);
                      } catch {}
                    }}
                    className="rounded-md px-2 text-[12px] font-medium text-ink-2 hover:bg-surface"
                  >
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="inline-flex h-9 items-center rounded-[var(--radius-sm)] bg-accent px-3.5 text-[13px] font-medium text-white hover:bg-accent-strong"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4 px-5 py-5">
                <Field
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={errors.email}
                  autoFocus
                  required
                />
                <Select
                  label="Role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  {ASSIGNABLE_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r as Role]}
                    </option>
                  ))}
                </Select>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="inline-flex h-9 items-center rounded-[var(--radius-sm)] border border-hairline-strong bg-surface px-3.5 text-[13px] font-medium text-ink hover:bg-surface-sunken"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex h-9 items-center rounded-[var(--radius-sm)] bg-accent px-3.5 text-[13px] font-medium text-white hover:bg-accent-strong disabled:opacity-50"
                  >
                    {saving ? "Creating…" : "Create invite"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
