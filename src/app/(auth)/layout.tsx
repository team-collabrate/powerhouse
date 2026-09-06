export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen place-items-center bg-bg-alt px-4">
      <div className="w-full max-w-[400px] rounded-[var(--radius-md)] border border-border bg-white p-8 shadow-[var(--shadow-1)]">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid h-8 w-8 place-items-center rounded-[var(--radius-sm)] bg-accent text-sm font-bold text-white">
            A
          </span>
          <span className="text-base font-semibold text-text-primary">
            Agency Pro
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}
