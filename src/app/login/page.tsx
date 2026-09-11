"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AtSignIcon, LockIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AuthShell } from "@/components/auth-page/AuthShell";
import { OAuthRow, AuthSeparator } from "@/components/auth-page/OAuthRow";
import { Button } from "@/components/auth-page/shad-button";
import { Input } from "@/components/auth-page/shad-input";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await createClient().auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <AuthShell
      title="Sign in"
      subtitle="Welcome back to your dashboard."
      footer={
        <p className="text-[13.5px] text-ink-2">
          No account?{" "}
          <Link href="/signup" className="font-medium text-accent">
            Create one
          </Link>
        </p>
      }
    >
      <OAuthRow />
      <AuthSeparator />
      <form onSubmit={onSubmit} className="space-y-2.5">
        <div className="relative">
          <Input
            placeholder="your.email@example.com"
            className="ps-9"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <AtSignIcon
            className="pointer-events-none absolute inset-y-0 start-0 ms-3 my-auto size-4 text-ink-3"
            aria-hidden
          />
        </div>
        <div className="relative">
          <Input
            placeholder="Password"
            className="ps-9"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <LockIcon
            className="pointer-events-none absolute inset-y-0 start-0 ms-3 my-auto size-4 text-ink-3"
            aria-hidden
          />
        </div>
        <div className="text-right">
          <Link
            href="/forgot-password"
            className="text-xs font-medium text-ink-3 hover:text-accent"
          >
            Forgot password?
          </Link>
        </div>
        {error && <p className="text-xs text-loss">{error}</p>}
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </AuthShell>
  );
}
