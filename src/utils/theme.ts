const THEME_KEY = "mission-editor-theme";

export type Theme = "dark" | "light";

export function getStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    return stored === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

export function setStoredTheme(theme: Theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {}
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "light") {
    root.style.setProperty("--bg-primary", "#f0f2f5");
    root.style.setProperty("--bg-secondary", "#e4e7eb");
    root.style.setProperty("--bg-panel", "#ffffff");
    root.style.setProperty("--bg-input", "#f8f9fa");
    root.style.setProperty("--bg-hover", "#dce1e8");
    root.style.setProperty("--bg-selected", "#ccd9ed");
    root.style.setProperty("--border", "#c8cdd5");
    root.style.setProperty("--text-primary", "#1a1a2e");
    root.style.setProperty("--text-secondary", "#4a5568");
    root.style.setProperty("--text-muted", "#8892a4");
    root.style.setProperty("--accent", "#2563eb");
    root.style.setProperty("--accent-hover", "#1d4ed8");
  } else {
    root.style.setProperty("--bg-primary", "#1a1a2e");
    root.style.setProperty("--bg-secondary", "#16213e");
    root.style.setProperty("--bg-panel", "#1e2a45");
    root.style.setProperty("--bg-input", "#0f1729");
    root.style.setProperty("--bg-hover", "#253557");
    root.style.setProperty("--bg-selected", "#2d4a7a");
    root.style.setProperty("--border", "#2a3a5c");
    root.style.setProperty("--text-primary", "#e0e0e0");
    root.style.setProperty("--text-secondary", "#8892a4");
    root.style.setProperty("--text-muted", "#5a6478");
    root.style.setProperty("--accent", "#4a9eff");
    root.style.setProperty("--accent-hover", "#3a8eef");
  }
}
