import type { Mission, MissionBundle } from "../types/mission";

/**
 * Derive the set of mission IDs whose JSON content differs from the
 * last-saved on-disk version (`originalJson`). Used by the sidebar to draw a
 * per-mission dirty dot.
 *
 * Behavior:
 *   - Clean bundle (`dirty === false`): no missions are flagged. Bundle-level
 *     dirty is authoritative; if the bundle as a whole isn't dirty, no
 *     mission can be either.
 *   - Dirty bundle with no `originalJson` (newly created, or auto-save
 *     recovered without an on-disk reference): every mission is flagged,
 *     because there's no baseline to compare against.
 *   - Dirty bundle with `originalJson`: stringify each mission and compare
 *     against the same-id mission in the parsed original. Mismatches and
 *     newly-added IDs are flagged.
 */
export function computeEditedMissionIds(
  bundle: MissionBundle,
  originalJson: string | undefined,
  dirty: boolean,
): Set<number> {
  const ids = new Set<number>();
  if (!dirty) return ids;
  if (!originalJson) {
    for (const m of bundle.missions) ids.add(m.id);
    return ids;
  }

  let original: { missions?: Mission[] };
  try {
    original = JSON.parse(originalJson);
  } catch {
    return ids;
  }

  const originalById = new Map<number, string>();
  for (const m of original.missions ?? []) {
    originalById.set(m.id, JSON.stringify(m));
  }
  for (const m of bundle.missions) {
    const before = originalById.get(m.id);
    if (before === undefined || before !== JSON.stringify(m)) ids.add(m.id);
  }
  return ids;
}
