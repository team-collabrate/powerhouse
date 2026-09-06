import { cn } from "@/lib/utils";

export function Field({
  label,
  error,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-ink">
        {label}
      </span>
      <input
        className={cn(
          "h-10 w-full rounded-[var(--radius-sm)] border border-hairline-strong bg-surface px-3 text-[13.5px] outline-none transition-colors",
          "focus:border-accent",
          error && "border-loss",
          className,
        )}
        {...props}
      />
      {error && <span className="mt-1 block text-[12px] text-loss">{error}</span>}
    </label>
  );
}
