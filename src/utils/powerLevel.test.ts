import { describe, expect, it } from "vitest";
import { computePowerLevel } from "./powerLevel";

const cfg = (bpModeSquared = false, conStatInc = 0.5) => ({ conStatInc, bpModeSquared });

describe("computePowerLevel", () => {
  it("matches the mod's atr * 35 formula in unsquared mode", () => {
    // hp=20 → atr=floor(20/0.5)=40 → res=40*35=1400
    expect(computePowerLevel("20", cfg(false))).toBe(1400);
  });

  it("squares per floor(res/2) when BPMode is on", () => {
    // hp=20 → res=1400 → 1400 * floor(1400/2)=1400*700=980000
    expect(computePowerLevel("20", cfg(true))).toBe(980_000);
  });

  it("clamps result to a minimum of 1", () => {
    // atr=0 → res=max(2, 0)=2 → returns max(1, 2)=2; verify the floor doesn't yield 0
    expect(computePowerLevel("0.1", cfg(false))).toBeGreaterThanOrEqual(1);
  });

  it("returns null when HP is non-numeric", () => {
    expect(computePowerLevel("abc", cfg(false))).toBeNull();
    expect(computePowerLevel("", cfg(false))).toBeNull();
  });

  it("returns null when HP is non-positive", () => {
    expect(computePowerLevel("0", cfg(false))).toBeNull();
    expect(computePowerLevel("-5", cfg(false))).toBeNull();
  });

  it("returns null when conStatInc is non-positive", () => {
    expect(computePowerLevel("20", cfg(false, 0))).toBeNull();
    expect(computePowerLevel("20", cfg(false, -0.5))).toBeNull();
  });

  it("returns null when squared result overflows MAX_SAFE_INTEGER", () => {
    // hp=1e7 → atr=2e7 → res=7e8 → squared/2 ≈ 2.45e17 > 9.0e15
    expect(computePowerLevel("10000000", cfg(true))).toBeNull();
  });

  it("still returns a finite number for huge HP in unsquared mode", () => {
    expect(computePowerLevel("10000000", cfg(false))).toBe(700_000_000);
  });

  it("uses different conStatInc values", () => {
    // hp=100, conStatInc=2 → atr=50 → res=1750
    expect(computePowerLevel("100", cfg(false, 2))).toBe(1750);
  });
});
