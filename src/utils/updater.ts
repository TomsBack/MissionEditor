import { check, type Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

export interface UpdateInfo {
  version: string;
  currentVersion: string;
  notes?: string;
  date?: string;
}

const DEFAULT_CHECK_TIMEOUT_MS = 5000;

// Thrown when no update is available or the check itself fails. Callers treat
// both the same way (nothing to show the user), so we don't distinguish.
export async function checkForUpdate(
  timeoutMs = DEFAULT_CHECK_TIMEOUT_MS,
): Promise<{ update: Update; info: UpdateInfo } | null> {
  const update = await withTimeout(check({ timeout: timeoutMs }), timeoutMs);
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

// plugin-updater's `timeout` applies per-request; wrap the whole call so a
// hung DNS / TCP resolution can't pin us past the limit either.
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`update check timed out after ${ms}ms`)), ms);
    promise.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); },
    );
  });
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
