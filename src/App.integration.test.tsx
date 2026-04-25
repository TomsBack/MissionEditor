import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { mockIPC, mockWindows } from "@tauri-apps/api/mocks";
import type { ReactNode } from "react";

// react-resizable-panels' useRef call hits a null React in the vitest browser
// optimizer because the module isn't pre-bundled the way the App's React copy
// is. The panels are pure layout wrappers (no behavior we care about for these
// tests), so swap them for plain divs that pass children through.
vi.mock("react-resizable-panels", () => ({
  Group: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Panel: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Separator: () => <div />,
}));

// eslint-disable-next-line import/first
import App from "./App";
// eslint-disable-next-line import/first
import { createEmptyBundle, createEmptyMission } from "./utils/files";
// eslint-disable-next-line import/first
import type { MissionBundle } from "./types/mission";

// #region Test helpers

const enc = (s: string) => new TextEncoder().encode(s);

/**
 * Build an IPC handler that responds to the standard commands the App makes
 * during boot (window listener registration, idle update check, locale fetches)
 * and lets each test layer its own command-specific responses on top.
 */
function ipc(handlers: (cmd: string, args: unknown) => unknown) {
  return (cmd: string, args: unknown) => {
    // Boot-time IPC the App fires regardless of user interaction. Returning
    // benign values keeps useEffects from throwing.
    if (cmd === "plugin:event|listen") return 0;
    if (cmd === "plugin:event|unlisten") return null;
    if (cmd === "plugin:updater|check") return null;
    if (cmd === "plugin:window|close") return null;
    return handlers(cmd, args);
  };
}

/** A bundle with a few known-shape missions for sidebar/editor assertions. */
function fixtureBundle(): MissionBundle {
  const b = createEmptyBundle();
  b.name = "Saga Pack";
  b.missions = [
    createEmptyMission(0),
    createEmptyMission(1),
    createEmptyMission(2),
  ];
  b.missions[0].title = ["Find the artifact"];
  b.missions[0].subtitle = ["Tutorial"];
  b.missions[1].title = ["Defeat the boss"];
  b.missions[1].subtitle = ["Mid-game"];
  b.missions[2].title = ["Reach the stars"];
  b.missions[2].subtitle = ["End-game"];
  return b;
}

/**
 * Drive the Open dialog flow: click Open, simulate Tauri returning the given
 * path + bundle JSON. Returns once the bundle has rendered into the sidebar.
 */
async function openBundle(user: ReturnType<typeof userEvent.setup>, path: string, bundle: MissionBundle) {
  mockIPC(ipc((cmd) => {
    if (cmd === "plugin:dialog|open") return path;
    if (cmd === "plugin:fs|read_text_file") return enc(JSON.stringify(bundle));
    return null;
  }));
  await user.click(screen.getByRole("button", { name: /^open$/i }));
  // Wait for at least one mission's title to appear in the sidebar.
  if (bundle.missions[0]?.title?.[0]) {
    await waitFor(() => {
      expect(screen.getByText(bundle.missions[0].title[0])).toBeInTheDocument();
    });
  }
}

// #endregion

