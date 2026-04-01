// #region Objective Types

export const OBJECTIVE_TYPES = [
  "kill",
  "killsame",
  "biome",
  "biome2",
  "dim",
  "dim2",
  "item",
  "talk",
  "state",
  "lvl",
  "next",
  "start",
  "skip",
  "restart",
] as const;

export type ObjectiveType = (typeof OBJECTIVE_TYPES)[number];

/** Button-only types that have no condition fields. */
export const BUTTON_TYPES: ObjectiveType[] = ["next", "start", "skip", "restart"];

/** Types that represent the first element in the objectives list (action button). */
export const ACTION_TYPES: ObjectiveType[] = ["next", "start", "skip", "restart"];

/**
 * Parsed representation of an objective definition string.
 * Raw format: "type;Nname;Hhealth;Aattack;Mamount;Sspawn_msg;Ddeath_msg;Pprotect;Ttransformations;Ospawn_sound;Udeath_sound;Gdialog;Bbutton"
 */
export interface Objective {
  type: ObjectiveType;
  name: string;
  health: string;
  attack: string;
  amount: string;
  spawnMessage: string;
  deathMessage: string;
  protect: string;
  transformations: string;
  spawnSound: string;
  deathSound: string;
  dialog: string;
  button: string;
}

// #endregion

// #region Reward Types

export const REWARD_TYPES = ["nothing", "tp", "item", "align", "com"] as const;
export type RewardType = (typeof REWARD_TYPES)[number];

export const TP_MODES = ["fix", "lvl", "align", "lvlalign"] as const;
export type TpMode = (typeof TP_MODES)[number];

/**
 * A single reward component (one part between || separators).
 * Examples: "tp!fix!150", "item!mod:name,5", "align!+10", "com!command"
 */
export interface RewardComponent {
  type: RewardType;
  /** For tp: the mode (fix/lvl/align/lvlalign) */
  tpMode?: TpMode;
  /** For tp: the amount/multiplier. For align: the modifier (+10, -10, 0). For item: "mod:name::meta,count". For com: the command string. */
  value: string;
}

/**
 * A single reward choice (one option the player can pick).
 * Raw format: "component1||component2||...;buttonName;nextMissionId"
 */
export interface RewardChoice {
  components: RewardComponent[];
  buttonName: string;
  nextMissionId: number;
}

// #endregion

// #region Mission & Bundle

/**
 * A single mission within a bundle.
 * Matches the Gson-serialized JRMCoreMsn class.
 */
export interface Mission {
  id: number;
  translated: boolean;
  props: string[];
  align: string[];
  title: string[];
  subtitle: string[];
  description: string[];
  /** Raw objective strings per property variant. objectives[propIndex][objectiveIndex] */
  objectives: string[][];
  /** Raw reward strings per property variant. rewards[propIndex][rewardIndex] */
  rewards: string[][];
}

/** Bundle settings. Matches JRMCoreMsnBundle.Stngs. */
export interface BundleSettings {
  repeat: string;
  unlock: string;
  vars: string;
}

/** A mission bundle. Matches the Gson-serialized JRMCoreMsnBundle class. */
export interface MissionBundle {
  name: string;
  desc: string;
  authors: string;
  version: string;
  mods: string;
  missions: Mission[];
  settings: BundleSettings;
}

// #endregion

// #region Editor State

/** Which bundle + mission is currently selected in the editor. */
export interface EditorSelection {
  bundleIndex: number;
  missionIndex: number;
  /** Which property variant is being edited (index into props array). */
  propIndex: number;
}

// #endregion
