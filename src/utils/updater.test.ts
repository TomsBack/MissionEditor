import { describe, expect, it } from "vitest";
import { mockIPC } from "@tauri-apps/api/mocks";
import { checkForUpdate } from "./updater";

describe("checkForUpdate", () => {
  it("returns null when no update is available", async () => {
    mockIPC((cmd) => {
      if (cmd === "plugin:updater|check") return null;
    });
    expect(await checkForUpdate()).toBeNull();
  });

  it("wraps the Update handle and surfaces version metadata", async () => {
    mockIPC((cmd) => {
      if (cmd === "plugin:updater|check") {
        return {
          rid: 1,
          currentVersion: "0.1.0",
          version: "0.2.0",
          date: "2026-04-25",
          body: "Bug fixes",
          rawJson: {},
        };
      }
    });
    const result = await checkForUpdate();
    expect(result).not.toBeNull();
    expect(result!.info).toMatchObject({
      version: "0.2.0",
      currentVersion: "0.1.0",
      notes: "Bug fixes",
      date: "2026-04-25",
    });
    expect(result!.update.available).toBe(true);
  });

  it("rejects when the underlying check throws", async () => {
    mockIPC((cmd) => {
      if (cmd === "plugin:updater|check") throw new Error("network down");
    });
    await expect(checkForUpdate()).rejects.toThrow(/network down/);
  });

  it("rejects with a timeout error when the check exceeds the limit", async () => {
    mockIPC(async (cmd) => {
      if (cmd === "plugin:updater|check") {
        await new Promise((r) => setTimeout(r, 200));
        return null;
      }
    });
    // Use a tight 50ms ceiling so the 200ms mock can't beat it.
    await expect(checkForUpdate(50)).rejects.toThrow(/timed out/);
  });

  it("succeeds when the check resolves before the timeout", async () => {
    mockIPC(async (cmd) => {
      if (cmd === "plugin:updater|check") return null;
    });
    expect(await checkForUpdate(1000)).toBeNull();
  });
});
