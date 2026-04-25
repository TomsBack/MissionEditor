import { describe, expect, it } from "vitest";
import { computeEditedMissionIds } from "./missionDirty";
import { createEmptyBundle, createEmptyMission } from "./files";
import type { MissionBundle } from "../types/mission";

function bundleWithMissions(): MissionBundle {
  const b = createEmptyBundle();
  b.missions = [createEmptyMission(0), createEmptyMission(1), createEmptyMission(2)];
  return b;
}

describe("computeEditedMissionIds", () => {
  it("returns empty when the bundle is not dirty", () => {
    const b = bundleWithMissions();
    const json = JSON.stringify(b, null, 2);
    expect(computeEditedMissionIds(b, json, false).size).toBe(0);
  });

  it("returns empty when bundle is dirty but content matches the original (e.g. undo back to saved)", () => {
    const b = bundleWithMissions();
    const json = JSON.stringify(b, null, 2);
    expect(computeEditedMissionIds(b, json, true).size).toBe(0);
  });

  it("flags every mission when the bundle is dirty and originalJson is missing", () => {
    // Auto-save recovery without an on-disk baseline.
    const b = bundleWithMissions();
    const ids = computeEditedMissionIds(b, undefined, true);
    expect(ids.size).toBe(3);
    expect(ids.has(0)).toBe(true);
    expect(ids.has(1)).toBe(true);
    expect(ids.has(2)).toBe(true);
  });

  it("flags only the mission whose content actually changed", () => {
    const original = bundleWithMissions();
    const json = JSON.stringify(original, null, 2);

    const edited = bundleWithMissions();
    edited.missions[1] = { ...edited.missions[1], title: ["Changed"] };

    const ids = computeEditedMissionIds(edited, json, true);
    expect(ids.size).toBe(1);
    expect(ids.has(1)).toBe(true);
  });

  it("flags newly-added missions whose IDs aren't in the original", () => {
    const original = bundleWithMissions();
    const json = JSON.stringify(original, null, 2);

    const edited = bundleWithMissions();
    edited.missions.push(createEmptyMission(99));

    const ids = computeEditedMissionIds(edited, json, true);
    expect(ids.size).toBe(1);
    expect(ids.has(99)).toBe(true);
  });

  it("survives a JSON-indent round-trip without false positives", () => {
    // Open path: handleOpen stores originalJson with user's jsonIndent.
    // The diff should not flag anything purely because of formatting.
    const b = bundleWithMissions();
    const indented = JSON.stringify(b, null, 4);
    expect(computeEditedMissionIds(b, indented, true).size).toBe(0);

    const compact = JSON.stringify(b);
    expect(computeEditedMissionIds(b, compact, true).size).toBe(0);
  });

  it("returns empty when originalJson is unparseable rather than throwing", () => {
    const b = bundleWithMissions();
    expect(() => computeEditedMissionIds(b, "{not json", true)).not.toThrow();
    expect(computeEditedMissionIds(b, "{not json", true).size).toBe(0);
  });
});
