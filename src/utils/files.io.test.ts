import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockIPC } from "@tauri-apps/api/mocks";
import {
  openBundleFile,
  loadBundleFromPath,
  saveBundleFile,
  saveBundleFileAs,
  importFromGameFolder,
  createEmptyBundle,
  getRecentFiles,
} from "./files";

const validBundleJson = JSON.stringify(createEmptyBundle());
const enc = (s: string) => new TextEncoder().encode(s);
const dec = (bytes: unknown) => new TextDecoder().decode(bytes as Uint8Array);

beforeEach(() => {
  localStorage.clear();
});

describe("openBundleFile", () => {
  it("returns null when the user cancels the dialog", async () => {
    mockIPC((cmd) => {
      if (cmd === "plugin:dialog|open") return null;
    });
    expect(await openBundleFile()).toBeNull();
  });

  it("loads JSON, validates, and adds to recent files", async () => {
    mockIPC((cmd) => {
      if (cmd === "plugin:dialog|open") return "/tmp/x.json";
      if (cmd === "plugin:fs|read_text_file") return enc(validBundleJson);
    });
    const result = await openBundleFile();
    expect(result).not.toBeNull();
    expect(result!.path).toBe("/tmp/x.json");
    expect(result!.bundle.name).toBe("New Bundle");
    expect(getRecentFiles()).toContain("/tmp/x.json");
  });

  it("throws a parse error for malformed JSON", async () => {
    mockIPC((cmd) => {
      if (cmd === "plugin:dialog|open") return "/tmp/bad.json";
      if (cmd === "plugin:fs|read_text_file") return enc("{not json");
    });
    await expect(openBundleFile()).rejects.toThrow(/Invalid JSON/);
  });

  it("throws a structural error for valid JSON that isn't a bundle", async () => {
    mockIPC((cmd) => {
      if (cmd === "plugin:dialog|open") return "/tmp/wrong.json";
      if (cmd === "plugin:fs|read_text_file") return enc(JSON.stringify({ random: true }));
    });
    await expect(openBundleFile()).rejects.toThrow(/Invalid mission bundle/);
  });
});

describe("loadBundleFromPath", () => {
  it("loads from a known path without showing a dialog", async () => {
    const dialog = vi.fn();
    mockIPC((cmd) => {
      if (cmd === "plugin:dialog|open") {
        dialog();
        return null;
      }
      if (cmd === "plugin:fs|read_text_file") return enc(validBundleJson);
    });
    const result = await loadBundleFromPath("/tmp/recent.json");
    expect(result.path).toBe("/tmp/recent.json");
    expect(dialog).not.toHaveBeenCalled();
  });

  it("propagates malformed JSON as an error", async () => {
    mockIPC((cmd) => {
      if (cmd === "plugin:fs|read_text_file") return enc("{broken");
    });
    await expect(loadBundleFromPath("/tmp/x.json")).rejects.toThrow(/Invalid JSON/);
  });
});

