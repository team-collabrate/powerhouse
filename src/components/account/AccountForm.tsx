"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader } from "@/components/dashboard/Card";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

export function AccountForm({
  fullName: initialName,
  email,
}: {
  fullName: string;
  email: string;
}) {
  const router = useRouter();

  const [name, setName] = useState(initialName);
  const [nameErr, setNameErr] = useState<string | null>(null);
  const [nameStatus, setNameStatus] = useState<"idle" | "saving" | "saved">(
    "idle",
  );

  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [pwErr, setPwErr] = useState<string | null>(null);
  const [pwStatus, setPwStatus] = useState<"idle" | "saving" | "saved">("idle");

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    setNameErr(null);
    setNameStatus("saving");
    const res = await fetch("/api/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName: name }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => null);
      setNameErr(j?.error?.details?.[0]?.issue ?? j?.error?.message ?? "Failed");
      setNameStatus("idle");
      return;
    }
    setNameStatus("saved");
    router.refresh();
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwErr(null);
    if (pw.length < 8) return setPwErr("Use at least 8 characters.");
    if (pw !== pw2) return setPwErr("Passwords don't match.");
    setPwStatus("saving");
    const { error } = await createClient().auth.updateUser({ password: pw });
    if (error) {
      setPwErr(error.message);
      setPwStatus("idle");
      return;
    }
    setPw("");
    setPw2("");
    setPwStatus("saved");
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader title="Profile" menu={false} />
        <form onSubmit={saveName} className="space-y-4 px-5 py-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Full name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setNameStatus("idle");
              }}
              error={nameErr ?? undefined}
            />
            <Field label="Email" value={email} disabled readOnly />
          </div>
          <p className="text-[12px] text-ink-3">
            Email is managed by your login provider and can&apos;t be changed
            here.
          </p>
          <div className="flex items-center gap-3">
            <Button
              type="submit"
              disabled={name.trim() === initialName || nameStatus === "saving"}
            >
              {nameStatus === "saving" ? "Saving…" : "Save name"}
            </Button>
            {nameStatus === "saved" && (
              <span className="text-[12px] text-profit">Saved</span>
            )}
          </div>
        </form>
      </Card>

      <Card>
        <CardHeader title="Password" menu={false} />
        <form onSubmit={savePassword} className="space-y-4 px-5 py-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="New password"
              type="password"
              value={pw}
              onChange={(e) => {
                setPw(e.target.value);
                setPwStatus("idle");
              }}
              minLength={8}
            />
            <Field
              label="Confirm password"
              type="password"
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
              minLength={8}
              error={pwErr ?? undefined}
            />
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="submit"
              disabled={!pw || pwStatus === "saving"}
            >
              {pwStatus === "saving" ? "Updating…" : "Update password"}
            </Button>
            {pwStatus === "saved" && (
              <span className="text-[12px] text-profit">Password updated</span>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}
