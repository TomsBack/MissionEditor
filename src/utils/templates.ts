import type { Mission } from "../types/mission";

export interface MissionTemplate {
  name: string;
  description: string;
  create: (id: number) => Mission;
}

function baseMission(id: number, title: string): Mission {
  return {
    id,
    translated: false,
    props: ["default"],
    align: ["neutral"],
    title: [title],
    subtitle: [""],
    description: [""],
    objectives: [[]],
    rewards: [[]],
  };
}

export const MISSION_TEMPLATES: MissionTemplate[] = [
  {
    name: "Empty",
    description: "Blank mission with just a start button",
    create: (id) => ({
      ...baseMission(id, "New Mission"),
      objectives: [["start"]],
      rewards: [["nothing;;0"]],
    }),
  },
  {
    name: "Kill Boss",
    description: "Kill a single entity with TP reward and 3 alignment choices",
    create: (id) => ({
      ...baseMission(id, "Defeat the Enemy"),
      objectives: [["start", "kill;N;H100;A50;S;D;Pspwn"]],
      rewards: [[
        `tp!fix!150||align!+10;Protect;${id + 1}`,
        `tp!fix!150||align!0;Myself;${id + 1}`,
        `tp!fix!150||align!-10;Evil;${id + 1}`,
      ]],
    }),
  },
  {
    name: "Kill Multiple",
    description: "Kill X of the same entity type",
    create: (id) => ({
      ...baseMission(id, "Eliminate Enemies"),
      objectives: [["start", "killsame;N;M5;H50;A25"]],
      rewards: [[
        `tp!fix!100||align!+10;Protect;${id + 1}`,
        `tp!fix!100||align!0;Myself;${id + 1}`,
        `tp!fix!100||align!-10;Evil;${id + 1}`,
      ]],
    }),
  },
  {
    name: "Transition",
    description: "Click Next with no reward (story progression)",
    create: (id) => ({
      ...baseMission(id, "Continue..."),
      objectives: [["next"]],
      rewards: [[`nothing;;${id + 1}`]],
    }),
  },
  {
    name: "Talk to NPC",
    description: "Talk to a specific NPC entity",
    create: (id) => ({
      ...baseMission(id, "Speak to the Master"),
      objectives: [["start", "talk;N;G;B"]],
      rewards: [[`nothing;;${id + 1}`]],
    }),
  },
  {
    name: "Go to Biome",
    description: "Travel to a specific biome",
    create: (id) => ({
      ...baseMission(id, "Travel to the Location"),
      objectives: [["start", "biome;NPlains"]],
      rewards: [[
        `tp!fix!50||align!+10;Protect;${id + 1}`,
        `tp!fix!50||align!0;Myself;${id + 1}`,
        `tp!fix!50||align!-10;Evil;${id + 1}`,
      ]],
    }),
  },
  {
    name: "Go to Dimension",
    description: "Travel to a specific dimension",
    create: (id) => ({
      ...baseMission(id, "Enter the New World"),
      objectives: [["start", "dim;NNether"]],
      rewards: [[
        `tp!fix!100||align!+10;Protect;${id + 1}`,
        `tp!fix!100||align!0;Myself;${id + 1}`,
        `tp!fix!100||align!-10;Evil;${id + 1}`,
      ]],
    }),
  },
  {
    name: "Gather Items",
    description: "Collect a specific item from inventory",
    create: (id) => ({
      ...baseMission(id, "Gather Resources"),
      objectives: [["start", "item;Nminecraft:diamond;M5"]],
      rewards: [[`tp!fix!100;;${id + 1}`]],
    }),
  },
  {
    name: "Reach Level",
    description: "Reach a minimum player level",
    create: (id) => ({
      ...baseMission(id, "Train to Level Up"),
      objectives: [["start", "lvl;M10"]],
      rewards: [[`tp!fix!200;;${id + 1}`]],
    }),
  },
  {
    name: "Saga Kill (biome + kill)",
    description: "Go to biome, then kill an entity with dimension check",
    create: (id) => ({
      ...baseMission(id, "Saga Battle"),
      objectives: [["start", "biome2;NPlains", "dim2;NOverworld", "kill;N;H100;A50;S;D;Pspwn"]],
      rewards: [[
        `tp!lvlalign!10.0||align!+10;Protect;${id + 1}`,
        `tp!lvlalign!10.0||align!0;Myself;${id + 1}`,
        `tp!lvlalign!10.0||align!-10;Evil;${id + 1}`,
      ]],
    }),
  },
];

/** Reward preset: 3-alignment TP reward with customizable amount and next ID. */
export function threeAlignmentTpReward(amount: string, nextId: number, mode: "fix" | "lvl" | "lvlalign" = "fix"): string[] {
  return [
    `tp!${mode}!${amount}||align!+10;jinryuujrmcore.missionSys.Protect;${nextId}`,
    `tp!${mode}!${amount}||align!0;jinryuujrmcore.missionSys.Myself;${nextId}`,
    `tp!${mode}!${amount}||align!-10;jinryuujrmcore.missionSys.Evil;${nextId}`,
  ];
}

/** Reward preset: 3-alignment TP + item reward. */
export function threeAlignmentItemReward(item: string, count: number, tpAmount: string, nextId: number): string[] {
  return [
    `item!${item},${count}||tp!fix!${tpAmount}||align!+10;jinryuujrmcore.missionSys.Protect;${nextId}`,
    `item!${item},${count}||tp!fix!${tpAmount}||align!0;jinryuujrmcore.missionSys.Myself;${nextId}`,
    `item!${item},${count}||tp!fix!${tpAmount}||align!-10;jinryuujrmcore.missionSys.Evil;${nextId}`,
  ];
}

/** Reward preset: simple transition to next mission. */
export function nothingReward(nextId: number): string[] {
  return [`nothing;;${nextId}`];
}

/**
 * Objective preset templates. Each yields a single raw objective string that
 * the editor appends to the current variant's objective list. They mirror the
 * defaults in MISSION_TEMPLATES but are scoped to one objective at a time, so
 * authors can build up a mission step-by-step.
 */
export interface ObjectivePreset {
  /** i18n key for the user-facing name. */
  nameKey: string;
  /** i18n key for the description shown beneath the name. */
  descKey: string;
  /** The raw objective string this preset emits. */
  raw: string;
}

export const OBJECTIVE_PRESETS: ObjectivePreset[] = [
  { nameKey: "objPreset.kill", descKey: "objPreset.killDesc", raw: "kill;N;H100;A50;Pspwn" },
  { nameKey: "objPreset.killsame", descKey: "objPreset.killsameDesc", raw: "killsame;N;M5;H50;A25" },
  { nameKey: "objPreset.talk", descKey: "objPreset.talkDesc", raw: "talk;N;G;B" },
  { nameKey: "objPreset.item", descKey: "objPreset.itemDesc", raw: "item;Nminecraft:diamond;M5" },
  { nameKey: "objPreset.biome", descKey: "objPreset.biomeDesc", raw: "biome;NPlains" },
  { nameKey: "objPreset.biome2", descKey: "objPreset.biome2Desc", raw: "biome2;NPlains" },
  { nameKey: "objPreset.dim", descKey: "objPreset.dimDesc", raw: "dim;NNether" },
  { nameKey: "objPreset.lvl", descKey: "objPreset.lvlDesc", raw: "lvl;M10" },
  { nameKey: "objPreset.state", descKey: "objPreset.stateDesc", raw: "state;N" },
];
