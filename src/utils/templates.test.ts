import { describe, expect, it } from "vitest";
import {
  MISSION_TEMPLATES,
  threeAlignmentTpReward,
  threeAlignmentItemReward,
  nothingReward,
} from "./templates";
import { parseObjective } from "./objectives";
import { parseReward } from "./rewards";

describe("MISSION_TEMPLATES", () => {
  it("each template builds a Mission with consistent parallel-array lengths", () => {
    expect(MISSION_TEMPLATES.length).toBeGreaterThan(0);
    for (const tpl of MISSION_TEMPLATES) {
      const m = tpl.create(42);
      const variantCount = m.props.length;
      expect(m.id).toBe(42);
      expect(variantCount).toBeGreaterThan(0);
      expect(m.title).toHaveLength(variantCount);
      expect(m.subtitle).toHaveLength(variantCount);
      expect(m.description).toHaveLength(variantCount);
      expect(m.align).toHaveLength(variantCount);
      expect(m.objectives).toHaveLength(variantCount);
      expect(m.rewards).toHaveLength(variantCount);
    }
  });

  it("the 'Empty' template starts with a 'start' button-only objective", () => {
    const tpl = MISSION_TEMPLATES.find((t) => t.name === "Empty");
    expect(tpl).toBeDefined();
    const m = tpl!.create(0);
    expect(m.objectives[0][0]).toBe("start");
  });

  it("the 'Kill Boss' template emits a kill objective with a protect spawn flag", () => {
    const tpl = MISSION_TEMPLATES.find((t) => t.name === "Kill Boss");
    const m = tpl!.create(5);
    const kill = m.objectives[0].find((o) => o.startsWith("kill;"));
    expect(kill).toBeDefined();
    expect(parseObjective(kill!).protect).toBe("spwn");
  });

  it("kill template threads nextMissionId = id + 1 into rewards", () => {
    const tpl = MISSION_TEMPLATES.find((t) => t.name === "Kill Boss");
    const m = tpl!.create(7);
    for (const raw of m.rewards[0]) {
      expect(parseReward(raw).nextMissionId).toBe(8);
    }
  });

  it("template rewards parse cleanly", () => {
    for (const tpl of MISSION_TEMPLATES) {
      const m = tpl.create(0);
      for (const raw of m.rewards[0]) {
        const r = parseReward(raw);
        expect(r.components.length).toBeGreaterThan(0);
      }
    }
  });
});

describe("reward presets", () => {
  it("threeAlignmentTpReward emits three choices with +10/0/-10 alignment", () => {
    const choices = threeAlignmentTpReward("100", 5);
    expect(choices).toHaveLength(3);
    const aligns = choices.map((raw) => parseReward(raw).components.find((c) => c.type === "align")?.value);
    expect(aligns).toEqual(["+10", "0", "-10"]);
  });

  it("threeAlignmentTpReward defaults TP mode to 'fix'", () => {
    const [first] = threeAlignmentTpReward("50", 1);
    const tp = parseReward(first).components.find((c) => c.type === "tp");
    expect(tp).toMatchObject({ tpMode: "fix", value: "50" });
  });

  it("threeAlignmentTpReward respects an explicit mode", () => {
    const [first] = threeAlignmentTpReward("10", 1, "lvlalign");
    const tp = parseReward(first).components.find((c) => c.type === "tp");
    expect(tp).toMatchObject({ tpMode: "lvlalign" });
  });

  it("threeAlignmentItemReward includes item, tp, and align components", () => {
    const [first] = threeAlignmentItemReward("minecraft:diamond,5", 5, "200", 9);
    const r = parseReward(first);
    const types = r.components.map((c) => c.type);
    expect(types).toContain("item");
    expect(types).toContain("tp");
    expect(types).toContain("align");
    expect(r.nextMissionId).toBe(9);
  });

  it("nothingReward returns a single transition string", () => {
    const [only] = nothingReward(3);
    expect(parseReward(only).components[0].type).toBe("nothing");
    expect(parseReward(only).nextMissionId).toBe(3);
  });
});
