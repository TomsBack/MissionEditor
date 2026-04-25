import { describe, expect, it } from "vitest";
import { validateBundle } from "./validation";
import type { Mission, MissionBundle } from "../types/mission";

function mission(overrides: Partial<Mission> = {}): Mission {
  return {
    id: 0,
    translated: false,
    props: ["default"],
    align: ["neutral"],
    title: ["Mission"],
    subtitle: [""],
    description: ["Description"],
    objectives: [["start"]],
    rewards: [["nothing;;0"]],
    ...overrides,
  };
}

function bundle(missions: Mission[] = [], overrides: Partial<MissionBundle> = {}): MissionBundle {
  return {
    name: "Test Bundle",
    version: "1.0",
    desc: "",
    authors: "",
    mods: "",
    missions,
    settings: { repeat: "-1", unlock: "", vars: "" },
    ...overrides,
  };
}

const messages = (warnings: { message: string }[]) => warnings.map((w) => w.message);

describe("bundle-level validation", () => {
  it("warns when name is missing", () => {
    const w = validateBundle(bundle([mission()], { name: "" }));
    expect(messages(w)).toContain("Bundle has no name");
  });

  it("warns when version is missing", () => {
    const w = validateBundle(bundle([mission()], { version: "" }));
    expect(messages(w)).toContain("Bundle has no version");
  });

  it("returns no warnings for a healthy single-mission bundle", () => {
    expect(validateBundle(bundle([mission()]))).toHaveLength(0);
  });

  it("does not flag nextMissionId=0 as self-reference even on the id=0 mission", () => {
    // Convention: 0 means "no next mission" / end of chain.
    const m = mission({ id: 0, rewards: [["nothing;;0"]] });
    const w = validateBundle(bundle([m]));
    expect(w.some((x) => x.message.includes("points to itself"))).toBe(false);
  });
});

describe("mission-level validation", () => {
  it("flags duplicate mission IDs as errors", () => {
    const w = validateBundle(bundle([mission({ id: 1 }), mission({ id: 1 })]));
    const dup = w.find((x) => x.message.includes("Duplicate mission ID"));
    expect(dup).toBeDefined();
    expect(dup!.level).toBe("error");
  });

  it("flags missions with no property variants", () => {
    const w = validateBundle(bundle([mission({ props: [], align: [], title: [], subtitle: [], description: [], objectives: [], rewards: [] })]));
    expect(messages(w)).toContain("Mission has no property variants");
  });

  it("flags array length mismatches", () => {
    const m = mission({
      props: ["a", "b"],
      align: ["neutral"], // length 1, mismatch
      title: ["a", "b"],
      subtitle: ["", ""],
      description: ["", ""],
      objectives: [[], []],
      rewards: [[], []],
    });
    const w = validateBundle(bundle([m]));
    expect(w.some((x) => x.message.includes("Array length mismatch"))).toBe(true);
  });

  it("warns about empty property names", () => {
    const w = validateBundle(bundle([mission({ props: [""] })]));
    expect(w.some((x) => x.message.includes("Empty property name"))).toBe(true);
  });

  it("warns about missing title and description per variant", () => {
    const w = validateBundle(bundle([mission({ title: [""], description: [""] })]));
    expect(w.some((x) => x.message.includes("Missing title"))).toBe(true);
    expect(w.some((x) => x.message.includes("Missing description"))).toBe(true);
  });

  it("warns about invalid alignment values", () => {
    const w = validateBundle(bundle([mission({ align: ["chaotic"] })]));
    expect(w.some((x) => x.message.includes("Alignment"))).toBe(true);
  });

  it("accepts good/neutral/evil alignment regardless of case", () => {
    const w = validateBundle(bundle([mission({ align: ["GOOD"] })]));
    expect(w.some((x) => x.message.includes("Alignment"))).toBe(false);
  });

  it("ignores empty alignment (treated as default)", () => {
    const w = validateBundle(bundle([mission({ align: [""] })]));
    expect(w.some((x) => x.message.includes("Alignment"))).toBe(false);
  });
});

