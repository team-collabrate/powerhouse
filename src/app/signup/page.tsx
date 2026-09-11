"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AtSignIcon, BriefcaseIcon, LockIcon, UserIcon } from "lucide-react";
import { AuthShell } from "@/components/auth-page/AuthShell";
import { OAuthRow, AuthSeparator } from "@/components/auth-page/OAuthRow";
import { Button } from "@/components/auth-page/shad-button";
import { Input } from "@/components/auth-page/shad-input";

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
    <AuthShell
      title="Create your agency"
      subtitle="Start tracking project profit in minutes."
      footer={
        <p className="text-[13.5px] text-ink-2">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-accent">
            Sign in
          </Link>
        </p>
      }
    >
      <OAuthRow />
      <AuthSeparator />
      <form onSubmit={onSubmit} className="space-y-2.5">
        <div className="relative">
          <Input
            placeholder="Agency name"
            className="ps-9"
            required
            value={form.agencyName}
            onChange={update("agencyName")}
          />
          <BriefcaseIcon
            className="pointer-events-none absolute inset-y-0 start-0 ms-3 my-auto size-4 text-ink-3"
            aria-hidden
          />
        </div>
        <div className="relative">
          <Input
            placeholder="Your name"
            className="ps-9"
            required
            value={form.fullName}
            onChange={update("fullName")}
          />
          <UserIcon
            className="pointer-events-none absolute inset-y-0 start-0 ms-3 my-auto size-4 text-ink-3"
            aria-hidden
          />
        </div>
        <div className="relative">
          <Input
            placeholder="your.email@example.com"
            className="ps-9"
            type="email"
            required
            value={form.email}
            onChange={update("email")}
          />
          <AtSignIcon
            className="pointer-events-none absolute inset-y-0 start-0 ms-3 my-auto size-4 text-ink-3"
            aria-hidden
          />
        </div>
        <div className="relative">
          <Input
            placeholder="Password (min. 8 characters)"
            className="ps-9"
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={update("password")}
          />
          <LockIcon
            className="pointer-events-none absolute inset-y-0 start-0 ms-3 my-auto size-4 text-ink-3"
            aria-hidden
          />
        </div>
        {error && <p className="text-xs text-loss">{error}</p>}
        {message && <p className="text-xs text-profit">{message}</p>}
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? "Creating…" : "Create account"}
        </Button>
      </form>
    </AuthShell>
  );
}
