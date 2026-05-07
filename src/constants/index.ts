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

export const RHINO3DM_PATH = "/node_modules/three/examples/jsm/libs/rhino3dm/";

export const FREQUENCY_BANDS = [63, 125, 250, 500, 1000, 2000, 4000, 8000] as const;

export const SIDEBAR_WIDTH = 332;

export const COLORS_VARIANTS = [
  COLORS.PRIMARY,
  COLORS.SECONDARY,
  COLORS.ACCENT,
  "lightgreen",
  "silver",
  "lightpink",
  "darkorange",
  "lightyellow",
  "tomato",
  "gold",
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
