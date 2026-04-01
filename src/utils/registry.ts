/** Known entity and item IDs from Dragon Block C, Naruto C, and vanilla Minecraft. */

export const DBC_ENTITIES = [
  "jinryuudragonblockc.CellJr",
  "jinryuudragonblockc.Frieza",
  "jinryuudragonblockc.FriezaSoldier",
  "jinryuudragonblockc.Ginyu",
  "jinryuudragonblockc.Guldo",
  "jinryuudragonblockc.Jeice",
  "jinryuudragonblockc.Burter",
  "jinryuudragonblockc.Recoome",
  "jinryuudragonblockc.Nappa",
  "jinryuudragonblockc.Raditz",
  "jinryuudragonblockc.Saibaman",
  "jinryuudragonblockc.Vegeta",
  "jinryuudragonblockc.Goku",
  "jinryuudragonblockc.Gohan",
  "jinryuudragonblockc.Piccolo",
  "jinryuudragonblockc.Krillin",
  "jinryuudragonblockc.Tien",
  "jinryuudragonblockc.Yamcha",
  "jinryuudragonblockc.Chiaotzu",
  "jinryuudragonblockc.Android16",
  "jinryuudragonblockc.Android17",
  "jinryuudragonblockc.Android18",
  "jinryuudragonblockc.Android19",
  "jinryuudragonblockc.Android20",
  "jinryuudragonblockc.Cell",
  "jinryuudragonblockc.Buu",
  "jinryuudragonblockc.Dabura",
  "jinryuudragonblockc.Babidi",
  "jinryuudragonblockc.Broly",
  "jinryuudragonblockc.Bardock",
  "jinryuudragonblockc.KingCold",
  "jinryuudragonblockc.Cooler",
  "jinryuudragonblockc.Zarbon",
  "jinryuudragonblockc.Dodoria",
  "jinryuudragonblockc.Appule",
  "jinryuudragonblockc.Cui",
  "jinryuudragonblockc.Turles",
  "jinryuudragonblockc.Slug",
  "jinryuudragonblockc.Bojack",
  "jinryuudragonblockc.Beerus",
  "jinryuudragonblockc.Whis",
  "jinryuudragonblockc.GoldenFrieza",
  "jinryuudragonblockc.Hit",
  "jinryuudragonblockc.Jiren",
  "jinryuudragonblockc.Zamasu",
  "jinryuudragonblockc.GokuBlack",
  "jinryuudragonblockc.Toppo",
  "jinryuudragonblockc.Kefla",
  "jinryuudragonblockc.NPC",
  "jinryuudragonblockc.Dinosaur",
  "jinryuudragonblockc.MrSatan",
  "jinryuudragonblockc.Videl",
  "jinryuudragonblockc.GreatSaiyaman",
  "jinryuudragonblockc.Supreme",
];

export const NC_ENTITIES = [
  "jinryuunarutoc.EntityNCEvil",
  "jinryuunarutoc.EntityNCEvilAkatsuki",
  "jinryuunarutoc.EntityNCEvilOrochimaru",
  "jinryuunarutoc.EntityNCEvilKabuto",
  "jinryuunarutoc.EntityNCEvilGaara",
  "jinryuunarutoc.EntityNCEvilAnbu",
  "jinryuunarutoc.EntityNCEvilZabuza",
  "jinryuunarutoc.EntityNCEvilHaku",
  "jinryuunarutoc.EntityNCFriend",
  "jinryuunarutoc.EntityNCNPC",
];

export const DBC_ITEMS = [
  "jinryuudragonblockc:capsule",
  "jinryuudragonblockc:senzu_bean",
  "jinryuudragonblockc:dragon_ball",
  "jinryuudragonblockc:scouter",
  "jinryuudragonblockc:gi",
  "jinryuudragonblockc:weighted_armor",
  "jinryuudragonblockc:z_sword",
  "jinryuudragonblockc:potara",
  "jinryuudragonblockc:katchin",
  "jinryuudragonblockc:spaceship",
  "jinryuudragonblockc:time_machine",
];

export const NC_ITEMS = [
  "jinryuunarutoc:ramen",
  "jinryuunarutoc:kunai",
  "jinryuunarutoc:shuriken",
  "jinryuunarutoc:headband",
];

export const MC_ITEMS = [
  "minecraft:diamond",
  "minecraft:iron_ingot",
  "minecraft:gold_ingot",
  "minecraft:emerald",
  "minecraft:ender_pearl",
  "minecraft:blaze_rod",
  "minecraft:ghast_tear",
  "minecraft:nether_star",
  "minecraft:apple",
  "minecraft:golden_apple",
  "minecraft:bread",
  "minecraft:cooked_beef",
];

export const ALL_ENTITIES = [...DBC_ENTITIES, ...NC_ENTITIES];
export const ALL_ITEMS = [...DBC_ITEMS, ...NC_ITEMS, ...MC_ITEMS];

/** Filter a registry list by search text. */
export function filterRegistry(list: string[], query: string, limit = 10): string[] {
  if (!query) return [];
  const lower = query.toLowerCase();
  return list
    .filter((id) => id.toLowerCase().includes(lower))
    .slice(0, limit);
}
