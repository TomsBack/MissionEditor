import { check, type Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

export interface UpdateInfo {
  version: string;
  currentVersion: string;
  notes?: string;
  date?: string;
}

// Thrown when no update is available or the check itself fails. Callers treat
// both the same way (nothing to show the user), so we don't distinguish.
export async function checkForUpdate(): Promise<{ update: Update; info: UpdateInfo } | null> {
  const update = await check();
  if (!update) return null;
  return {
    update,
    info: {
      version: update.version,
      currentVersion: update.currentVersion,
      notes: update.body,
      date: update.date,
    },
  };
}

export async function installUpdateAndRestart(
  update: Update,
  onProgress?: (downloaded: number, total: number | null) => void,
): Promise<void> {
  let downloaded = 0;
  let contentLength: number | null = null;
  await update.downloadAndInstall((event) => {
    switch (event.event) {
      case "Started":
        contentLength = event.data.contentLength ?? null;
        onProgress?.(0, contentLength);
        break;
      case "Progress":
        downloaded += event.data.chunkLength;
        onProgress?.(downloaded, contentLength);
        break;
      case "Finished":
        onProgress?.(contentLength ?? downloaded, contentLength);
        break;
    }
  });
  await relaunch();
}
