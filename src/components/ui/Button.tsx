import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-white hover:bg-accent-strong disabled:opacity-50 disabled:pointer-events-none",
  secondary:
    "bg-surface text-ink border border-hairline-strong hover:bg-surface-sunken disabled:opacity-50 disabled:pointer-events-none",
  danger:
    "bg-loss text-white hover:brightness-90 disabled:opacity-50 disabled:pointer-events-none",
  ghost:
    "bg-transparent text-ink-2 hover:bg-surface-sunken disabled:opacity-50 disabled:pointer-events-none",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex min-h-[40px] items-center justify-center gap-2 rounded-[var(--radius-sm)] px-4 py-2.5 text-[13.5px] font-medium transition-colors",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