describe("App integration", () => {
  beforeEach(() => {
    // getCurrentWindow() reads __TAURI_INTERNALS__.metadata.currentWindow,
    // which only exists when mockWindows has installed it. The follow-on
    // unlisten on unmount is silenced inside App.tsx itself (Tauri's event
    // plugin internals aren't populated under the mock).
    mockWindows("main");
    // Default: every IPC call is benign no-op until a test installs its own.
    mockIPC(ipc(() => null));
  });

  afterEach(() => {
    // setup file already runs cleanup + clearMocks + localStorage.clear.
  });

  it("opens a bundle, populates the sidebar, and renders the first mission's editor", async () => {
    const user = userEvent.setup();
    const bundle = fixtureBundle();
    render(<App />);

    await openBundle(user, "/tmp/saga.json", bundle);

    // Sidebar lists every mission's title.
    expect(screen.getByText("Find the artifact")).toBeInTheDocument();
    expect(screen.getByText("Defeat the boss")).toBeInTheDocument();
    expect(screen.getByText("Reach the stars")).toBeInTheDocument();

    // Active mission's title sits in an editable field. Mission 0 is selected
    // by default, so its title shows up as an input value.
    expect(screen.getByDisplayValue("Find the artifact")).toBeInTheDocument();

    // Toolbar shows the file's basename (and no dirty marker yet). Recent
    // files dropdown also lists "saga.json", so scope to the toolbar via
    // the title-attr full-path tooltip we render alongside the basename.
    expect(screen.getByTitle("/tmp/saga.json")).toHaveTextContent("saga.json");
  });

  it("clicking a sidebar mission switches the editor to that mission's content", async () => {
    const user = userEvent.setup();
    const bundle = fixtureBundle();
    render(<App />);
    await openBundle(user, "/tmp/saga.json", bundle);

    // Initially mission 0 is active.
    expect(screen.getByDisplayValue("Find the artifact")).toBeInTheDocument();

    // Click the second mission in the sidebar.
    await user.click(screen.getByText("Defeat the boss"));
    expect(screen.getByDisplayValue("Defeat the boss")).toBeInTheDocument();

    // The previous mission's title input is gone (only one variant input
    // shows for the active mission).
    expect(screen.queryByDisplayValue("Find the artifact")).not.toBeInTheDocument();
  });

  it("editing a mission flips the bundle to dirty and only flags the edited mission", async () => {
    const user = userEvent.setup();
    const bundle = fixtureBundle();
    render(<App />);
    await openBundle(user, "/tmp/saga.json", bundle);

    // No dirty marker on a freshly opened bundle.
    expect(screen.queryByText("*")).not.toBeInTheDocument();

    // Type into mission 0's title field.
    const title = screen.getByDisplayValue("Find the artifact") as HTMLInputElement;
    await user.click(title);
    await user.keyboard("!");

    // Toolbar dirty marker shows up.
    await waitFor(() => {
      expect(screen.getByText("*")).toBeInTheDocument();
    });

    // Sidebar mission #0's row now has a dirty dot, but mission #1 doesn't.
    const mission0Row = screen.getByText("Find the artifact!").closest(".sidebar-item")!;
    const mission1Row = screen.getByText("Defeat the boss").closest(".sidebar-item")!;
    expect(mission0Row.querySelector(".dirty-dot")).not.toBeNull();
    expect(mission1Row.querySelector(".dirty-dot")).toBeNull();
  });

  it("Ctrl+Z reverts the last edit and Ctrl+Y restores it", async () => {
    const user = userEvent.setup();
    const bundle = fixtureBundle();
    render(<App />);
    await openBundle(user, "/tmp/saga.json", bundle);

    const title = screen.getByDisplayValue("Find the artifact");
    await user.click(title);
    await user.keyboard("X");
    await waitFor(() => {
      expect(screen.getByDisplayValue("Find the artifactX")).toBeInTheDocument();
    });

    // Undo. Editor debounces edits at 500 ms; jsdom's fake timers aren't in
    // play here so we just wait for the post-debounce snapshot to commit
    // before pressing Ctrl+Z. The history hook also pulls back from a
    // mid-burst pre-edit snapshot, so this works regardless.
    await user.keyboard("{Control>}z{/Control}");
    await waitFor(() => {
      expect(screen.getByDisplayValue("Find the artifact")).toBeInTheDocument();
    });

    // Redo via Ctrl+Y.
    await user.keyboard("{Control>}y{/Control}");
    await waitFor(() => {
      expect(screen.getByDisplayValue("Find the artifactX")).toBeInTheDocument();
    });
  });

  it("validation: a bundle with a reward pointing at a non-existent mission ID surfaces an error in the Issues tab", async () => {
    const user = userEvent.setup();
    const bundle = fixtureBundle();
    // Mission 0 grants a reward that links to a non-existent ID 999.
    bundle.missions[0].rewards = [["nothing;;999"]];
    render(<App />);
    await openBundle(user, "/tmp/saga.json", bundle);

    // The Issues tab button should show a count.
    const issuesBtn = screen.getByRole("button", { name: /issues/i });
    expect(issuesBtn.textContent).toMatch(/\(\d+\)/);

    // Open the panel.
    await user.click(issuesBtn);
    await waitFor(() => {
      expect(screen.getByText(/next mission ID 999 does not exist/i)).toBeInTheDocument();
    });
  });

  it("sidebar search filters by mission title", async () => {
    const user = userEvent.setup();
    const bundle = fixtureBundle();
    // Bump above the 5-mission threshold the sidebar uses to show search.
    for (let i = 3; i < 7; i++) {
      const m = createEmptyMission(i);
      m.title = [`Filler ${i}`];
      bundle.missions.push(m);
    }
    render(<App />);
    await openBundle(user, "/tmp/saga.json", bundle);

    const search = await screen.findByPlaceholderText(/search missions/i);
    await user.type(search, "boss");

    await waitFor(() => {
      expect(screen.getByText("Defeat the boss")).toBeInTheDocument();
      expect(screen.queryByText("Find the artifact")).not.toBeInTheDocument();
      expect(screen.queryByText("Filler 3")).not.toBeInTheDocument();
    });
  });

  it("renaming a variant to a known race surfaces the matching context hint", async () => {
    const user = userEvent.setup();
    const bundle = fixtureBundle();
    render(<App />);
    await openBundle(user, "/tmp/saga.json", bundle);

    // Add a second variant so we move off the fallback slot (whose hint
    // is the fallback explanation regardless of the prop value).
    await user.click(screen.getByRole("button", { name: /\+ variant/i }));

    // The new tab is auto-selected and its rename field is empty. Type a
    // known race name into it.
    // The default mission has `props: ["default"]`, after addVariant we
    // have ["default", ""]. The active rename input has empty value, but
    // there's still a Race-or-class label-paired field in the DOM with
    // an empty value; query by placeholder instead.
    const renameInput = screen.getByPlaceholderText(/Saiyan, Namekian, MartialArtist/);
    await user.click(renameInput);
    await user.type(renameInput, "Saiyan");

    await waitFor(() => {
      expect(screen.getByText(/Matches Saiyan players/i)).toBeInTheDocument();
    });
  });

  it("save round-trip: dirty bundle is saved, dirty marker clears, and the same content gets written back", async () => {
    const user = userEvent.setup();
    const bundle = fixtureBundle();
    let writtenJson: string | null = null;

    render(<App />);
    await openBundle(user, "/tmp/saga.json", bundle);

    // Edit the title to make it dirty.
    const title = screen.getByDisplayValue("Find the artifact");
    await user.click(title);
    await user.keyboard("Z");
    await waitFor(() => {
      expect(screen.getByText("*")).toBeInTheDocument();
    });

    // Replace the IPC handler so save calls write to our local capture.
    mockIPC(ipc((cmd, args) => {
      if (cmd === "plugin:dialog|save") return "/tmp/saga.json";
      if (cmd === "plugin:fs|write_text_file") {
        // Tauri's plugin-fs sends bytes as a Uint8Array under args.
        const bytes = (args as { file?: ArrayLike<number> }).file
          ?? (args as ArrayLike<number>);
        writtenJson = new TextDecoder().decode(new Uint8Array(bytes as ArrayLike<number>));
        return null;
      }
      return null;
    }));

    await user.click(screen.getByRole("button", { name: /^save$/i }));

    // Dirty marker clears once the save resolves.
    await waitFor(() => {
      expect(screen.queryByText("*")).not.toBeInTheDocument();
    });

    // The file the editor wrote back includes the new title text.
    expect(writtenJson).not.toBeNull();
    expect(writtenJson!).toContain("Find the artifactZ");
  });
});
