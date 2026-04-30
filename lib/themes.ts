export type ThemeName = "aurora" | "ocean" | "sunset" | "forest";

export interface ThemeTokens {
  bg: string;
  accent1: string;
  accent2: string;
  accent3: string;
  accent4: string;
  gradientFrom: string;
  gradientTo: string;
}

export const THEMES: Record<ThemeName, ThemeTokens> = {
  aurora: {
    bg: "#0D0D1A",
    accent1: "#7B5CF0",
    accent2: "#06D6A0",
    accent3: "#FF6B9D",
    accent4: "#FFB703",
    gradientFrom: "#7B5CF0",
    gradientTo: "#FF6B9D",
  },
  ocean: {
    bg: "#061220",
    accent1: "#00B4D8",
    accent2: "#06D6A0",
    accent3: "#7B5CF0",
    accent4: "#FF9F1C",
    gradientFrom: "#00B4D8",
    gradientTo: "#06D6A0",
  },
  sunset: {
    bg: "#1A0A0A",
    accent1: "#FF6B35",
    accent2: "#FFB703",
    accent3: "#FF006E",
    accent4: "#06D6A0",
    gradientFrom: "#FF6B35",
    gradientTo: "#FF006E",
  },
  forest: {
    bg: "#061A0D",
    accent1: "#06D6A0",
    accent2: "#7B5CF0",
    accent3: "#FFB703",
    accent4: "#FF6B35",
    gradientFrom: "#06D6A0",
    gradientTo: "#7B5CF0",
  },
};

export const THEME_LIST = Object.keys(THEMES) as ThemeName[];

export const DEFAULT_THEME_NAME: ThemeName = "aurora";

export const PA_THEME_STORAGE_KEY = "pa-theme";

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "").trim();
  return {
    r: Number.parseInt(h.slice(0, 2), 16),
    g: Number.parseInt(h.slice(2, 4), 16),
    b: Number.parseInt(h.slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const c = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

function mixHex(a: string, b: string, t: number): string {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  return rgbToHex(A.r + (B.r - A.r) * t, A.g + (B.g - A.g) * t, A.b + (B.b - A.b) * t);
}

export function isThemeName(value: string): value is ThemeName {
  return value in THEMES;
}

/** CSS variables for :root (keys include `--` prefix). */
export function getThemeCssVars(name: ThemeName): Record<string, string> {
  const t = THEMES[name];
  const sidebar = mixHex(t.bg, "#000000", 0.38);
  const card = mixHex(t.bg, "#ffffff", 0.065);
  const cardBorder = "rgba(255, 255, 255, 0.09)";
  const sbBorder = "rgba(255, 255, 255, 0.1)";
  const grad = `linear-gradient(135deg, ${t.gradientFrom} 0%, ${t.gradientTo} 100%)`;

  return {
    "--pa-bg": t.bg,
    "--pa-sidebar": sidebar,
    "--pa-card": card,
    "--pa-card-border": cardBorder,
    "--pa-sb-border": sbBorder,
    "--pa-hint": "rgba(255, 255, 255, 0.12)",
    "--pa-text": "rgba(248, 248, 252, 0.96)",
    "--pa-muted": "rgba(200, 200, 220, 0.72)",
    "--pa-acc1": t.accent1,
    "--pa-acc2": t.accent2,
    "--pa-acc3": t.accent3,
    "--pa-acc4": t.accent4,
    "--pa-grad": grad,
    "--pa-gradient": grad,
  };
}

export function themeLabel(name: ThemeName): string {
  return name.charAt(0).toUpperCase() + name.slice(1);
}
