import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const variants: Record<Variant, string> = {
  // Primary actions use purple (#9933ff) per DASHBOARD_DESIGN_SPECIFICATION.md
  primary:
    "bg-accent text-white hover:bg-accent-hover disabled:opacity-50 disabled:pointer-events-none",
  secondary:
    "bg-white text-text-primary border border-border hover:bg-bg-alt disabled:opacity-50 disabled:pointer-events-none",
  danger:
    "bg-error text-white hover:brightness-90 disabled:opacity-50 disabled:pointer-events-none",
  ghost:
    "bg-transparent text-text-secondary hover:bg-bg-alt disabled:opacity-50 disabled:pointer-events-none",
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
        "inline-flex items-center justify-center gap-2 rounded-[var(--radius-sm)] px-4 py-2.5 text-sm font-medium transition-colors",
        "min-h-[40px]",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
