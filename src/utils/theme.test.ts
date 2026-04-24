import { beforeEach, describe, expect, it } from "vitest";
import { applyTheme, getStoredTheme, setStoredTheme } from "./theme";

const KEY = "mission-editor-theme";

describe("theme persistence", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("style");
  });

  it("defaults to dark when nothing is stored", () => {
    expect(getStoredTheme()).toBe("dark");
  });

  it("returns light when 'light' is stored", () => {
    localStorage.setItem(KEY, "light");
    expect(getStoredTheme()).toBe("light");
  });

  it("treats unknown values as dark", () => {
    localStorage.setItem(KEY, "purple");
    expect(getStoredTheme()).toBe("dark");
  });

  it("setStoredTheme persists the value", () => {
    setStoredTheme("light");
    expect(localStorage.getItem(KEY)).toBe("light");
    setStoredTheme("dark");
    expect(localStorage.getItem(KEY)).toBe("dark");
  });
});

describe("applyTheme", () => {
  beforeEach(() => {
    document.documentElement.removeAttribute("style");
  });

  it("sets light-mode CSS variables", () => {
    applyTheme("light");
    const style = document.documentElement.style;
    expect(style.getPropertyValue("--bg-primary")).toBe("#f0f2f5");
    expect(style.getPropertyValue("--text-primary")).toBe("#1a1a2e");
    expect(style.getPropertyValue("--accent")).toBe("#2563eb");
  });

  it("sets dark-mode CSS variables", () => {
    applyTheme("dark");
    const style = document.documentElement.style;
    expect(style.getPropertyValue("--bg-primary")).toBe("#1a1a2e");
    expect(style.getPropertyValue("--text-primary")).toBe("#e0e0e0");
    expect(style.getPropertyValue("--accent")).toBe("#4a9eff");
  });

  it("switching themes overwrites prior variables", () => {
    applyTheme("light");
    applyTheme("dark");
    expect(document.documentElement.style.getPropertyValue("--bg-primary")).toBe("#1a1a2e");
  });
});
