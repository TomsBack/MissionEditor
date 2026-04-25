import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Update } from "@tauri-apps/plugin-updater";
import { UpdateDialog } from "./UpdateDialog";
import * as updater from "../utils/updater";

vi.mock("../utils/updater", async () => {
  const actual = await vi.importActual<typeof import("../utils/updater")>("../utils/updater");
  return {
    ...actual,
    installUpdateAndRestart: vi.fn(),
    checkForUpdate: vi.fn(),
  };
});

const installSpy = vi.mocked(updater.installUpdateAndRestart);
const checkSpy = vi.mocked(updater.checkForUpdate);

const fakeUpdate = { available: true, version: "0.2.0", currentVersion: "0.1.0" } as unknown as Update;
const info: updater.UpdateInfo = {
  version: "0.2.0",
  currentVersion: "0.1.0",
  notes: "Fixes the thing.",
};

beforeEach(() => {
  installSpy.mockReset();
  checkSpy.mockReset();
});
afterEach(() => {
  installSpy.mockReset();
  checkSpy.mockReset();
});

describe("UpdateDialog", () => {
  it("shows the version line and release notes", () => {
    render(<UpdateDialog update={fakeUpdate} info={info} onClose={() => {}} />);
    expect(screen.getByText(/0\.2\.0/)).toBeInTheDocument();
    expect(screen.getByText(/0\.1\.0/)).toBeInTheDocument();
    expect(screen.getByText("Fixes the thing.")).toBeInTheDocument();
  });

  it("calls installUpdateAndRestart with the update handle when Install is clicked", async () => {
    installSpy.mockResolvedValue(undefined);
    render(<UpdateDialog update={fakeUpdate} info={info} onClose={() => {}} />);

    await userEvent.setup().click(screen.getByRole("button", { name: /install/i }));
    expect(installSpy).toHaveBeenCalledTimes(1);
    expect(installSpy.mock.calls[0][0]).toBe(fakeUpdate);
  });

  it("renders progress while downloading and reports the percent", async () => {
    // Hold the install promise open so the dialog stays in the 'installing' state.
    let resolveInstall: () => void = () => {};
    installSpy.mockImplementation((_u, onProgress) => {
      onProgress?.(0, 1000);
      onProgress?.(500, 1000);
      return new Promise((res) => { resolveInstall = res; });
    });

    render(<UpdateDialog update={fakeUpdate} info={info} onClose={() => {}} />);
    await userEvent.setup().click(screen.getByRole("button", { name: /install/i }));

    await waitFor(() => {
      expect(screen.getByText(/50%/)).toBeInTheDocument();
    });
    // Install/Later buttons are hidden during installation.
    expect(screen.queryByRole("button", { name: /install/i })).not.toBeInTheDocument();

    resolveInstall();
  });

  it("falls back to indeterminate progress when total is unknown", async () => {
    let resolveInstall: () => void = () => {};
    installSpy.mockImplementation((_u, onProgress) => {
      onProgress?.(123, null);
      return new Promise((res) => { resolveInstall = res; });
    });

    render(<UpdateDialog update={fakeUpdate} info={info} onClose={() => {}} />);
    await userEvent.setup().click(screen.getByRole("button", { name: /install/i }));
    await waitFor(() => {
      expect(screen.getByText(/downloading/i)).toBeInTheDocument();
    });
    resolveInstall();
  });

  it("surfaces install errors and re-fetches a fresh Update handle for retry", async () => {
    installSpy.mockRejectedValueOnce(new Error("download failed: signature mismatch"));
    const freshHandle = { ...fakeUpdate, version: "0.2.1" } as unknown as Update;
    checkSpy.mockResolvedValueOnce({
      update: freshHandle,
      info: { version: "0.2.1", currentVersion: "0.1.0" },
    });

    render(<UpdateDialog update={fakeUpdate} info={info} onClose={() => {}} />);
    await userEvent.setup().click(screen.getByRole("button", { name: /install/i }));

    await waitFor(() => {
      expect(screen.getByText(/signature mismatch/i)).toBeInTheDocument();
    });
    expect(checkSpy).toHaveBeenCalled();

    // Retry should now use the fresh handle.
    installSpy.mockResolvedValueOnce(undefined);
    await userEvent.setup().click(screen.getByRole("button", { name: /install/i }));
    expect(installSpy).toHaveBeenLastCalledWith(freshHandle, expect.any(Function));
  });

  it("does not crash when the post-error checkForUpdate also fails", async () => {
    installSpy.mockRejectedValueOnce(new Error("first failure"));
    checkSpy.mockRejectedValueOnce(new Error("offline"));

    render(<UpdateDialog update={fakeUpdate} info={info} onClose={() => {}} />);
    await userEvent.setup().click(screen.getByRole("button", { name: /install/i }));

    await waitFor(() => {
      expect(screen.getByText(/first failure/i)).toBeInTheDocument();
    });
    // Install/Later buttons are visible again so the user can retry.
    expect(screen.getByRole("button", { name: /install/i })).toBeInTheDocument();
  });

  it("clicking Later closes the dialog", async () => {
    const onClose = vi.fn();
    render(<UpdateDialog update={fakeUpdate} info={info} onClose={onClose} />);
    // Two "Later" buttons exist (header + footer); clicking either closes.
    const laters = screen.getAllByRole("button", { name: /later/i });
    await userEvent.setup().click(laters[0]);
    expect(onClose).toHaveBeenCalled();
  });
});