describe("objective validation", () => {
  it("warns when first objective is not a button-only action type", () => {
    const m = mission({ objectives: [["kill;NZombie;H100;A10"]] });
    const w = validateBundle(bundle([m]));
    expect(w.some((x) => x.message.includes("First objective should be an action type"))).toBe(true);
  });

  it("warns when a kill objective has invalid health", () => {
    const m = mission({ objectives: [["start", "kill;NZombie;Habc;A10"]] });
    const w = validateBundle(bundle([m]));
    expect(w.some((x) => x.message.includes("health"))).toBe(true);
  });

  it("warns when a kill objective has zero or negative attack", () => {
    const m = mission({ objectives: [["start", "kill;NZombie;H100;A0"]] });
    const w = validateBundle(bundle([m]));
    expect(w.some((x) => x.message.includes("attack"))).toBe(true);
  });

  it("warns when killsame has missing or non-positive amount", () => {
    const m = mission({ objectives: [["start", "killsame;NZombie;Mxyz;H10"]] });
    const w = validateBundle(bundle([m]));
    expect(w.some((x) => x.message.includes("amount"))).toBe(true);
  });

  it("warns when lvl objective has non-numeric target", () => {
    // lvl uses M (amount) for the level target, not N — the mod's
    // MissionProgress check reads getMCo_dataI(os, "M").
    const m = mission({ objectives: [["start", "lvl;Mabc"]] });
    const w = validateBundle(bundle([m]));
    expect(w.some((x) => x.message.includes("level target"))).toBe(true);
  });

  it("warns when an item objective is missing its name target", () => {
    const m = mission({ objectives: [["start", "item;M5"]] });
    const w = validateBundle(bundle([m]));
    expect(w.some((x) => x.message.includes("missing Name/Target"))).toBe(true);
  });

  it("does not warn about a valid kill objective", () => {
    const m = mission({ objectives: [["start", "kill;NZombie;H100;A10"]] });
    const w = validateBundle(bundle([m]));
    expect(w.some((x) => x.message.includes("health"))).toBe(false);
    expect(w.some((x) => x.message.includes("attack"))).toBe(false);
  });
});

describe("reward validation", () => {
  it("flags references to nonexistent mission IDs as errors", () => {
    const m = mission({ id: 0, rewards: [["nothing;;99"]] });
    const w = validateBundle(bundle([m]));
    const broken = w.find((x) => x.message.includes("does not exist"));
    expect(broken).toBeDefined();
    expect(broken!.level).toBe("error");
  });

  it("warns when a reward points to its own mission", () => {
    const m = mission({ id: 5, rewards: [["nothing;;5"]] });
    const w = validateBundle(bundle([m]));
    expect(w.some((x) => x.message.includes("points to itself"))).toBe(true);
  });

  it("warns when a TP component has no value", () => {
    const m = mission({ rewards: [["tp!fix!;Btn;0"]] });
    const w = validateBundle(bundle([m]));
    expect(w.some((x) => x.message.includes("TP component"))).toBe(true);
  });

  it("warns when an alignment component has a non-numeric value", () => {
    const m = mission({ rewards: [["align!banana;Btn;0"]] });
    const w = validateBundle(bundle([m]));
    expect(w.some((x) => x.message.includes("alignment value"))).toBe(true);
  });

  it("warns when an item component has no value", () => {
    const m = mission({ rewards: [["item!;Btn;0"]] });
    const w = validateBundle(bundle([m]));
    expect(w.some((x) => x.message.includes("item component has no item"))).toBe(true);
  });

  it("warns when a command component is empty", () => {
    const m = mission({ rewards: [["com!;Btn;0"]] });
    const w = validateBundle(bundle([m]));
    expect(w.some((x) => x.message.includes("command component is empty"))).toBe(true);
  });

  it("treats nextMissionId of 0 as 'end' (not a broken reference)", () => {
    const m = mission({ rewards: [["nothing;;0"]] });
    const w = validateBundle(bundle([m]));
    expect(w.some((x) => x.message.includes("does not exist"))).toBe(false);
  });
});

describe("orphaned mission detection", () => {
  it("flags missions past the first that no other mission links to", () => {
    const m0 = mission({ id: 0, rewards: [["nothing;;0"]] }); // no link to mission 1
    const m1 = mission({ id: 1 });
    const w = validateBundle(bundle([m0, m1]));
    expect(w.some((x) => x.missionId === 1 && x.message.includes("Orphaned"))).toBe(true);
  });

  it("does not flag the first mission as orphaned (entry point)", () => {
    const m0 = mission({ id: 0, rewards: [["nothing;;0"]] });
    const w = validateBundle(bundle([m0]));
    expect(w.some((x) => x.message.includes("Orphaned"))).toBe(false);
  });

  it("does not flag a mission that is referenced by a reward", () => {
    const m0 = mission({ id: 0, rewards: [["nothing;;1"]] });
    const m1 = mission({ id: 1 });
    const w = validateBundle(bundle([m0, m1]));
    expect(w.some((x) => x.message.includes("Orphaned"))).toBe(false);
  });
});

describe("error recovery", () => {
  it("returns a single crash-warning instead of throwing on malformed input", () => {
    // Force a crash inside validation by handing it a mission without arrays at all.
    const broken = bundle([{ id: 0 } as unknown as Mission]);
    const w = validateBundle(broken);
    expect(w.some((x) => x.message.includes("Validation crashed"))).toBe(true);
  });
});
