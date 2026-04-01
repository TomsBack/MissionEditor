import { open, save } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import type { MissionBundle } from "../types/mission";

const JSON_FILTER = { name: "JSON Files", extensions: ["json"] };

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
  return path;
}

/** Prompt for a new file path and save. */
export async function saveBundleFileAs(bundle: MissionBundle): Promise<string | null> {
  return saveBundleFile(bundle, undefined);
}

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
    align: ["50"],
    title: ["New Mission"],
    subtitle: [""],
    description: [""],
    objectives: [["start"]],
    rewards: [["nothing;;0"]],
  };
}
