import type { ServiceSlice } from "@/lib/dashboard-types";

const SIZE = 128;
const STROKE = 16;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;
const GAP = 2.5; // degrees between segments

export function ServiceDonut({ slices }: { slices: ServiceSlice[] }) {
  if (slices.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center px-5 pb-8 pt-6 text-[13px] text-ink-3">
        No project revenue to break down yet.
      </div>
    );
  }

  const top = slices[0];

  // Cumulative start angle (deg) for each segment.
  const starts: number[] = [];
  slices.reduce((acc, s) => {
    starts.push(acc);
    return acc + (s.value / 100) * 360;
  }, -90);

  return (
    <div>
      <div className="flex items-center gap-3.5 px-5 pb-5 pt-4">
        <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
          <svg
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            width={SIZE}
            height={SIZE}
            role="img"
            aria-label="Revenue share by service line"
          >
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={R}
              fill="none"
              stroke="var(--surface-sunken)"
              strokeWidth={STROKE}
            />
            {slices.map((s, i) => {
              const frac = s.value / 100;
              const len = Math.max(0, frac * C - (GAP / 360) * C);
              const rot = starts[i] + GAP / 2;
              return (
                <circle
                  key={s.label}
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={R}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={STROKE}
                  strokeDasharray={`${len} ${C - len}`}
                  transform={`rotate(${rot} ${SIZE / 2} ${SIZE / 2})`}
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 grid place-items-center text-center">
            <div>
              <p className="tnum text-[22px] font-semibold leading-none text-ink">
                {top.value}%
              </p>
              <p className="mt-1 max-w-[76px] text-[11px] leading-tight text-ink-3">
                {top.label}
              </p>
            </div>
          </div>
        </div>

        <ul className="min-w-0 flex-1 space-y-2.5">
          {slices.map((s) => (
            <li key={s.label} className="flex items-center gap-2 text-[12px]">
              <span
                className="h-2 w-2 shrink-0 rounded-[2px]"
                style={{ background: s.color }}
              />
              <span className="min-w-0 flex-1 truncate text-ink-2">{s.label}</span>
              <span className="tnum shrink-0 font-medium text-ink">{s.value}%</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-hairline px-5 pb-4 pt-3">
        <p className="eyebrow mb-2">Profit margin</p>
        <ul className="space-y-2">
          {slices.map((s) => (
            <li key={s.label} className="flex items-center gap-2.5 text-[12px]">
              <span className="w-[104px] shrink-0 truncate text-ink-2">
                {s.label}
              </span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-sunken">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.max(2, Math.min(100, Math.abs(s.margin)))}%`,
                    background: s.margin < 0 ? "var(--loss)" : s.color,
                  }}
                />
              </div>
              <span
                className={`tnum w-10 shrink-0 text-right font-medium ${
                  s.margin < 0 ? "text-loss" : "text-ink"
                }`}
              >
                {s.margin}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
