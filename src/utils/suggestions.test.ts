import { describe, expect, it } from "vitest";
import { DBC_TRANSFORMATIONS, MC_SOUNDS } from "./suggestions";

describe("suggestion lists", () => {
  it("DBC transformations include canonical Saiyan and Frieza forms", () => {
    expect(DBC_TRANSFORMATIONS).toContain("ssj1");
    expect(DBC_TRANSFORMATIONS).toContain("ssjg");
    expect(DBC_TRANSFORMATIONS).toContain("ssjb");
    expect(DBC_TRANSFORMATIONS).toContain("ultrainstinct");
    expect(DBC_TRANSFORMATIONS).toContain("frieza2");
    expect(DBC_TRANSFORMATIONS).toContain("majinpure");
  });

  it("transformations are unique", () => {
    expect(new Set(DBC_TRANSFORMATIONS).size).toBe(DBC_TRANSFORMATIONS.length);
  });

  it("MC sounds include common mob and ambient events", () => {
    expect(MC_SOUNDS).toContain("mob.zombie.death");
    expect(MC_SOUNDS).toContain("mob.creeper.say");
    expect(MC_SOUNDS).toContain("random.explode");
    expect(MC_SOUNDS).toContain("ambient.cave.cave");
  });

  it("MC sounds are unique", () => {
    expect(new Set(MC_SOUNDS).size).toBe(MC_SOUNDS.length);
  });
});
