import { beforeEach, describe, expect, it } from "vitest";
import {
  validateBundleStructure,
  createEmptyBundle,
  createEmptyMission,
  getRecentFiles,
  clearRecentFiles,
  saveAutoSaveData,
  loadAutoSaveData,
  clearAutoSaveData,
} from "./files";

const validBundle = () => ({
  name: "Test",
  version: "1.0",
  desc: "",
  authors: "",
  mods: "",
  missions: [
    {
      id: 0,
      translated: false,
      props: ["default"],
      align: ["neutral"],
      title: ["Mission"],
      subtitle: [""],
      description: [""],
      objectives: [["start"]],
      rewards: [["nothing;;0"]],
    },
  ],
  settings: { repeat: "-1", unlock: "", vars: "" },
});

describe("validateBundleStructure", () => {
  it("accepts a valid bundle", () => {
    expect(validateBundleStructure(validBundle())).toBeNull();
  });

  it("rejects null, primitives, and arrays at the top level", () => {
    expect(validateBundleStructure(null)).toContain("not a JSON object");
    expect(validateBundleStructure("hi")).toContain("not a JSON object");
    expect(validateBundleStructure([])).toContain("not a JSON object");
  });

  it("requires 'name' and 'version' to be strings", () => {
    const noName = validBundle() as unknown as Record<string, unknown>;
    delete noName.name;
    expect(validateBundleStructure(noName)).toContain("name");

    const badVersion = { ...validBundle(), version: 42 };
    expect(validateBundleStructure(badVersion)).toContain("version");
  });

  it("requires 'missions' to be an array", () => {
    expect(validateBundleStructure({ ...validBundle(), missions: "x" })).toContain("missions");
  });

  it("rejects bad 'settings' shape but allows null/undefined", () => {
    expect(validateBundleStructure({ ...validBundle(), settings: null })).toBeNull();
    expect(validateBundleStructure({ ...validBundle(), settings: undefined })).toBeNull();
    expect(validateBundleStructure({ ...validBundle(), settings: [] })).toContain("settings");
    expect(validateBundleStructure({ ...validBundle(), settings: "no" })).toContain("settings");
  });

  it("validates each mission's required arrays", () => {
    const b = validBundle();
    (b.missions[0] as unknown as Record<string, unknown>).id = "x";
    expect(validateBundleStructure(b)).toContain("id");

    const b2 = validBundle();
    (b2.missions[0] as unknown as Record<string, unknown>).props = "x";
    expect(validateBundleStructure(b2)).toContain("props");

    const b3 = validBundle();
    (b3.missions[0] as unknown as Record<string, unknown>).title = "x";
    expect(validateBundleStructure(b3)).toContain("title");
  });

  it("rejects a non-object inside missions array", () => {
    const b = validBundle();
    (b.missions as unknown as unknown[])[0] = null;
    expect(validateBundleStructure(b)).toContain("not an object");
  });
});

describe("createEmptyBundle", () => {
  it("returns a bundle that passes structural validation", () => {
    const b = createEmptyBundle();
    expect(validateBundleStructure(b)).toBeNull();
  });

  it("starts with no missions", () => {
    expect(createEmptyBundle().missions).toEqual([]);
  });
});

describe("createEmptyMission", () => {
  it("creates a mission with a 'start' objective and 'nothing' reward", () => {
    const m = createEmptyMission(7);
    expect(m.id).toBe(7);
    expect(m.objectives[0][0]).toBe("start");
    expect(m.rewards[0][0]).toBe("nothing;;0");
  });

  it("respects translated and alignment defaults", () => {
    const m = createEmptyMission(0, { translated: true, alignment: "good" });
    expect(m.translated).toBe(true);
    expect(m.align[0]).toBe("good");
  });

  it("falls back to neutral when no alignment is given", () => {
    expect(createEmptyMission(0).align[0]).toBe("neutral");
  });
});

describe("recent files", () => {
  beforeEach(() => localStorage.clear());

  it("returns an empty array when nothing is stored", () => {
    expect(getRecentFiles()).toEqual([]);
  });

  it("returns parsed paths when stored", () => {
    localStorage.setItem("mission-editor-recent-files", JSON.stringify(["/a", "/b"]));
    expect(getRecentFiles()).toEqual(["/a", "/b"]);
  });

  it("returns an empty array on malformed storage", () => {
    localStorage.setItem("mission-editor-recent-files", "{not json");
    expect(getRecentFiles()).toEqual([]);
  });

  it("clearRecentFiles wipes storage", () => {
    localStorage.setItem("mission-editor-recent-files", JSON.stringify(["/x"]));
    clearRecentFiles();
    expect(getRecentFiles()).toEqual([]);
  });
});

describe("auto-save", () => {
  beforeEach(() => localStorage.clear());

  it("returns null when no autosave is stored", () => {
    expect(loadAutoSaveData()).toBeNull();
  });

  it("round-trips bundle data through localStorage", () => {
    const data = { bundles: [{ bundle: createEmptyBundle(), path: "/x" }] };
    saveAutoSaveData(data);
    const loaded = loadAutoSaveData();
    expect(loaded).not.toBeNull();
    expect(loaded!.bundles).toHaveLength(1);
    expect(loaded!.bundles[0].path).toBe("/x");
  });

  it("returns null on malformed storage", () => {
    localStorage.setItem("mission-editor-autosave", "{not json");
    expect(loadAutoSaveData()).toBeNull();
  });

  it("clearAutoSaveData wipes storage", () => {
    saveAutoSaveData({ bundles: [{ bundle: createEmptyBundle() }] });
    clearAutoSaveData();
    expect(loadAutoSaveData()).toBeNull();
  });
});
