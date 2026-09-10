import { PERIOD_PRESETS, type PeriodInput, type PeriodPreset } from "@/lib/period";

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Parse `?period=&from=&to=` search params into a `PeriodInput`.
 * Unknown/absent preset → `last_12_months`. `custom` needs valid `from`/`to`.
 */
export function parsePeriodParams(sp: Record<string, string | undefined>): PeriodInput {
  const preset = (
    PERIOD_PRESETS.includes(sp.period as PeriodPreset)
      ? sp.period
      : "last_12_months"
  ) as PeriodPreset;

  if (preset === "custom") {
    const from = sp.from && ISO_DAY.test(sp.from) ? sp.from : undefined;
    const to = sp.to && ISO_DAY.test(sp.to) ? sp.to : undefined;
    if (!from || !to) return { preset: "last_12_months" };
    return { preset: "custom", from, to };
  }
  return { preset };
}
