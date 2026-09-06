"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    agencyName: "",
    fullName: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(json.error?.message ?? "Signup failed");
      return;
    }
    if (json.data?.needsConfirmation) {
      setMessage("Check your email to confirm your account, then sign in.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <>
      <h1 className="text-lg font-semibold text-ink">
        Create your agency
      </h1>
      <p className="mt-1 text-sm text-ink-2">
        Start tracking project profit in minutes.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <Field label="Agency name" required value={form.agencyName} onChange={update("agencyName")} />
        <Field label="Your name" required value={form.fullName} onChange={update("fullName")} />
        <Field label="Email" type="email" required value={form.email} onChange={update("email")} />
        <Field
          label="Password"
          type="password"
          required
          minLength={8}
          value={form.password}
          onChange={update("password")}
        />
        {error && <p className="text-xs text-loss">{error}</p>}
        {message && <p className="text-xs text-profit">{message}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creating…" : "Create account"}
        </Button>
      </form>

      <p className="mt-4 text-sm text-ink-2">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-accent">
          Sign in
        </Link>
      </p>
    </>
  );
}
