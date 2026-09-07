"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await createClient().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <>
        <h1 className="text-lg font-semibold text-ink">Check your email</h1>
        <p className="mt-2 text-sm text-ink-2">
          If an account exists for <strong>{email}</strong>, we&apos;ve sent a
          link to reset your password. It expires in an hour.
        </p>
        <Link
          href="/login"
          className="mt-4 inline-block text-sm font-medium text-accent"
        >
          Back to sign in
        </Link>
      </>
    );
  }

  return (
    <>
      <h1 className="text-lg font-semibold text-ink">Reset your password</h1>
      <p className="mt-1 text-sm text-ink-2">
        Enter your email and we&apos;ll send you a reset link.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <Field
          label="Email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {error && <p className="text-xs text-loss">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Sending…" : "Send reset link"}
        </Button>
      </form>

      <p className="mt-4 text-sm text-ink-2">
        Remembered it?{" "}
        <Link href="/login" className="font-medium text-accent">
          Sign in
        </Link>
      </p>
    </>
  );
}
