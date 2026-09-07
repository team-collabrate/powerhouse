// Client-safe analytics constants — kept out of analytics.ts so client
// components can import them without pulling in the server cache layer.
export const ANALYTICS_PERIODS = [3, 6, 12] as const;
export type AnalyticsPeriod = (typeof ANALYTICS_PERIODS)[number];
