# Deploying to Vercel

The repo is deploy-ready:

- `vercel-build` script runs `prisma migrate deploy && next build`, so every
  deploy applies pending migrations before building. (Plain `build` /
  `npm test` in CI stay DB-free.)
- `prisma/schema.prisma` `binaryTargets` includes `rhel-openssl-3.0.x` (the
  Vercel serverless runtime).
- `engines.node = 22.x` pins the runtime to match CI.
- `postinstall: prisma generate` regenerates the client on Vercel.

All the steps below need your accounts (Vercel, Supabase, Resend) — do them
yourself; nothing here should be handed to an automated agent.

---

## 1. Create the Vercel project

Vercel dashboard → **Add New → Project** → import
`team-collabrate/powerhouse`. Framework preset auto-detects as **Next.js**.
Leave Root Directory, Build Command, and Output Directory at their defaults
(Vercel picks up `vercel-build` automatically).

Or CLI:

```bash
npx vercel login
npx vercel link
```

## 2. Environment variables

Add these under **Settings → Environment Variables** (Production, and
Preview if you want preview deploys to work). Values come from your
`.env.local` except where noted.

| Variable | Value | Secret? |
| --- | --- | --- |
| `DATABASE_URL` | Supabase **Transaction pooler** URI, port `6543`, with `?pgbouncer=true` | yes |
| `DIRECT_URL` | Supabase **Session pooler** URI, port `5432` (used only by `migrate deploy` at build) | yes |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<ref>.supabase.co` | no |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → anon key | no |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → API → service_role key (needed for team-invite provisioning) | yes |
| `RESEND_API_KEY` | Resend → API Keys (see step 4) | yes |
| `RESEND_FROM` | `Agency Dashboard <invoices@yourdomain.com>` — must be a **verified** sender | no |
| `NEXT_PUBLIC_APP_URL` | your production URL, e.g. `https://powerhouse.vercel.app` (no trailing slash) | no |

`NEXT_PUBLIC_APP_URL` is baked into the client bundle and used for portal /
invoice / invite links inside emails — set it before the first production
build. If you don't know the domain yet, deploy once, note the URL Vercel
assigns, set the var, and redeploy.

Without `RESEND_API_KEY` the app still works — "Send invoice" just flips the
status and skips the email.

## 3. Point Supabase Auth at the deployed URL

Supabase → **Authentication → URL Configuration**:

- **Site URL**: `https://<your-vercel-domain>`
- **Redirect URLs**: add `https://<your-vercel-domain>/**`

Without this, email-confirmation and password-reset links (and the
`/invite/<token>` accept flow's post-signup redirect) break.

## 4. Resend (email delivery)

1. Create a [Resend](https://resend.com) account.
2. **Domains → Add Domain**, add the DNS records it shows (SPF + DKIM), wait
   for "Verified".
3. **API Keys → Create** — copy into `RESEND_API_KEY`.
4. Set `RESEND_FROM` to an address `@` that verified domain.

To test before you own a domain: leave `RESEND_FROM` as the default
`onboarding@resend.dev` — Resend will only deliver to the email address on
your own Resend account.

## 5. Deploy

Push to `main` (Vercel auto-deploys) or `npx vercel --prod`. The build log
should show `prisma migrate deploy` reporting "No pending migrations" (they
were already applied from local) or applying any new ones.

## 6. Smoke test

- `/login` → sign in with an existing Supabase user.
- `/dashboard` renders real numbers (not the "Sample data" chip).
- `/settings` → change the overhead method → Save → reload persists.
- Create an invoice → **Send** → check the email arrives (if Resend is set)
  and the `/portal/<token>` link works logged-out.
- **Settings → Team → Invite** → open the `/invite/<token>` link in a
  private window → accept → new user lands on `/dashboard`.

## Notes

- Migrations run automatically on deploy via `vercel-build`. To manage them
  manually instead, change that script back to `next build` and run
  `npx dotenv -e .env.local -- npx prisma migrate deploy` yourself.
- The app connects to Postgres as `postgres` (BYPASSRLS); RLS is only the
  anon-key backstop. No prod-specific DB config needed.
- Preview deployments share the same database as production unless you give
  them their own `DATABASE_URL` / `DIRECT_URL`.
