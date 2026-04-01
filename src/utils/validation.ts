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
  const warnings: ValidationWarning[] = [];
  const allIds = new Set<number>();
  const missionIds = bundle.missions.map((m) => m.id);

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

    // Per-variant validation
    for (let pi = 0; pi < mission.props.length; pi++) {
      const objectives = mission.objectives[pi] ?? [];
      const rewards = mission.rewards[pi] ?? [];
      const variantLabel = mission.props.length > 1 ? ` (variant "${mission.props[pi]}")` : "";

      // Validate objectives
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
      }

      // Validate reward references
      for (let ri = 0; ri < rewards.length; ri++) {
        const reward = parseReward(rewards[ri]);
        if (reward.nextMissionId !== 0 && !missionIds.includes(reward.nextMissionId)) {
          warnings.push({
            level: "error",
            missionIndex: mi,
            missionId: mission.id,
            message: `Reward choice #${ri + 1}${variantLabel}: next mission ID ${reward.nextMissionId} does not exist in this bundle`,
          });
        }
      }

      // Missing title
      if (!mission.title[pi]) {
        warnings.push({
          level: "warning",
          missionIndex: mi,
          missionId: mission.id,
          message: `Missing title${variantLabel}`,
        });
      }
    }
  }

  return warnings;
}
