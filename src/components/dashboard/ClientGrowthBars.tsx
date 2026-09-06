import type { ClientGrowthView } from "@/lib/dashboard-types";

export function ClientGrowthBars({ data }: { data: ClientGrowthView }) {
  const { bars, yMax, netNew, caption } = data;

  return (
    <div className="flex flex-1 flex-col px-5 pb-5 pt-4">
      <div className="flex items-baseline gap-2">
        <span className="tnum text-[22px] font-semibold text-ink">
          {netNew >= 0 ? "+" : ""}
          {netNew}
        </span>
        <span className="text-[12px] text-profit">clients this half</span>
      </div>
      <p className="mt-1 text-[12px] text-ink-3">{caption}</p>

      <div className="mt-4 flex flex-1 items-end gap-3">
        {bars.map((b) => (
          <div
            key={b.label}
            className="flex h-full flex-1 flex-col items-center justify-end gap-2"
          >
            {b.highlight && (
              <span className="tnum rounded-md bg-ink px-1.5 py-0.5 text-[10px] font-medium text-white">
                {b.value}
              </span>
            )}
            <div
              className="w-full max-w-[26px] rounded-[5px]"
              style={{
                height: `${Math.max(5, (b.value / yMax) * 90)}%`,
                background: b.highlight ? "var(--accent)" : "#e3e2e7",
              }}
            />
            <span className="text-[11px] text-ink-3">{b.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
