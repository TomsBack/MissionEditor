import { describe, expect, it } from "vitest";
import { parseReward, serializeReward, REWARD_TYPE_LABELS, TP_MODE_LABELS } from "./rewards";

describe("parseReward", () => {
  it("parses a single TP component", () => {
    const r = parseReward("tp!fix!150;Continue;1");
    expect(r.components).toEqual([{ type: "tp", tpMode: "fix", value: "150" }]);
    expect(r.buttonName).toBe("Continue");
    expect(r.nextMissionId).toBe(1);
  });

  it("parses multiple components separated by ||", () => {
    const r = parseReward("tp!fix!100||align!+10;Protect;2");
    expect(r.components).toHaveLength(2);
    expect(r.components[0]).toEqual({ type: "tp", tpMode: "fix", value: "100" });
    expect(r.components[1]).toEqual({ type: "align", value: "+10" });
  });

  it("parses 'nothing' as a no-op reward", () => {
    const r = parseReward("nothing;;0");
    expect(r.components).toEqual([{ type: "nothing", value: "" }]);
    expect(r.buttonName).toBe("");
    expect(r.nextMissionId).toBe(0);
  });

  it("defaults nextMissionId to 0 when missing", () => {
    expect(parseReward("nothing;Btn").nextMissionId).toBe(0);
    expect(parseReward("nothing").nextMissionId).toBe(0);
  });

  it("parses 'item' components", () => {
    const r = parseReward("item!minecraft:diamond,5;;1");
    expect(r.components[0]).toEqual({ type: "item", value: "minecraft:diamond,5" });
  });

  it("preserves '!' inside command values", () => {
    const r = parseReward("com!give @p diamond 1!0;Run;0");
    expect(r.components[0]).toEqual({ type: "com", value: "give @p diamond 1!0" });
  });

  it("parses TP modes lvl, align, lvlalign", () => {
    expect(parseReward("tp!lvl!10;;0").components[0]).toEqual({ type: "tp", tpMode: "lvl", value: "10" });
    expect(parseReward("tp!align!10;;0").components[0]).toEqual({ type: "tp", tpMode: "align", value: "10" });
    expect(parseReward("tp!lvlalign!10;;0").components[0]).toEqual({ type: "tp", tpMode: "lvlalign", value: "10" });
  });

  it("falls back to 'nothing' for malformed components", () => {
    const r = parseReward("garbage;;0");
    expect(r.components[0].type).toBe("nothing");
  });

  it("yields a single 'nothing' component when component string is empty", () => {
    const r = parseReward(";Btn;0");
    expect(r.components).toEqual([{ type: "nothing", value: "" }]);
  });
});

describe("serializeReward", () => {
  it("round-trips a multi-component reward", () => {
    const raw = "tp!fix!100||align!+10;Protect;2";
    expect(serializeReward(parseReward(raw))).toBe(raw);
  });

  it("preserves nextMissionId of 0", () => {
    const r = parseReward("nothing;;0");
    expect(serializeReward(r)).toBe("nothing;;0");
  });

  it("falls back to 'fix' tpMode when missing", () => {
    const r = serializeReward({
      components: [{ type: "tp", value: "10" }],
      buttonName: "X",
      nextMissionId: 0,
    });
    expect(r).toBe("tp!fix!10;X;0");
  });

  it("emits 'nothing' for nothing components", () => {
    const r = serializeReward({
      components: [{ type: "nothing", value: "" }],
      buttonName: "",
      nextMissionId: 0,
    });
    expect(r).toBe("nothing;;0");
  });
});

describe("reward labels", () => {
  it("exposes label maps for every type", () => {
    expect(REWARD_TYPE_LABELS.tp).toBeTruthy();
    expect(REWARD_TYPE_LABELS.item).toBeTruthy();
    expect(REWARD_TYPE_LABELS.align).toBeTruthy();
    expect(REWARD_TYPE_LABELS.com).toBeTruthy();
    expect(REWARD_TYPE_LABELS.nothing).toBeTruthy();
    expect(TP_MODE_LABELS.fix).toBeTruthy();
    expect(TP_MODE_LABELS.lvl).toBeTruthy();
  });
});
