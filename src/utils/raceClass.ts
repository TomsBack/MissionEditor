// Race / class / clan IDs used by the mod's variant matcher.
// Source: JinRyuu.JRMCore.JRMCoreHRaces.Races and JRMCoreH.ClassesDBC / Classes / Clans.
// JRMCoreMsn.getProp() compares props[i] case-insensitively against these names; an
// unrecognized value silently falls back to variant 0, so the editor surfaces them
// as autocomplete suggestions.

export const DBC_RACES = [
  "Human",
  "Saiyan",
  "Half-Saiyan",
  "Namekian",
  "Arcosian",
  "Majin",
];

export const DBC_CLASSES = [
  "MartialArtist",
  "Spiritualist",
  "Warrior",
];

export const NC_CLASSES = ["Survival"];
export const NC_CLANS = ["Clanless", "Hyuuga", "Uchiha"];

/** Suggested values for the Mission `Property` field (race or class names). */
export const PROPERTY_SUGGESTIONS = [
  "default",
  ...DBC_RACES,
  ...DBC_CLASSES,
  ...NC_CLASSES,
  ...NC_CLANS,
];
