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
      <span className="mb-1.5 block text-sm font-medium text-text-primary">
        {label}
      </span>
      <input
        className={cn(
          "w-full rounded-[var(--radius-sm)] border border-border bg-white px-3 py-2.5 text-sm outline-none",
          "focus:border-primary",
          error && "border-error",
          className,
        )}
        {...props}
      />
      {error && <span className="mt-1 block text-xs text-error">{error}</span>}
    </label>
  );
}
