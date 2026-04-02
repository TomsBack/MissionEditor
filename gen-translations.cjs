const fs = require('fs');
const path = require('path');

const base = path.join('C:', 'Java', 'MinecraftMods', 'DragonBlockCRevisited',
  'src', 'main', 'resources', 'assets');

const mcJar = path.join('C:', 'Users', 'Tom', '.gradle', 'caches', 'minecraft',
  'net', 'minecraft', 'minecraft', '1.7.10', 'minecraft-1.7.10.jar');

// Mod asset directories and their mod IDs
const MOD_DIRS = [
  { dir: 'jinryuudragonbc', modId: 'jinryuudragonblockc' },
  { dir: 'jinryuumodscore', modId: 'jinryuumodscore' },
  { dir: 'jinryuunarutoc', modId: 'jinryuunarutoc' },
];

// Prefixes to include in the translation map
const PREFIXES = [
  'dbc.saga',
  'nc.saga',
  'jinryuujrmcore.',
  'entity.',
  'item.',
  'tile.',
];

// Language display names
const LANG_NAMES = {
  en_US: 'English',
  es_ES: 'Español',
  fr_FR: 'Français',
  de_DE: 'Deutsch',
  pt_PT: 'Português',
  zh_CN: '中文(简体)',
  hu_HU: 'Magyar',
  pl_PL: 'Polski',
  ar_SA: 'العربية',
  el_GR: 'Ελληνικά',
  he_IL: 'עברית',
};

// #region Discover available languages

const langFilesPerLang = {}; // langCode -> [filePath, ...]

for (const { dir } of MOD_DIRS) {
  const langDir = path.join(base, dir, 'lang');
  if (!fs.existsSync(langDir)) continue;
  for (const file of fs.readdirSync(langDir)) {
    if (!file.endsWith('.lang')) continue;
    const langCode = file.replace('.lang', '');
    if (!langFilesPerLang[langCode]) langFilesPerLang[langCode] = [];
    langFilesPerLang[langCode].push(path.join(langDir, file));
  }
}

// Extract vanilla MC lang file from jar
const mcLangDir = path.join(__dirname, '.mc-lang-cache');
const mcLangFile = path.join(mcLangDir, 'en_US.lang');
if (!fs.existsSync(mcLangFile)) {
  fs.mkdirSync(mcLangDir, { recursive: true });
  const { execSync } = require('child_process');
  execSync(`jar xf "${mcJar}" assets/minecraft/lang/en_US.lang`, { cwd: mcLangDir });
  const extracted = path.join(mcLangDir, 'assets', 'minecraft', 'lang', 'en_US.lang');
  fs.renameSync(extracted, mcLangFile);
  // Clean up nested dirs
  fs.rmSync(path.join(mcLangDir, 'assets'), { recursive: true, force: true });
}

// Add MC lang to en_US
if (!langFilesPerLang['en_US']) langFilesPerLang['en_US'] = [];
langFilesPerLang['en_US'].push(mcLangFile);

// #endregion

// #region Parse lang files

function parseLangFiles(files, prefixes) {
  const map = {};
  for (const f of files) {
    if (!fs.existsSync(f)) continue;
    const lines = fs.readFileSync(f, 'utf-8').split(/\r?\n/);
    for (const line of lines) {
      const eq = line.indexOf('=');
      if (eq === -1) continue;
      const key = line.slice(0, eq).trim();
      const val = line.slice(eq + 1);
      if (prefixes.some((p) => key.startsWith(p))) {
        map[key] = val;
      }
    }
  }
  return map;
}

// Also parse all keys (not just prefixed) for item collection
function parseAllKeys(files) {
  const map = {};
  for (const f of files) {
    if (!fs.existsSync(f)) continue;
    const lines = fs.readFileSync(f, 'utf-8').split(/\r?\n/);
    for (const line of lines) {
      const eq = line.indexOf('=');
      if (eq === -1) continue;
      const key = line.slice(0, eq).trim();
      const val = line.slice(eq + 1);
      map[key] = val;
    }
  }
  return map;
}

// #endregion

// #region Generate per-language JSON files in public/lang/

const outDir = path.join(__dirname, 'public', 'lang');
fs.mkdirSync(outDir, { recursive: true });

const availableLangs = {};

for (const [langCode, files] of Object.entries(langFilesPerLang)) {
  const map = parseLangFiles(files, PREFIXES);
  const keyCount = Object.keys(map).length;
  if (keyCount === 0) continue;

  fs.writeFileSync(path.join(outDir, `${langCode}.json`), JSON.stringify(map));
  availableLangs[langCode] = LANG_NAMES[langCode] || langCode;
  console.log(`${langCode}: ${keyCount} keys`);
}

