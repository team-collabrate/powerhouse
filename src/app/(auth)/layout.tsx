export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen place-items-center bg-surface-sunken px-4">
      <div className="w-full max-w-[400px] rounded-[var(--radius-md)] border border-hairline bg-surface p-8 shadow-[var(--shadow-card)]">
        <div className="mb-6 flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-[var(--radius-xs)] bg-accent text-[15px] font-bold text-white">
            A
          </span>
          <span className="text-[15px] font-semibold tracking-[-0.01em] text-ink">
            Agency Pro
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}
