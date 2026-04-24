import { beforeEach, describe, expect, it } from "vitest";
import { loadSettings, saveSettings } from "./settings";

const KEY = "mission-editor-settings";

describe("settings persistence", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns defaults when no settings are stored", () => {
    const s = loadSettings();
    expect(s.theme).toBe("dark");
    expect(s.plBPModeSquared).toBe(false);
    expect(s.plConStatInc).toBe(0.5);
  });

  it("returns defaults on malformed JSON", () => {
    localStorage.setItem(KEY, "{not json");
    const s = loadSettings();
    expect(s.theme).toBe("dark");
  });

  it("persists and reloads modified settings", () => {
    const s = loadSettings();
    s.theme = "light";
    s.fontSize = 16;
    saveSettings(s);

    const reloaded = loadSettings();
    expect(reloaded.theme).toBe("light");
    expect(reloaded.fontSize).toBe(16);
  });

  it("does not leak __version into the runtime settings shape", () => {
    saveSettings(loadSettings());
    const reloaded = loadSettings() as unknown as Record<string, unknown>;
    expect(reloaded.__version).toBeUndefined();
  });
});

describe("settings v2 migration", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("resets plBPModeSquared on legacy unversioned data", () => {
    localStorage.setItem(KEY, JSON.stringify({ plBPModeSquared: true, theme: "light" }));
    const s = loadSettings();
    expect(s.plBPModeSquared).toBe(false);
    expect(s.theme).toBe("light"); // unrelated values are preserved
  });

  it("preserves plBPModeSquared once data is at v2", () => {
    localStorage.setItem(KEY, JSON.stringify({ __version: 2, plBPModeSquared: true }));
    const s = loadSettings();
    expect(s.plBPModeSquared).toBe(true);
  });

  it("strips __version from the saved shape after a save round-trip", () => {
    saveSettings(loadSettings());
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "{}");
    expect(raw.__version).toBe(2);
    // The runtime object exposed to consumers must not carry __version through.
    const s = loadSettings();
    expect(Object.prototype.hasOwnProperty.call(s, "__version")).toBe(false);
  });
});
