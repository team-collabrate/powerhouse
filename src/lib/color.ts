/**
 * Derive a usable accent palette from any colour an agency picks in the
 * brand-colour field (a plain `<input type="color">` — any hue). Pure,
 * client-safe.
 */

export const DEFAULT_ACCENT = "#9933ff"; // Powerhouse's own accent

export function normalizeHex(input: string): string | null {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(input.trim());
  return m ? `#${m[1].toLowerCase()}` : null;
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  const c = (v: number) => Math.round(Math.max(0, Math.min(255, v)))
    .toString(16)
    .padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

interface Hsl {
  h: number; // 0..360
  s: number; // 0..1
  l: number; // 0..1
}

function rgbToHsl(r: number, g: number, b: number): Hsl {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  switch (max) {
    case r:
      h = (g - b) / d + (g < b ? 6 : 0);
      break;
    case g:
      h = (b - r) / d + 2;
      break;
    default:
      h = (r - g) / d + 4;
  }
  return { h: h * 60, s, l };
}

function hslToRgb({ h, s, l }: Hsl): [number, number, number] {
  if (s === 0) {
    const v = l * 255;
    return [v, v, v];
  }
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hk = h / 360;
  return [
    hue2rgb(p, q, hk + 1 / 3) * 255,
    hue2rgb(p, q, hk) * 255,
    hue2rgb(p, q, hk - 1 / 3) * 255,
  ];
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export interface AccentPalette {
  accent: string;
  accentStrong: string;
  accentSoft: string;
}

/**
 * Any hex in → a usable {button, hover, tint} triad out. Lightness is
 * clamped to a range that stays legible with white button text and visible
 * against the app's off-white surfaces, regardless of how light or dark the
 * picked colour is. Invalid input falls back to Powerhouse's own purple.
 */
export function deriveAccentPalette(input: string): AccentPalette {
  const hex = normalizeHex(input) ?? DEFAULT_ACCENT;
  // Exact match to Powerhouse's own purple → the original, hand-picked
  // triad verbatim, so agencies who haven't customised see zero change.
  if (hex === DEFAULT_ACCENT) {
    return { accent: "#9933ff", accentStrong: "#7d1fe0", accentSoft: "#f3ecff" };
  }
  const [r, g, b] = hexToRgb(hex);
  const hsl = rgbToHsl(r, g, b);
  const s = Math.max(hsl.s, 0.35);

  const accentHsl: Hsl = { h: hsl.h, s, l: clamp(hsl.l, 0.32, 0.56) };
  const strongHsl: Hsl = { h: hsl.h, s, l: clamp(accentHsl.l - 0.13, 0.14, 0.5) };
  const softHsl: Hsl = { h: hsl.h, s: Math.min(s, 0.75), l: 0.94 };

  return {
    accent: rgbToHex(...hslToRgb(accentHsl)),
    accentStrong: rgbToHex(...hslToRgb(strongHsl)),
    accentSoft: rgbToHex(...hslToRgb(softHsl)),
  };
}

const RAMP_STEP_L = 0.13;
const RAMP_STEP_S = 0.16;
const RAMP_MAX_L = 0.94;
const RAMP_MIN_S = 0.1;

/**
 * `count` shades of the agency's own accent colour, strong→light — for
 * "share of total" charts (service mix) that should read as one hue, not a
 * scatter of unrelated tag colours. Index 0 is the accent itself (same hex
 * `deriveAccentPalette` uses for buttons).
 *
 * Each stop is a **fixed step from the previous one, by rank** — not a
 * fraction of the total count — so slice #2 is always a clearly-tinted
 * secondary shade (never a washed-out near-white just because there are
 * only 2 services), and adding a 3rd/4th service only appends a new,
 * slightly lighter stop instead of recomputing — and shifting — every
 * existing service's colour.
 */
export function accentShadeRamp(input: string, count: number): string[] {
  if (count <= 0) return [];
  const { accent } = deriveAccentPalette(input);
  const [r, g, b] = hexToRgb(accent);
  const { h, s, l } = rgbToHsl(r, g, b);
  return Array.from({ length: count }, (_, i) => {
    const lightness = clamp(l + RAMP_STEP_L * i, 0, RAMP_MAX_L);
    const saturation = clamp(s - RAMP_STEP_S * i, RAMP_MIN_S, 1);
    return rgbToHex(...hslToRgb({ h, s: saturation, l: lightness }));
  });
}
