export const COLORS = {
  PRIMARY: "#EF7305",
  SECONDARY: "#F4B183",
  TERTIARY: "#FBE5D6",
  ACCENT: "#667eea",
  DARK: "#1a1d29",
  GRAY: "#64748b",
} as const;

export const CHORAS_DOCUMENTATION_URL = {
  name: "CHORAS",
  github: "https://github.com/choras-org",
  documentation: "https://github.com/choras-org",
} as const;

// Copied there from three.js by the postinstall script in package.json.
export const RHINO3DM_PATH = `${import.meta.env.BASE_URL}rhino3dm/`;

export const FREQUENCY_BANDS = [63, 125, 250, 500, 1000, 2000, 4000, 8000] as const;

export const SIDEBAR_WIDTH = 332;

export const CHART_COLORS_VARIANTS = [
  "#EF7305", // orange (Choras primary)
  "#7B2CBF", // purple
  "#0072B2", // blue
  "#009E73", // green
  "#C026D3", // magenta
  "#0891B2", // teal
  "#D97706", // amber
  "#4F46E5", // indigo
];

export const RESOURCE_TYPES = [
  {
    label: "Local",
    value: "LOCAL",
  },
  {
    label: "Cloud",
    value: "CLOUD",
  },
];
