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

/**
 * Special, non-race/class prop value: setting `props[0]` to "randrew" makes
 * the mod pick a random reward choice on completion regardless of which
 * button the player clicked. See JRMCorePacHanSMission.java line 287.
 */
export const RANDREW_FLAG = "randrew";

/** Suggested values for the Mission `Property` field. */
export const PROPERTY_SUGGESTIONS = [
  "default",
  ...DBC_RACES,
  ...DBC_CLASSES,
  ...NC_CLASSES,
  ...NC_CLANS,
  RANDREW_FLAG,
];
