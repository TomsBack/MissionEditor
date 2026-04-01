import type { MissionBundle } from "../types/mission";
import { parseObjective, FIELDS_BY_TYPE } from "./objectives";
import { parseReward } from "./rewards";

export interface ValidationWarning {
  level: "error" | "warning";
  missionIndex: number;
  missionId: number;
  message: string;
}

/** Validate an entire bundle and return all warnings. */
export function validateBundle(bundle: MissionBundle): ValidationWarning[] {
  try {
    return validateBundleInner(bundle);
  } catch (err) {
    console.error("Validation error:", err);
    return [{ level: "error", missionIndex: -1, missionId: -1, message: `Validation crashed: ${err}` }];
  }
}

function validateBundleInner(bundle: MissionBundle): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];
  const allIds = new Set<number>();
  const missionIdSet = new Set(bundle.missions.map((m) => m.id));

  // Bundle-level checks
  if (!bundle.name.trim()) {
    warnings.push({ level: "warning", missionIndex: -1, missionId: -1, message: "Bundle has no name" });
  }
  if (!bundle.version.trim()) {
    warnings.push({ level: "warning", missionIndex: -1, missionId: -1, message: "Bundle has no version" });
  }

  for (let mi = 0; mi < bundle.missions.length; mi++) {
    const mission = bundle.missions[mi];

    // Duplicate ID check
    if (allIds.has(mission.id)) {
      warnings.push({
        level: "error",
        missionIndex: mi,
        missionId: mission.id,
        message: `Duplicate mission ID: ${mission.id}`,
      });
    }
    allIds.add(mission.id);

    // No variants at all
    if (mission.props.length === 0) {
      warnings.push({
        level: "error",
        missionIndex: mi,
        missionId: mission.id,
        message: "Mission has no property variants",
      });
      continue;
    }

    // Array length mismatch (all parallel arrays should be same length)
    const propLen = mission.props.length;
    const arrays = ["align", "title", "subtitle", "description", "objectives", "rewards"] as const;
    for (const key of arrays) {
      if (mission[key].length !== propLen) {
        warnings.push({
          level: "error",
          missionIndex: mi,
          missionId: mission.id,
          message: `Array length mismatch: props has ${propLen} entries but ${key} has ${mission[key].length}`,
        });
      }
    }

    // Per-variant validation
    for (let pi = 0; pi < mission.props.length; pi++) {
      const objectives = mission.objectives[pi] ?? [];
      const rewards = mission.rewards[pi] ?? [];
      const variantLabel = mission.props.length > 1 ? ` (variant "${mission.props[pi]}")` : "";

      // Empty prop name
      if (!mission.props[pi]?.trim()) {
        warnings.push({
          level: "warning",
          missionIndex: mi,
          missionId: mission.id,
          message: `Empty property name for variant ${pi}${variantLabel}`,
        });
      }

      // Missing title
      if (!mission.title[pi]?.trim()) {
        warnings.push({
          level: "warning",
          missionIndex: mi,
          missionId: mission.id,
          message: `Missing title${variantLabel}`,
        });
      }

      // Missing description
      if (!mission.description[pi]?.trim()) {
        warnings.push({
          level: "warning",
          missionIndex: mi,
          missionId: mission.id,
          message: `Missing description${variantLabel}`,
        });
      }

      // Alignment validation
      const alignVal = mission.align[pi];
      if (alignVal !== undefined && alignVal.trim() !== "") {
        const num = Number(alignVal);
        if (isNaN(num) || num < 0 || num > 100) {
          warnings.push({
            level: "warning",
            missionIndex: mi,
            missionId: mission.id,
            message: `Alignment "${alignVal}" should be 0-100${variantLabel}`,
          });
        }
      }

      // No objectives
      if (objectives.length === 0) {
        warnings.push({
          level: "error",
          missionIndex: mi,
          missionId: mission.id,
          message: `No objectives defined${variantLabel}`,
        });
      }

      // No rewards
      if (rewards.length === 0) {
        warnings.push({
          level: "error",
          missionIndex: mi,
          missionId: mission.id,
          message: `No rewards defined${variantLabel}`,
        });
      }

      // First objective should be an action type
      if (objectives.length > 0) {
        const firstType = objectives[0]?.split(";")[0];
        const actionTypes = ["next", "start", "skip", "restart"];
        if (firstType && !actionTypes.includes(firstType)) {
          warnings.push({
            level: "warning",
            missionIndex: mi,
            missionId: mission.id,
            message: `First objective should be an action type (start/next/skip/restart), found "${firstType}"${variantLabel}`,
          });
        }
      }

      // Validate each objective
      for (let oi = 1; oi < objectives.length; oi++) {
        const raw = objectives[oi];
        if (!raw || raw.length <= 2) continue;
        const obj = parseObjective(raw);
        const requiredFields = FIELDS_BY_TYPE[obj.type] ?? [];

        if (requiredFields.includes("name") && !obj.name) {
          warnings.push({
            level: "warning",
            missionIndex: mi,
            missionId: mission.id,
            message: `Objective #${oi}${variantLabel}: missing Name/Target`,
          });
        }

        if (requiredFields.includes("amount") && !obj.amount) {
          warnings.push({
            level: "warning",
            missionIndex: mi,
            missionId: mission.id,
            message: `Objective #${oi}${variantLabel}: missing Amount`,
          });
        }

        // Kill objectives: validate health/attack are numbers
        if ((obj.type === "kill" || obj.type === "killsame") && obj.health) {
          if (isNaN(Number(obj.health)) || Number(obj.health) <= 0) {
            warnings.push({
              level: "warning",
              missionIndex: mi,
              missionId: mission.id,
              message: `Objective #${oi}${variantLabel}: health "${obj.health}" should be a positive number`,
            });
          }
        }

        if ((obj.type === "kill" || obj.type === "killsame") && obj.attack) {
          if (isNaN(Number(obj.attack)) || Number(obj.attack) <= 0) {
            warnings.push({
              level: "warning",
              missionIndex: mi,
              missionId: mission.id,
              message: `Objective #${oi}${variantLabel}: attack "${obj.attack}" should be a positive number`,
            });
          }
        }

        // Killsame: validate amount is a positive integer
        if (obj.type === "killsame" && obj.amount) {
          const amt = parseInt(obj.amount, 10);
          if (isNaN(amt) || amt <= 0) {
            warnings.push({
              level: "warning",
              missionIndex: mi,
              missionId: mission.id,
              message: `Objective #${oi}${variantLabel}: amount "${obj.amount}" should be a positive integer`,
            });
          }
        }

        // Level objective: validate name is a number
        if (obj.type === "lvl" && obj.name) {
          if (isNaN(Number(obj.name)) || Number(obj.name) <= 0) {
            warnings.push({
              level: "warning",
              missionIndex: mi,
              missionId: mission.id,
              message: `Objective #${oi}${variantLabel}: level target "${obj.name}" should be a positive number`,
            });
          }
        }

        // Item objective: validate name contains a colon (mod:item format)
        if (obj.type === "item" && obj.name && !obj.name.includes(":")) {
          warnings.push({
            level: "warning",
            missionIndex: mi,
            missionId: mission.id,
            message: `Objective #${oi}${variantLabel}: item name "${obj.name}" should be in mod:item format`,
          });
        }
      }

      // Validate rewards
      for (let ri = 0; ri < rewards.length; ri++) {
        const reward = parseReward(rewards[ri]);

        // Next mission ID reference check
        if (reward.nextMissionId !== 0 && !missionIdSet.has(reward.nextMissionId)) {
          warnings.push({
            level: "error",
            missionIndex: mi,
            missionId: mission.id,
            message: `Reward #${ri + 1}${variantLabel}: next mission ID ${reward.nextMissionId} does not exist in this bundle`,
          });
        }

        // Self-referencing reward
        if (reward.nextMissionId === mission.id) {
          warnings.push({
            level: "warning",
            missionIndex: mi,
            missionId: mission.id,
            message: `Reward #${ri + 1}${variantLabel}: next mission ID points to itself`,
          });
        }

        // Validate reward components
        for (let ci = 0; ci < reward.components.length; ci++) {
          const comp = reward.components[ci];

          // TP value should be a number
          if (comp.type === "tp") {
            if (!comp.value || isNaN(Number(comp.value))) {
              warnings.push({
                level: "warning",
                missionIndex: mi,
                missionId: mission.id,
                message: `Reward #${ri + 1}${variantLabel}: TP component value "${comp.value}" should be a number`,
              });
            }
          }

          // Alignment value should be a signed number or 0
          if (comp.type === "align") {
            const val = comp.value?.replace(/^[+-]/, "");
            if (!val || isNaN(Number(val))) {
              warnings.push({
                level: "warning",
                missionIndex: mi,
                missionId: mission.id,
                message: `Reward #${ri + 1}${variantLabel}: alignment value "${comp.value}" should be a signed number`,
              });
            }
          }

          // Item value should not be empty
          if (comp.type === "item" && !comp.value?.trim()) {
            warnings.push({
              level: "warning",
              missionIndex: mi,
              missionId: mission.id,
              message: `Reward #${ri + 1}${variantLabel}: item component has no item specified`,
            });
          }

          // Command value should not be empty
          if (comp.type === "com" && !comp.value?.trim()) {
            warnings.push({
              level: "warning",
              missionIndex: mi,
              missionId: mission.id,
              message: `Reward #${ri + 1}${variantLabel}: command component is empty`,
            });
          }
        }
      }
    }
  }

  // Orphaned missions (not reachable from any other mission, except the first)
  if (bundle.missions.length > 1) {
    const referencedIds = new Set<number>();
    for (const m of bundle.missions) {
      for (const variantRewards of m.rewards ?? []) {
        if (!Array.isArray(variantRewards)) continue;
        for (const raw of variantRewards) {
          const reward = parseReward(raw);
          if (reward.nextMissionId !== 0) {
            referencedIds.add(reward.nextMissionId);
          }
        }
      }
    }
    for (let mi = 1; mi < bundle.missions.length; mi++) {
      const m = bundle.missions[mi];
      if (!referencedIds.has(m.id)) {
        warnings.push({
          level: "warning",
          missionIndex: mi,
          missionId: m.id,
          message: `Orphaned mission: no other mission links to this one`,
        });
      }
    }
  }

  return warnings;
}
