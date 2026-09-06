import { CLIENT_GROWTH } from "@/lib/demo-data";

export function ClientGrowthBars() {
  const { bars, yMax } = CLIENT_GROWTH;

  return (
    <div className="flex flex-1 flex-col px-5 pb-5 pt-4">
      <div className="flex items-baseline gap-2">
        <span className="tnum text-[22px] font-semibold text-ink">+10</span>
        <span className="text-[12px] text-profit">clients this half</span>
      </div>
      <p className="mt-1 text-[12px] text-ink-3">
        Net new clients per month, April to September.
      </p>

      <div className="mt-4 flex flex-1 items-end gap-3">
        {bars.map((b) => (
          <div
            key={b.label}
            className="flex h-full flex-1 flex-col items-center justify-end gap-2"
          >
            <div className="relative flex w-full flex-1 items-end justify-center">
              {b.highlight && (
                <span className="tnum absolute -top-1 left-1/2 -translate-x-1/2 rounded-md bg-ink px-1.5 py-0.5 text-[10px] font-medium text-white">
                  {b.value}
                </span>
              )}
              <div
                className="w-full max-w-[26px] rounded-[5px]"
                style={{
                  height: `${(b.value / yMax) * 100}%`,
                  background: b.highlight
                    ? "var(--accent)"
                    : "var(--surface-sunken)",
                  border: b.highlight
                    ? "none"
                    : "1px solid var(--hairline-strong)",
                }}
              />
            </div>
            <span className="text-[11px] text-ink-3">{b.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
