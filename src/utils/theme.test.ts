import { beforeEach, describe, expect, it } from "vitest";
import { applyTheme, getStoredTheme, setStoredTheme, isThemeName, THEMES, type ThemeName } from "./theme";

const KEY = "mission-editor-theme";

describe("theme persistence", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("style");
  });

  it("defaults to dark when nothing is stored", () => {
    expect(getStoredTheme()).toBe("dark");
  });

  it("returns the stored theme when it is a known name", () => {
    localStorage.setItem(KEY, "light");
    expect(getStoredTheme()).toBe("light");
    localStorage.setItem(KEY, "nord");
    expect(getStoredTheme()).toBe("nord");
    localStorage.setItem(KEY, "dracula");
    expect(getStoredTheme()).toBe("dracula");
  });

  it("treats unknown theme names as dark", () => {
    localStorage.setItem(KEY, "purple");
    expect(getStoredTheme()).toBe("dark");
    localStorage.setItem(KEY, "");
    expect(getStoredTheme()).toBe("dark");
  });

  it("setStoredTheme persists each known theme verbatim", () => {
    for (const name of Object.keys(THEMES) as ThemeName[]) {
      setStoredTheme(name);
      expect(localStorage.getItem(KEY)).toBe(name);
    }
  });
});

describe("isThemeName", () => {
  it("returns true for every registered theme key", () => {
    for (const name of Object.keys(THEMES)) {
      expect(isThemeName(name)).toBe(true);
    }
  });

  it("returns false for non-string and unknown values", () => {
    expect(isThemeName("not-a-theme")).toBe(false);
    expect(isThemeName(undefined)).toBe(false);
    expect(isThemeName(null)).toBe(false);
    expect(isThemeName(42)).toBe(false);
  });
});

describe("applyTheme", () => {
  beforeEach(() => {
    document.documentElement.removeAttribute("style");
  });

  it("writes every palette key from the registry as a CSS custom property", () => {
    applyTheme("dracula");
    const style = document.documentElement.style;
    const palette = THEMES.dracula.palette;
    for (const [key, value] of Object.entries(palette)) {
      expect(style.getPropertyValue(`--${key}`)).toBe(value);
    }
  });

  it("sets recognisable values for the original light theme", () => {
    applyTheme("light");
    const style = document.documentElement.style;
    expect(style.getPropertyValue("--bg-primary")).toBe("#f0f2f5");
    expect(style.getPropertyValue("--text-primary")).toBe("#1a1a2e");
    expect(style.getPropertyValue("--accent")).toBe("#2563eb");
  });

  it("switching themes overwrites prior variables", () => {
    applyTheme("light");
    applyTheme("dark");
    expect(document.documentElement.style.getPropertyValue("--bg-primary")).toBe("#1a1a2e");
  });

  it("falls back to the dark palette for an unknown theme name", () => {
    applyTheme("not-a-real-theme" as ThemeName);
    expect(document.documentElement.style.getPropertyValue("--bg-primary")).toBe(
      THEMES.dark.palette["bg-primary"],
    );
  });
});