describe("saveBundleFile", () => {
  it("uses the provided current path without prompting", async () => {
    let writtenBytes: unknown;
    const dialog = vi.fn();
    mockIPC((cmd, args) => {
      if (cmd === "plugin:dialog|save") {
        dialog();
        return null;
      }
      if (cmd === "plugin:fs|write_text_file") {
        writtenBytes = args;
        return null;
      }
    });
    const path = await saveBundleFile(createEmptyBundle(), "/tmp/existing.json");
    expect(path).toBe("/tmp/existing.json");
    expect(dialog).not.toHaveBeenCalled();
    expect(JSON.parse(dec(writtenBytes)).name).toBe("New Bundle");
  });

  it("prompts via dialog when no current path is given", async () => {
    let promptedDefault: string | undefined;
    mockIPC((cmd, args) => {
      if (cmd === "plugin:dialog|save") {
        promptedDefault = (args as { options: { defaultPath?: string } }).options.defaultPath;
        return "/tmp/picked.json";
      }
      if (cmd === "plugin:fs|write_text_file") return null;
    });
    const bundle = createEmptyBundle();
    bundle.name = "My Pack";
    const path = await saveBundleFileAs(bundle);
    expect(path).toBe("/tmp/picked.json");
    expect(promptedDefault).toBe("My_Pack.json"); // spaces replaced with underscores
  });

  it("returns null when the user cancels the save dialog", async () => {
    mockIPC((cmd) => {
      if (cmd === "plugin:dialog|save") return null;
    });
    expect(await saveBundleFile(createEmptyBundle())).toBeNull();
  });

  it("respects the indent argument", async () => {
    let writtenBytes: unknown;
    mockIPC((cmd, args) => {
      if (cmd === "plugin:fs|write_text_file") {
        writtenBytes = args;
        return null;
      }
    });
    await saveBundleFile(createEmptyBundle(), "/tmp/x.json", 4);
    // 4-space indent puts a fresh property line directly after a 4-space prefix.
    expect(dec(writtenBytes)).toContain('\n    "name"');
  });
});

describe("importFromGameFolder", () => {
  it("returns null when the user cancels the directory picker", async () => {
    mockIPC((cmd) => {
      if (cmd === "plugin:dialog|open") return null;
    });
    expect(await importFromGameFolder()).toBeNull();
  });

  it("loads every .json file in the chosen directory", async () => {
    mockIPC((cmd) => {
      if (cmd === "plugin:dialog|open") return "/missions";
      if (cmd === "plugin:fs|read_dir") {
        return [
          { name: "a.json" },
          { name: "b.json" },
          { name: "readme.txt" },
        ];
      }
      if (cmd === "plugin:fs|read_text_file") return enc(validBundleJson);
    });
    const result = await importFromGameFolder();
    expect(result).not.toBeNull();
    expect(result!).toHaveLength(2);
    expect(result![0].path.endsWith("a.json")).toBe(true);
  });

  it("skips invalid JSON files instead of failing the whole import", async () => {
    mockIPC((cmd, args) => {
      if (cmd === "plugin:dialog|open") return "/missions";
      if (cmd === "plugin:fs|read_dir") return [{ name: "good.json" }, { name: "bad.json" }];
      if (cmd === "plugin:fs|read_text_file") {
        const path = (args as { path: string }).path;
        return path.includes("good") ? enc(validBundleJson) : enc("{busted");
      }
    });
    const result = await importFromGameFolder();
    expect(result).toHaveLength(1);
    expect(result![0].path.endsWith("good.json")).toBe(true);
  });

  it("returns null when the directory has no valid bundles", async () => {
    mockIPC((cmd) => {
      if (cmd === "plugin:dialog|open") return "/empty";
      if (cmd === "plugin:fs|read_dir") return [{ name: "readme.txt" }];
    });
    expect(await importFromGameFolder()).toBeNull();
  });
});

describe("recent files maintenance via the I/O paths", () => {
  it("dedupes a path when re-opened", async () => {
    mockIPC((cmd) => {
      if (cmd === "plugin:fs|read_text_file") return enc(validBundleJson);
    });
    await loadBundleFromPath("/tmp/a.json");
    await loadBundleFromPath("/tmp/b.json");
    await loadBundleFromPath("/tmp/a.json"); // re-open should move to top, not duplicate

    const recent = getRecentFiles();
    expect(recent[0]).toBe("/tmp/a.json");
    expect(recent.filter((p) => p === "/tmp/a.json")).toHaveLength(1);
    expect(recent).toHaveLength(2);
  });

  it("caps recent files at 10 entries", async () => {
    mockIPC((cmd) => {
      if (cmd === "plugin:fs|read_text_file") return enc(validBundleJson);
    });
    for (let i = 0; i < 15; i++) {
      await loadBundleFromPath(`/tmp/f${i}.json`);
    }
    expect(getRecentFiles()).toHaveLength(10);
  });
});
