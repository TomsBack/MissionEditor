import { open, save } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile, readDir } from "@tauri-apps/plugin-fs";
import type { MissionBundle } from "../types/mission";

const JSON_FILTER = { name: "JSON Files", extensions: ["json"] };
const RECENT_KEY = "mission-editor-recent-files";
const AUTOSAVE_KEY = "mission-editor-autosave";
const MAX_RECENT = 10;

// #region Validation

/** Validate that a parsed JSON object has the shape of a MissionBundle. Returns null if valid, or an error message. */
export function validateBundleStructure(data: unknown): string | null {
  if (data === null || typeof data !== "object" || Array.isArray(data)) {
    return "File is not a JSON object";
  }

  const obj = data as Record<string, unknown>;

  if (typeof obj.name !== "string") return "Missing or invalid \"name\" field (expected string)";
  if (typeof obj.version !== "string") return "Missing or invalid \"version\" field (expected string)";
  if (!Array.isArray(obj.missions)) return "Missing or invalid \"missions\" field (expected array)";

  if (obj.settings !== undefined && obj.settings !== null) {
    if (typeof obj.settings !== "object" || Array.isArray(obj.settings)) {
      return "Invalid \"settings\" field (expected object)";
    }
  }

  const missions = obj.missions as unknown[];
  for (let i = 0; i < missions.length; i++) {
    const label = `missions[${i}]`;
    const m = missions[i];
    if (m === null || typeof m !== "object" || Array.isArray(m)) {
      return `${label}: not an object`;
    }
    const mission = m as Record<string, unknown>;

    if (typeof mission.id !== "number") return `${label}: missing or invalid "id" (expected number)`;
    if (!Array.isArray(mission.props)) return `${label}: missing or invalid "props" (expected array)`;
    if (!Array.isArray(mission.objectives)) return `${label}: missing or invalid "objectives" (expected array)`;
    if (!Array.isArray(mission.rewards)) return `${label}: missing or invalid "rewards" (expected array)`;

    for (const arrayKey of ["title", "subtitle", "description", "align"] as const) {
      if (!Array.isArray(mission[arrayKey])) {
        return `${label}: missing or invalid "${arrayKey}" (expected array)`;
      }
    }
  }

  return null;
}

// #endregion

// #region File Operations

/** Parse and validate JSON content as a MissionBundle. Throws on invalid structure. */
function parseBundleJson(content: string, filePath: string): MissionBundle {
  let data: unknown;
  try {
    data = JSON.parse(content);
  } catch (e) {
    throw new Error(`Invalid JSON in ${filePath.split(/[/\\]/).pop()}: ${e instanceof Error ? e.message : e}`);
  }

  const error = validateBundleStructure(data);
  if (error) {
    throw new Error(`Invalid mission bundle (${filePath.split(/[/\\]/).pop()}): ${error}`);
  }

  return data as MissionBundle;
}

/** Open a file dialog and load a mission bundle from the selected JSON file. */
export async function openBundleFile(): Promise<{ bundle: MissionBundle; path: string } | null> {
  const path = await open({
    title: "Open Mission Bundle",
    filters: [JSON_FILTER],
    multiple: false,
    directory: false,
  });

  if (!path) return null;

  const content = await readTextFile(path);
  const bundle = parseBundleJson(content, path);
  addRecentFile(path);
  return { bundle, path };
}

/** Load a bundle from a known path (for recent files). */
export async function loadBundleFromPath(path: string): Promise<{ bundle: MissionBundle; path: string }> {
  const content = await readTextFile(path);
  const bundle = parseBundleJson(content, path);
  addRecentFile(path);
  return { bundle, path };
}

/** Save a mission bundle to the given file path (or prompt for a new path). */
export async function saveBundleFile(bundle: MissionBundle, currentPath?: string, indent = 2): Promise<string | null> {
  const path = currentPath ?? await save({
    title: "Save Mission Bundle",
    filters: [JSON_FILTER],
    defaultPath: `${bundle.name.replace(/\s+/g, "_")}.json`,
  });

  if (!path) return null;

  const content = JSON.stringify(bundle, null, indent);
  await writeTextFile(path, content);
  addRecentFile(path);
  return path;
}

/** Prompt for a new file path and save. */
export async function saveBundleFileAs(bundle: MissionBundle, indent = 2): Promise<string | null> {
  return saveBundleFile(bundle, undefined, indent);
}

/** Import all JSON bundles from a Minecraft world's data/missions/ directory. */
export async function importFromGameFolder(): Promise<{ bundle: MissionBundle; path: string }[] | null> {
  const dir = await open({
    title: "Select Minecraft world's data/missions/ folder",
    directory: true,
    multiple: false,
  });

  if (!dir) return null;

  const results: { bundle: MissionBundle; path: string }[] = [];
  try {
    const entries = await readDir(dir);
    for (const entry of entries) {
      if (entry.name?.endsWith(".json")) {
        try {
          const path = `${dir}/${entry.name}`;
          const content = await readTextFile(path);
          const bundle = parseBundleJson(content, path);
          results.push({ bundle, path });
        } catch {
          // Skip invalid files
        }
      }
    }
  } catch (err) {
    console.error("Failed to read directory:", err);
  }

  return results.length > 0 ? results : null;
}

// #endregion

// #region Defaults

/** Create a new empty bundle with sensible defaults. */
export function createEmptyBundle(): MissionBundle {
  return {
    name: "New Bundle",
    desc: "",
    authors: "",
    version: "1.0",
    mods: "",
    missions: [],
    settings: {
      repeat: "-1",
      unlock: "",
      vars: "",
    },
  };
}

/** Create a new empty mission with the given ID. */
export function createEmptyMission(
  id: number,
  defaults?: { translated?: boolean; alignment?: string },
): MissionBundle["missions"][0] {
  return {
    id,
    translated: defaults?.translated ?? false,
    props: ["default"],
    align: [defaults?.alignment ?? "neutral"],
    title: ["New Mission"],
    subtitle: [""],
    description: [""],
    objectives: [["start"]],
    rewards: [["nothing;;0"]],
  };
}

// #endregion

// #region Recent Files

export function getRecentFiles(): string[] {
  try {
    const stored = localStorage.getItem(RECENT_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function addRecentFile(path: string) {
  try {
    const recent = getRecentFiles().filter((p) => p !== path);
    recent.unshift(path);
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
  } catch {}
}

export function clearRecentFiles() {
  try {
    localStorage.removeItem(RECENT_KEY);
  } catch {}
}

// #endregion

// #region Auto-save

export function saveAutoSaveData(data: { bundles: { bundle: MissionBundle; path?: string }[] }) {
  try {
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(data));
  } catch {}
}

export function loadAutoSaveData(): { bundles: { bundle: MissionBundle; path?: string }[] } | null {
  try {
    const stored = localStorage.getItem(AUTOSAVE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function clearAutoSaveData() {
  try {
    localStorage.removeItem(AUTOSAVE_KEY);
  } catch {}
}

// #endregion
