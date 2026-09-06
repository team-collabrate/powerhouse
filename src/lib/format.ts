export function formatCurrency(value: number | string, currency = "USD"): string {
  const n = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number.isFinite(n) ? n : 0);
}

export function formatPercent(value: number | string, digits = 0): string {
  const n = typeof value === "string" ? Number(value) : value;
  return `${(Number.isFinite(n) ? n : 0).toFixed(digits)}%`;
}

export function formatDate(value: Date | string): string {
  const d = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}
