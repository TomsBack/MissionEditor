import type { Objective, ObjectiveType } from "../types/mission";

const KEY_MAP: Record<string, keyof Objective> = {
  N: "name",
  H: "health",
  A: "attack",
  M: "amount",
  S: "spawnMessage",
  D: "deathMessage",
  P: "protect",
  T: "transformations",
  O: "spawnSound",
  U: "deathSound",
  G: "dialog",
  B: "button",
};

const REVERSE_KEY_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(KEY_MAP).map(([k, v]) => [v, k])
);

/** Parse a raw objective string like "kill;Nentity;H100;A50" into a structured Objective. */
export function parseObjective(raw: string): Objective {
  const parts = raw.split(";");
  const obj: Objective = {
    type: (parts[0] || "next") as ObjectiveType,
    name: "",
    health: "",
    attack: "",
    amount: "",
    spawnMessage: "",
    deathMessage: "",
    protect: "",
    transformations: "",
    spawnSound: "",
    deathSound: "",
    dialog: "",
    button: "",
  };

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    if (part.length < 1) continue;
    const key = part[0].toUpperCase();
    const field = KEY_MAP[key];
    if (field && field !== "type") {
      (obj as unknown as Record<string, string>)[field] = part.substring(1);
    }
  }

  return obj;
}

/** Serialize an Objective back into the raw string format. */
export function serializeObjective(obj: Objective): string {
  // Button-only types have no fields
  if (["next", "start", "skip", "restart"].includes(obj.type)) {
    return obj.type;
  }

  let result = obj.type;
  for (const [field, key] of Object.entries(REVERSE_KEY_MAP)) {
    const value = (obj as unknown as Record<string, string>)[field];
    if (value) {
      result += `;${key}${value}`;
    }
  }
  return result;
}

/** Fields relevant per objective type. */
export const FIELDS_BY_TYPE: Record<ObjectiveType, (keyof Objective)[]> = {
  kill: ["name", "health", "attack", "spawnMessage", "deathMessage", "protect", "transformations", "spawnSound", "deathSound"],
  killsame: ["name", "amount", "health", "attack", "protect", "transformations"],
  biome: ["name"],
  biome2: ["name"],
  dim: ["name"],
  dim2: ["name"],
  item: ["name", "amount"],
  talk: ["name", "dialog", "button"],
  state: ["name"],
  lvl: ["name"],
  next: [],
  start: [],
  skip: [],
  restart: [],
};

/** Human-friendly labels for objective fields. */
export const FIELD_LABELS: Record<keyof Objective, string> = {
  type: "Type",
  name: "Name / Target",
  health: "Health",
  attack: "Attack",
  amount: "Amount",
  spawnMessage: "Spawn Message",
  deathMessage: "Death Message",
  protect: "Protect Mode",
  transformations: "Transformations",
  spawnSound: "Spawn Sound",
  deathSound: "Death Sound",
  dialog: "Dialog Text",
  button: "Button Text",
};

/** Human-friendly labels for objective types. */
export const TYPE_LABELS: Record<ObjectiveType, string> = {
  kill: "Kill Entity",
  killsame: "Kill Multiple",
  biome: "Go to Biome",
  biome2: "Be in Biome",
  dim: "Go to Dimension",
  dim2: "Be in Dimension",
  item: "Gather Item",
  talk: "Talk to NPC",
  state: "Transformation State",
  lvl: "Reach Level",
  next: "Click Next",
  start: "Click Start",
  skip: "Click Skip",
  restart: "Click Restart",
};
