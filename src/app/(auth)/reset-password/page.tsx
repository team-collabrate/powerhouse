"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    // createBrowserClient exchanges the recovery code from the URL on init;
    // onAuthStateChange fires PASSWORD_RECOVERY / SIGNED_IN once it lands.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setReady(true);
        setChecking(false);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
      setChecking(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setError(null);
    setLoading(true);
    const { error } = await createClient().auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setDone(true);
    setTimeout(() => {
      router.push("/dashboard");
      router.refresh();
    }, 1200);
  }

  if (done) {
    return (
      <>
        <h1 className="text-lg font-semibold text-ink">Password updated</h1>
        <p className="mt-2 text-sm text-ink-2">Taking you to your dashboard…</p>
      </>
    );
  }

  if (checking) {
    return <p className="text-sm text-ink-3">Checking your reset link…</p>;
  }

  if (!ready) {
    return (
      <>
        <h1 className="text-lg font-semibold text-ink">Link expired</h1>
        <p className="mt-2 text-sm text-ink-2">
          This reset link is invalid or has already been used. Request a new
          one.
        </p>
        <Link
          href="/forgot-password"
          className="mt-4 inline-block text-sm font-medium text-accent"
        >
          Send a new link
        </Link>
      </>
    );
  }

  return (
    <>
      <h1 className="text-lg font-semibold text-ink">Set a new password</h1>
      <p className="mt-1 text-sm text-ink-2">
        Pick something you&apos;ll remember.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <Field
          label="New password"
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Field
          label="Confirm password"
          type="password"
          required
          minLength={8}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        {error && <p className="text-xs text-loss">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Saving…" : "Update password"}
        </Button>
      </form>
    </>
  );
}
