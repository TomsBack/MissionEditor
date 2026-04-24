const THEME_KEY = "mission-editor-theme";

export type ThemeName =
  | "dark"
  | "light"
  | "nord"
  | "dracula"
  | "solarized-light";

interface ThemePalette {
  "bg-primary": string;
  "bg-secondary": string;
  "bg-panel": string;
  "bg-input": string;
  "bg-hover": string;
  "bg-selected": string;
  border: string;
  "text-primary": string;
  "text-secondary": string;
  "text-muted": string;
  accent: string;
  "accent-hover": string;
}

interface ThemeDefinition {
  name: string;
  palette: ThemePalette;
}

export const THEMES: Record<ThemeName, ThemeDefinition> = {
  dark: {
    name: "Dark (default)",
    palette: {
      "bg-primary": "#1a1a2e",
      "bg-secondary": "#16213e",
      "bg-panel": "#1e2a45",
      "bg-input": "#0f1729",
      "bg-hover": "#253557",
      "bg-selected": "#2d4a7a",
      border: "#2a3a5c",
      "text-primary": "#e0e0e0",
      "text-secondary": "#8892a4",
      "text-muted": "#5a6478",
      accent: "#4a9eff",
      "accent-hover": "#3a8eef",
    },
  },
  light: {
    name: "Light",
    palette: {
      "bg-primary": "#f0f2f5",
      "bg-secondary": "#e4e7eb",
      "bg-panel": "#ffffff",
      "bg-input": "#f8f9fa",
      "bg-hover": "#dce1e8",
      "bg-selected": "#ccd9ed",
      border: "#c8cdd5",
      "text-primary": "#1a1a2e",
      "text-secondary": "#4a5568",
      "text-muted": "#8892a4",
      accent: "#2563eb",
      "accent-hover": "#1d4ed8",
    },
  },
  nord: {
    name: "Nord",
    palette: {
      "bg-primary": "#2e3440",
      "bg-secondary": "#3b4252",
      "bg-panel": "#434c5e",
      "bg-input": "#2e3440",
      "bg-hover": "#4c566a",
      "bg-selected": "#5e81ac",
      border: "#4c566a",
      "text-primary": "#eceff4",
      "text-secondary": "#d8dee9",
      "text-muted": "#81a1c1",
      accent: "#88c0d0",
      "accent-hover": "#8fbcbb",
    },
  },
  dracula: {
    name: "Dracula",
    palette: {
      "bg-primary": "#282a36",
      "bg-secondary": "#21222c",
      "bg-panel": "#383a4a",
      "bg-input": "#1e1f29",
      "bg-hover": "#44475a",
      "bg-selected": "#6272a4",
      border: "#44475a",
      "text-primary": "#f8f8f2",
      "text-secondary": "#bd93f9",
      "text-muted": "#6272a4",
      accent: "#ff79c6",
      "accent-hover": "#ff5bb1",
    },
  },
  "solarized-light": {
    name: "Solarized Light",
    palette: {
      "bg-primary": "#fdf6e3",
      "bg-secondary": "#eee8d5",
      "bg-panel": "#fdf6e3",
      "bg-input": "#fafaf0",
      "bg-hover": "#eee8d5",
      "bg-selected": "#d8d2bd",
      border: "#93a1a1",
      "text-primary": "#586e75",
      "text-secondary": "#657b83",
      "text-muted": "#93a1a1",
      accent: "#268bd2",
      "accent-hover": "#2076b8",
    },
  },
};

export function isThemeName(value: unknown): value is ThemeName {
  return typeof value === "string" && value in THEMES;
}

export function getStoredTheme(): ThemeName {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    return isThemeName(stored) ? stored : "dark";
  } catch {
    return "dark";
  }
}

export function setStoredTheme(theme: ThemeName) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {}
}

export function applyTheme(theme: ThemeName) {
  const root = document.documentElement;
  const palette = THEMES[theme]?.palette ?? THEMES.dark.palette;
  for (const [key, value] of Object.entries(palette)) {
    root.style.setProperty(`--${key}`, value);
  }
}
