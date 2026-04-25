import { describe, expect, it } from "vitest";
import {
  findMatchingVariant,
  computeCoverage,
  describeProp,
} from "./variantMatcher";

describe("findMatchingVariant", () => {
  it("returns 0 when nothing matches (the fallback slot)", () => {
    expect(findMatchingVariant(["default"], "Saiyan", "MartialArtist")).toBe(0);
    expect(findMatchingVariant(["default", "Namekian"], "Saiyan", "Spiritualist")).toBe(0);
  });

  it("matches by race name (case-insensitive)", () => {
    expect(findMatchingVariant(["default", "Saiyan"], "Saiyan", "MartialArtist")).toBe(1);
    expect(findMatchingVariant(["default", "saiyan"], "Saiyan", "MartialArtist")).toBe(1);
  });

  it("matches by class name", () => {
    expect(findMatchingVariant(["default", "MartialArtist"], "Human", "MartialArtist")).toBe(1);
  });

  it("returns the FIRST matching variant when multiple could match", () => {
    // Saiyan player matches both the "Saiyan" slot and the "MartialArtist" slot;
    // earlier index wins.
    expect(findMatchingVariant(["default", "Saiyan", "MartialArtist"], "Saiyan", "MartialArtist")).toBe(1);
    expect(findMatchingVariant(["default", "MartialArtist", "Saiyan"], "Saiyan", "MartialArtist")).toBe(1);
  });

  it("DBC saga (mode 1): Half-Saiyan is remapped to Saiyan before lookup", () => {
    expect(findMatchingVariant(["default", "Saiyan"], "Half-Saiyan", "MartialArtist", 1)).toBe(1);
  });

  it("DBC saga (mode 1): a literal Half-Saiyan slot is never reached", () => {
    expect(findMatchingVariant(["default", "Half-Saiyan"], "Half-Saiyan", "MartialArtist", 1)).toBe(0);
  });

  it("NC saga (mode 2): Half-Saiyan is NOT remapped", () => {
    expect(findMatchingVariant(["default", "Half-Saiyan"], "Half-Saiyan", "MartialArtist", 2)).toBe(1);
  });

  it("ignores empty prop slots", () => {
    expect(findMatchingVariant(["", "Saiyan"], "Saiyan", "MartialArtist")).toBe(1);
  });
});

describe("computeCoverage", () => {
  it("groups every DBC race+class combo by the variant index it resolves to", () => {
    const coverage = computeCoverage(["default", "Saiyan"]);
    // 6 races × 3 classes = 18 combos total.
    const total = [...coverage.values()].reduce((s, v) => s + v.combos.length, 0);
    expect(total).toBe(18);

    // Saiyan + Half-Saiyan (3 classes each) = 6 combos to variant 1.
    expect(coverage.get(1)!.combos.length).toBe(6);
    // Remaining 12 fall through to variant 0.
    expect(coverage.get(0)!.combos.length).toBe(12);
  });

  it("a class-keyed variant catches that class across every race", () => {
    const coverage = computeCoverage(["default", "MartialArtist"]);
    // 6 races, all MartialArtist → 6 combos to variant 1.
    expect(coverage.get(1)!.combos.length).toBe(6);
    expect(coverage.get(1)!.combos.every((c) => c.klass === "MartialArtist")).toBe(true);
  });
});

describe("describeProp", () => {
  it("classifies a known race", () => {
    const d = describeProp("Saiyan");
    expect(d.races).toEqual(["Saiyan"]);
    expect(d.catchesHalfSaiyan).toBe(true);
    expect(d.isUnknown).toBe(false);
  });

  it("classifies a known class", () => {
    const d = describeProp("Warrior");
    expect(d.classes).toEqual(["Warrior"]);
    expect(d.isUnknown).toBe(false);
  });

  it("flags Half-Saiyan as unreachable in DBC saga", () => {
    const d = describeProp("Half-Saiyan");
    expect(d.isUnreachableHalfSaiyan).toBe(true);
  });

  it("flags an unknown value (typo) as unknown", () => {
    const d = describeProp("Sayian");
    expect(d.isUnknown).toBe(true);
    expect(d.races).toEqual([]);
    expect(d.classes).toEqual([]);
  });

  it("treats empty as unknown", () => {
    expect(describeProp("").isUnknown).toBe(true);
  });
});
