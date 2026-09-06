import { SERVICE_MIX } from "@/lib/demo-data";

const SIZE = 144;
const STROKE = 18;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;
const GAP = 2.5; // degrees between segments

export function ServiceDonut() {
  const top = SERVICE_MIX[0];

  // Cumulative start angle (deg) for each segment, computed up front.
  const starts: number[] = [];
  SERVICE_MIX.reduce((acc, s) => {
    starts.push(acc);
    return acc + (s.value / 100) * 360;
  }, -90);

  return (
    <div className="flex items-center gap-4 px-5 pb-5 pt-4">
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
          {SERVICE_MIX.map((s, i) => {
            const frac = s.value / 100;
            const len = Math.max(0, frac * C - (GAP / 360) * C);
            const dash = `${len} ${C - len}`;
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
                strokeDasharray={dash}
                strokeLinecap="butt"
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
            <p className="mt-1 text-[11px] text-ink-3">Web Dev</p>
          </div>
        </div>
      </div>

      <ul className="flex-1 space-y-2.5">
        {SERVICE_MIX.map((s) => (
          <li key={s.label} className="flex items-center gap-2 text-[12.5px]">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
              style={{ background: s.color }}
            />
            <span className="min-w-0 flex-1 truncate text-ink-2">{s.label}</span>
            <span className="tnum shrink-0 font-medium text-ink">{s.value}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
