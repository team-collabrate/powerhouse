"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Field } from "@/components/ui/Field";

export function AcceptInviteForm({
  token,
  email,
}: {
  token: string;
  email: string;
}) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setError(null);
    const res = await fetch(`/api/invite/${token}/accept`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, password }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      if (json.error?.code === "VALIDATION_ERROR" && Array.isArray(json.error.details)) {
        const fe: Record<string, string> = {};
        for (const d of json.error.details) fe[d.field] = d.issue;
        setErrors(fe);
      } else {
        setError(json.error?.message ?? "Could not accept the invite");
      }
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      <Field label="Email" value={email} disabled readOnly />
      <Field
        label="Your name"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        error={errors.fullName}
        required
        autoFocus
      />
      <Field
        label="Choose a password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
        minLength={8}
        required
      />
      {error && <p className="text-[12px] text-loss">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="inline-flex h-10 w-full items-center justify-center rounded-[var(--radius-sm)] bg-accent text-[13.5px] font-medium text-white hover:bg-accent-strong disabled:opacity-50"
      >
        {loading ? "Setting up…" : "Accept invite"}
      </button>
    </form>
  );
}
