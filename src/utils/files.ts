import { open, save } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile, readDir } from "@tauri-apps/plugin-fs";
import type { MissionBundle } from "../types/mission";

const JSON_FILTER = { name: "JSON Files", extensions: ["json"] };
const RECENT_KEY = "mission-editor-recent-files";
const AUTOSAVE_KEY = "mission-editor-autosave";
const MAX_RECENT = 10;

// #region File Operations

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
  const bundle = JSON.parse(content) as MissionBundle;
  addRecentFile(path);
  return { bundle, path };
}

/** Load a bundle from a known path (for recent files). */
export async function loadBundleFromPath(path: string): Promise<{ bundle: MissionBundle; path: string }> {
  const content = await readTextFile(path);
  const bundle = JSON.parse(content) as MissionBundle;
  addRecentFile(path);
  return { bundle, path };
}

/** Save a mission bundle to the given file path (or prompt for a new path). */
export async function saveBundleFile(bundle: MissionBundle, currentPath?: string): Promise<string | null> {
  const path = currentPath ?? await save({
    title: "Save Mission Bundle",
    filters: [JSON_FILTER],
    defaultPath: `${bundle.name.replace(/\s+/g, "_")}.json`,
  });

  if (!path) return null;

  const content = JSON.stringify(bundle, null, 2);
  await writeTextFile(path, content);
  addRecentFile(path);
  return path;
}

/** Prompt for a new file path and save. */
export async function saveBundleFileAs(bundle: MissionBundle): Promise<string | null> {
  return saveBundleFile(bundle, undefined);
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
          const bundle = JSON.parse(content) as MissionBundle;
          if (bundle.missions && bundle.name) {
            results.push({ bundle, path });
          }
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
export function createEmptyMission(id: number): MissionBundle["missions"][0] {
  return {
    id,
    translated: false,
    props: ["default"],
    align: ["neutral"],
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
