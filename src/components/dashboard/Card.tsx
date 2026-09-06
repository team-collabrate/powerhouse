import { MoreHorizontal } from "react-feather";
import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "flex flex-col rounded-[var(--radius-md)] border border-hairline bg-surface-raised shadow-[var(--shadow-card)]",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  menu = true,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  menu?: boolean;
}) {
  return (
    <header className="flex items-start justify-between px-5 pt-5">
      <div>
        <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">
          {title}
        </h3>
        {subtitle && (
          <p className="mt-0.5 text-[13px] text-ink-3">{subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-1">
        {action}
        {menu && (
          <button
            aria-label="Card options"
            className="grid h-7 w-7 place-items-center rounded-md text-ink-3 transition-colors hover:bg-surface-sunken hover:text-ink-2"
          >
            <MoreHorizontal size={16} />
          </button>
        )}
      </div>
    </header>
  );
}
