import { describe, expect, it } from "vitest";
import {
  OBJECTIVE_TYPES,
  BUTTON_TYPES,
  ACTION_TYPES,
  REWARD_TYPES,
  TP_MODES,
} from "./mission";

describe("type registry constants", () => {
  it("OBJECTIVE_TYPES enumerates every objective key including button-only ones", () => {
    expect(OBJECTIVE_TYPES).toContain("kill");
    expect(OBJECTIVE_TYPES).toContain("killsame");
    expect(OBJECTIVE_TYPES).toContain("biome");
    expect(OBJECTIVE_TYPES).toContain("item");
    expect(OBJECTIVE_TYPES).toContain("talk");
    expect(OBJECTIVE_TYPES).toContain("lvl");
    // Button-only types are part of the master list too.
    for (const t of BUTTON_TYPES) {
      expect(OBJECTIVE_TYPES).toContain(t);
    }
  });

  it("BUTTON_TYPES are exactly the no-field action triggers", () => {
    expect(new Set(BUTTON_TYPES)).toEqual(new Set(["next", "start", "skip", "restart"]));
  });

  it("ACTION_TYPES are valid first-objective markers", () => {
    expect(new Set(ACTION_TYPES)).toEqual(new Set(["next", "start", "skip", "restart"]));
  });

  it("REWARD_TYPES covers every reward variant", () => {
    expect(new Set(REWARD_TYPES)).toEqual(new Set(["nothing", "tp", "item", "align", "com"]));
  });

  it("TP_MODES enumerates every TP mode", () => {
    expect(new Set(TP_MODES)).toEqual(new Set(["fix", "lvl", "align", "lvlalign"]));
  });

  it("constant lists have no duplicates", () => {
    expect(new Set(OBJECTIVE_TYPES).size).toBe(OBJECTIVE_TYPES.length);
    expect(new Set(REWARD_TYPES).size).toBe(REWARD_TYPES.length);
    expect(new Set(TP_MODES).size).toBe(TP_MODES.length);
  });
});
