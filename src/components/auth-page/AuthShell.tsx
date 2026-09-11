import Link from "next/link";
import { Globe2Icon, Grid2x2PlusIcon, MailIcon } from "lucide-react";
import { FloatingPaths } from "./FloatingPaths";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main className="relative md:h-screen md:overflow-hidden lg:grid lg:grid-cols-2">
      <div className="relative hidden h-full flex-col justify-between overflow-hidden border-r border-hairline bg-surface-sunken p-10 lg:flex">
        <Link href="/login" className="z-10 flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-[var(--radius-xs)] bg-accent text-[15px] font-bold text-white">
            P
          </span>
          <span className="text-[15px] font-semibold tracking-[0.02em] text-ink">
            POWERHOUSE
          </span>
        </Link>

        <div className="z-10">
          <p className="max-w-sm text-xl leading-snug text-ink">
            Real project profitability for contract-based agencies — every
            invoice, expense, and margin, in one place.
          </p>
        </div>

        <div className="absolute inset-0">
          <FloatingPaths position={1} />
          <FloatingPaths position={-1} />
        </div>
      </div>

      <div className="relative flex min-h-screen flex-col justify-center bg-surface p-4">
        <div className="mx-auto w-full space-y-5 sm:w-sm">
          <div className="flex items-center gap-2.5 lg:hidden">
            <Grid2x2PlusIcon className="size-6 text-accent" />
            <p className="text-[15px] font-semibold tracking-[0.02em] text-ink">
              POWERHOUSE
            </p>
          </div>

          <div className="flex flex-col space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-ink">
              {title}
            </h1>
            <p className="text-[13.5px] text-ink-3">{subtitle}</p>
          </div>

          {children}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-2 text-[12px] text-ink-3">
            <span className="inline-flex items-center gap-1">
              Powered by
              <a
                href="https://collabrate.digital"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium text-ink-2 hover:text-accent"
              >
                <Globe2Icon className="size-3.5" aria-hidden />
                collabrate.digital
              </a>
            </span>
            <a
              href="mailto:hello@collabrate.digital"
              className="inline-flex items-center gap-1 hover:text-accent"
            >
              <MailIcon className="size-3.5" aria-hidden />
              hello@collabrate.digital
            </a>
          </div>

          {footer}
        </div>
      </div>
    </main>
  );
}
