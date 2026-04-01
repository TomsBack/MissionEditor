import type { RewardChoice, RewardComponent, RewardType, TpMode } from "../types/mission";

/** Parse a single reward component string like "tp!fix!150" or "item!mod:name,5". */
function parseComponent(raw: string): RewardComponent {
  if (raw === "nothing" || !raw) {
    return { type: "nothing", value: "" };
  }

  const parts = raw.split("!");
  const type = parts[0] as RewardType;

  if (type === "tp" && parts.length >= 3) {
    return { type: "tp", tpMode: parts[1] as TpMode, value: parts[2] };
  }
  if (type === "align" && parts.length >= 2) {
    return { type: "align", value: parts[1] };
  }
  if (type === "item" && parts.length >= 2) {
    return { type: "item", value: parts[1] };
  }
  if (type === "com" && parts.length >= 2) {
    return { type: "com", value: parts.slice(1).join("!") };
  }

  return { type: "nothing", value: raw };
}

/** Serialize a single reward component back to string format. */
function serializeComponent(comp: RewardComponent): string {
  switch (comp.type) {
    case "nothing":
      return "nothing";
    case "tp":
      return `tp!${comp.tpMode || "fix"}!${comp.value}`;
    case "align":
      return `align!${comp.value}`;
    case "item":
      return `item!${comp.value}`;
    case "com":
      return `com!${comp.value}`;
    default:
      return "nothing";
  }
}

/**
 * Parse a raw reward string like "tp!fix!150||align!+10;buttonName;2".
 * Format: "component1||component2||...;buttonName;nextMissionId"
 */
export function parseReward(raw: string): RewardChoice {
  const mainParts = raw.split(";");
  const componentStr = mainParts[0] || "";
  const buttonName = mainParts[1] || "";
  const nextMissionId = parseInt(mainParts[2] || "0", 10);

  const components = componentStr
    .split("||")
    .filter(Boolean)
    .map(parseComponent);

  if (components.length === 0) {
    components.push({ type: "nothing", value: "" });
  }

  return { components, buttonName, nextMissionId };
}

/** Serialize a RewardChoice back to the raw string format. */
export function serializeReward(reward: RewardChoice): string {
  const componentStr = reward.components.map(serializeComponent).join("||");
  return `${componentStr};${reward.buttonName};${reward.nextMissionId}`;
}

/** Human-friendly labels for reward types. */
export const REWARD_TYPE_LABELS: Record<RewardType, string> = {
  nothing: "Nothing",
  tp: "Training Points",
  item: "Item",
  align: "Alignment",
  com: "Command",
};

/** Human-friendly labels for TP modes. */
export const TP_MODE_LABELS: Record<TpMode, string> = {
  fix: "Fixed Amount",
  lvl: "Level Multiplier",
  align: "Alignment-based",
  lvlalign: "Level x Alignment",
};
