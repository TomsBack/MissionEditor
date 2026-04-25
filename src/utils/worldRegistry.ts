// Vanilla Minecraft 1.7.10 world data used by the mission system's dim/biome
// objectives. The mod matches case-insensitively against WorldProvider.
// getDimensionName for dim/dim2 (also accepts numeric IDs) and against
// BiomeGenBase.biomeName for biome/biome2.

/** Dimension display names; numeric IDs (0, -1, 1) are also accepted by the mod. */
export const MC_DIMENSIONS = [
  "Overworld",
  "Nether",
  "The End",
];

/** Biome display names from net.minecraft.world.biome.BiomeGenBase. */
export const MC_BIOMES = [
  "Ocean",
  "Plains",
  "Desert",
  "Extreme Hills",
  "Forest",
  "Taiga",
  "Swampland",
  "River",
  "Hell",
  "Sky",
  "Frozen Ocean",
  "Frozen River",
  "Ice Plains",
  "Ice Mountains",
  "MushroomIsland",
  "MushroomIslandShore",
  "Beach",
  "DesertHills",
  "ForestHills",
  "TaigaHills",
  "Extreme Hills Edge",
  "Jungle",
  "JungleHills",
  "JungleEdge",
  "Deep Ocean",
  "Stone Beach",
  "Cold Beach",
  "Birch Forest",
  "Birch Forest Hills",
  "Roofed Forest",
  "Cold Taiga",
  "Cold Taiga Hills",
  "Mega Taiga",
  "Mega Taiga Hills",
  "Extreme Hills+",
  "Savanna",
  "Savanna Plateau",
  "Mesa",
  "Mesa Plateau F",
  "Mesa Plateau",
];
