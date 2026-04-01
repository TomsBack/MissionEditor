const fs = require('fs');
const path = require('path');

const base = path.join('C:', 'Java', 'MinecraftMods', 'DragonBlockCRevisited',
  'src', 'main', 'resources', 'assets');

const files = [
  path.join(base, 'jinryuudragonbc', 'lang', 'en_US.lang'),
  path.join(base, 'jinryuumodscore', 'lang', 'en_US.lang'),
  path.join(base, 'jinryuunarutoc', 'lang', 'en_US.lang'),
];

// Prefixes to include in the translation map
const PREFIXES = [
  'dbc.saga',          // DBC saga titles, descriptions, dialogue
  'nc.saga',           // Naruto saga titles, descriptions, dialogue
  'jinryuujrmcore.mission', // Mission system UI strings
  'jinryuujrmcore.reward',  // Reward UI strings
  'entity.',           // Entity display names
  'item.',             // Item display names
];

const map = {};
for (const f of files) {
  const lines = fs.readFileSync(f, 'utf-8').split(/\r?\n/);
  for (const line of lines) {
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    const val = line.slice(eq + 1);
    if (PREFIXES.some((p) => key.startsWith(p))) {
      map[key] = val;
    }
  }
}

console.log(`${Object.keys(map).length} translation keys extracted`);

let ts = '/** Auto-generated from en_US.lang files. Run "node gen-translations.cjs" to regenerate. */\n';
ts += 'const TRANSLATIONS: Record<string, string> = {\n';
for (const [k, v] of Object.entries(map)) {
  ts += `  ${JSON.stringify(k)}: ${JSON.stringify(v)},\n`;
}
ts += '};\n\n';
ts += '/** Look up a translation key. Returns undefined if not found. */\n';
ts += 'export function translate(key: string): string | undefined {\n';
ts += '  return TRANSLATIONS[key];\n';
ts += '}\n\n';
ts += '/** Check if a translation key exists. */\n';
ts += 'export function hasTranslation(key: string): boolean {\n';
ts += '  return key in TRANSLATIONS;\n';
ts += '}\n\n';
ts += '/** Get the display name for an entity ID like "jinryuudragonblockc.Vegeta". */\n';
ts += 'export function entityDisplayName(entityId: string): string | undefined {\n';
ts += '  return TRANSLATIONS[`entity.${entityId}.name`];\n';
ts += '}\n\n';
ts += '/** Get all keys that start with a given prefix. */\n';
ts += 'export function keysWithPrefix(prefix: string): string[] {\n';
ts += '  return Object.keys(TRANSLATIONS).filter((k) => k.startsWith(prefix));\n';
ts += '}\n';

fs.writeFileSync(path.join(__dirname, 'src', 'utils', 'translations.ts'), ts);
console.log('Written to src/utils/translations.ts');
