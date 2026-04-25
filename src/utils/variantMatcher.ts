import { DBC_CLASSES, DBC_RACES } from "./raceClass";

// Mirrors JRMCoreMsn.getProp on the mod side. The mod has two saga-system
// modes for the first parameter:
//   - mode 1 (DBC / Ki saga): Half-Saiyan players are remapped to the Saiyan
//     slot BEFORE the prop lookup. This is the "Half-Saiyan footgun" — a
//     literal "Half-Saiyan" entry in props will never match in DBC saga mode.
//   - mode 2 (NC / Chakra saga): no remap.
// Mode 0 (Natural) and mode 3 (SwordArt) skip variant matching entirely and
// always return 0; the editor doesn't simulate those because they're not
// saga-system players.
export type VariantMatchMode = 1 | 2;

/**
 * Find the variant index a player with the given race and class would see.
 * Falls back to 0 (the editor's "default" slot) if nothing matches, exactly
 * like the mod.
 */
export function findMatchingVariant(
  props: string[],
  race: string,
  klass: string,
  mode: VariantMatchMode = 1,
): number {
  let effectiveRace = race;
  if (mode === 1 && race.toLowerCase() === "half-saiyan") {
    effectiveRace = "Saiyan";
  }
  const r = effectiveRace.toLowerCase();
  const c = klass.toLowerCase();
  for (let i = 0; i < props.length; i++) {
    const p = (props[i] ?? "").toLowerCase();
    if (p && (p === r || p === c)) return i;
  }
  return 0;
}

export interface VariantCoverage {
  /** Race+class combos that resolve to this variant index. */
  combos: { race: string; klass: string }[];
}

/**
 * For each variant index, list the race/class combos it catches. Iterates
 * the full DBC race × class matrix in saga mode 1 (the dominant saga).
 */
export function computeCoverage(props: string[]): Map<number, VariantCoverage> {
  const coverage = new Map<number, VariantCoverage>();
  for (const race of DBC_RACES) {
    for (const klass of DBC_CLASSES) {
      const idx = findMatchingVariant(props, race, klass);
      const entry = coverage.get(idx) ?? { combos: [] };
      entry.combos.push({ race, klass });
      coverage.set(idx, entry);
    }
  }
  return coverage;
}

/** Description of what a single prop value matches. */
export interface PropSemantics {
  /** Race names that hit this prop directly. */
  races: string[];
  /** Class names that hit this prop directly. */
  classes: string[];
  /** True when the value is "Saiyan" — DBC saga mode also routes Half-Saiyan here. */
  catchesHalfSaiyan: boolean;
  /** True when the value is "Half-Saiyan" — never matches in DBC saga mode. */
  isUnreachableHalfSaiyan: boolean;
  /** True when the value matches no known race or class (a typo, or unused). */
  isUnknown: boolean;
}

const KNOWN_RACES_LOWER = new Set(DBC_RACES.map((r) => r.toLowerCase()));
const KNOWN_CLASSES_LOWER = new Set(DBC_CLASSES.map((c) => c.toLowerCase()));

/** Classify what the value in `props[i]` matches in DBC saga mode. */
export function describeProp(value: string): PropSemantics {
  const v = value.trim().toLowerCase();
  if (!v) {
    return { races: [], classes: [], catchesHalfSaiyan: false, isUnreachableHalfSaiyan: false, isUnknown: true };
  }
  const races = DBC_RACES.filter((r) => r.toLowerCase() === v);
  const classes = DBC_CLASSES.filter((c) => c.toLowerCase() === v);
  const catchesHalfSaiyan = v === "saiyan";
  const isUnreachableHalfSaiyan = v === "half-saiyan";
  const isUnknown = !KNOWN_RACES_LOWER.has(v) && !KNOWN_CLASSES_LOWER.has(v);
  return { races, classes, catchesHalfSaiyan, isUnreachableHalfSaiyan, isUnknown };
}