// #endregion

// #region Generate languages.ts (available languages list)

let langTs = '/** Auto-generated. Run "node gen-translations.cjs" to regenerate. */\n\n';
langTs += 'export const AVAILABLE_LANGUAGES: Record<string, string> = {\n';
for (const [code, name] of Object.entries(availableLangs).sort(([a], [b]) => a.localeCompare(b))) {
  langTs += `  ${JSON.stringify(code)}: ${JSON.stringify(name)},\n`;
}
langTs += '};\n\n';
langTs += 'export const DEFAULT_LANGUAGE = "en_US";\n';

fs.writeFileSync(path.join(__dirname, 'src', 'utils', 'languages.ts'), langTs);
console.log(`\nLanguages: ${Object.keys(availableLangs).join(', ')}`);

// #endregion

// #region Generate registry.ts (entity/item IDs from en_US)

// Collect entity/item data from en_US files (all keys, not just prefixed)
const enUsModFiles = MOD_DIRS.map(({ dir }) => path.join(base, dir, 'lang', 'en_US.lang'));
const allEnUsKeys = parseAllKeys([...enUsModFiles, mcLangFile]);

// Extract entity IDs
const dbcEntities = [];
const ncEntities = [];
const mcEntities = [];
for (const key of Object.keys(allEnUsKeys)) {
  const m = key.match(/^entity\.(.+)\.name$/);
  if (!m) continue;
  const entityId = m[1];
  if (entityId.startsWith('jinryuudragonblockc.') || entityId.startsWith('jinryuudragonbc.')) {
    dbcEntities.push(entityId);
  } else if (entityId.startsWith('jinryuunarutoc.')) {
    ncEntities.push(entityId);
  } else if (!entityId.startsWith('jinryuu')) {
    mcEntities.push(entityId);
  }
}

// Extract item IDs: "item.<name>.name" -> "modid:<name>" based on source file
const itemsByMod = { jinryuudragonblockc: [], jinryuumodscore: [], jinryuunarutoc: [], minecraft: [] };
for (const { dir, modId } of MOD_DIRS) {
  const f = path.join(base, dir, 'lang', 'en_US.lang');
  if (!fs.existsSync(f)) continue;
  const lines = fs.readFileSync(f, 'utf-8').split(/\r?\n/);
  for (const line of lines) {
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    const m = key.match(/^item\.(.+)\.name$/);
    if (m) itemsByMod[modId].push(`${modId}:${m[1]}`);
  }
}
// MC items
{
  const lines = fs.readFileSync(mcLangFile, 'utf-8').split(/\r?\n/);
  for (const line of lines) {
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    const m = key.match(/^item\.(.+)\.name$/);
    if (m) itemsByMod.minecraft.push(`minecraft:${m[1]}`);
  }
}

function formatArray(name, items) {
  let out = `export const ${name} = [\n`;
  for (const item of items) {
    out += `  ${JSON.stringify(item)},\n`;
  }
  out += '];\n';
  return out;
}

let reg = '/** Auto-generated from en_US.lang files. Run "node gen-translations.cjs" to regenerate. */\n\n';
reg += formatArray('DBC_ENTITIES', dbcEntities) + '\n';
reg += formatArray('NC_ENTITIES', ncEntities) + '\n';
reg += formatArray('MC_ENTITIES', mcEntities) + '\n';
reg += formatArray('DBC_ITEMS', [...itemsByMod.jinryuudragonblockc, ...itemsByMod.jinryuumodscore]) + '\n';
reg += formatArray('NC_ITEMS', itemsByMod.jinryuunarutoc) + '\n';
reg += formatArray('MC_ITEMS', itemsByMod.minecraft) + '\n';
reg += 'export const ALL_ENTITIES = [...DBC_ENTITIES, ...NC_ENTITIES, ...MC_ENTITIES];\n';
reg += 'export const ALL_ITEMS = [...DBC_ITEMS, ...NC_ITEMS, ...MC_ITEMS];\n';

fs.writeFileSync(path.join(__dirname, 'src', 'utils', 'registry.ts'), reg);

const totalEntities = dbcEntities.length + ncEntities.length + mcEntities.length;
const totalItems = Object.values(itemsByMod).reduce((s, a) => s + a.length, 0);
console.log(`\nRegistry: ${totalEntities} entities (${dbcEntities.length} DBC, ${ncEntities.length} NC, ${mcEntities.length} MC)`);
console.log(`Registry: ${totalItems} items (${itemsByMod.jinryuudragonblockc.length + itemsByMod.jinryuumodscore.length} DBC+JRMC, ${itemsByMod.jinryuunarutoc.length} NC, ${itemsByMod.minecraft.length} MC)`);

// #endregion
