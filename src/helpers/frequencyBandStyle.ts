export const PLOTLY_FREQUENCY_DASHES = [
  "solid",
  "dash",
  "dot",
  "dashdot",
  "longdash",
  "longdashdot",
] as const;

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const color = hex.replace("#", "");
  return {
    r: parseInt(color.substring(0, 2), 16) / 255,
    g: parseInt(color.substring(2, 4), 16) / 255,
    b: parseInt(color.substring(4, 6), 16) / 255,
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (value: number) =>
    Math.round(Math.max(0, Math.min(1, value)) * 255)
      .toString(16)
      .padStart(2, "0");

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const delta = max - min;

  if (delta === 0) return { h: 0, s: 0, l };

  const s = delta / (1 - Math.abs(2 * l - 1));
  let h = 0;

  if (max === r) h = ((g - b) / delta) % 6;
  else if (max === g) h = (b - r) / delta + 2;
  else h = (r - g) / delta + 4;

  h *= 60;
  if (h < 0) h += 360;

  return { h, s, l };
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const x = chroma * (1 - Math.abs(((h / 60) % 2) - 1));
  const match = l - chroma / 2;
  let r = 0;
  let g = 0;
  let b = 0;

  if (h < 60) [r, g, b] = [chroma, x, 0];
  else if (h < 120) [r, g, b] = [x, chroma, 0];
  else if (h < 180) [r, g, b] = [0, chroma, x];
  else if (h < 240) [r, g, b] = [0, x, chroma];
  else if (h < 300) [r, g, b] = [x, 0, chroma];
  else [r, g, b] = [chroma, 0, x];

  return { r: r + match, g: g + match, b: b + match };
}

function mixHexTowardWhite(hex: string, amount: number): string {
  const color = hex.replace("#", "");
  const mixChannel = (channel: number) =>
    Math.round(channel + (255 - channel) * amount)
      .toString(16)
      .padStart(2, "0");

  return `#${mixChannel(parseInt(color.substring(0, 2), 16))}${mixChannel(
    parseInt(color.substring(2, 4), 16),
  )}${mixChannel(parseInt(color.substring(4, 6), 16))}`;
}

/**
 * Same simulation = same hue. Frequency bands go from a lighter, high-contrast tint to a deep tone.
 * Different simulations keep distinct hues for comparison (orange vs purple, etc).
 * Bounded between lightness 0.36 (darkest) and 0.62 (lightest) with rich saturation to prevent washed-out lines.
 */
export function shadeForFrequencyBand(hex: string, index: number, count: number): string {
  const { r, g, b } = hexToRgb(hex);
  const { h, s } = rgbToHsl(r, g, b);
  const t = count <= 1 ? 1 : index / (count - 1);

  // Maintain rich saturation and vary lightness within an accessible contrast window
  // t = 0 (lowest frequency) -> lighter, but still fully saturated and high contrast
  // t = 1 (highest frequency) -> darker/deeper shade
  const minLightness = 0.36;
  const maxLightness = 0.62;
  const lightness = maxLightness - t * (maxLightness - minLightness);
  const saturation = Math.min(1, Math.max(s, 0.85));

  const rgb = hslToRgb(h, saturation, lightness);
  return rgbToHex(rgb.r, rgb.g, rgb.b);
}

export function plotlyDashForFrequencyBand(index: number): string {
  return PLOTLY_FREQUENCY_DASHES[index % PLOTLY_FREQUENCY_DASHES.length];
}
