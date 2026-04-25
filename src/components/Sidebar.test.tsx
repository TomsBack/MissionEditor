import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Sidebar } from "./Sidebar";
import { createEmptyBundle, createEmptyMission } from "../utils/files";
import type { Mission, MissionBundle } from "../types/mission";

function makeBundle(overrides: Partial<MissionBundle> = {}, missions: Mission[] = []): MissionBundle {
  return { ...createEmptyBundle(), ...overrides, missions };
}

function setup(props: Partial<React.ComponentProps<typeof Sidebar>> = {}) {
  const bundles: MissionBundle[] = props.bundles ?? [
    makeBundle({ name: "Pack A" }, [
      createEmptyMission(0),
      { ...createEmptyMission(1), title: ["Defeat Boss"] },
      { ...createEmptyMission(2), title: ["Find Loot"] },
    ]),
  ];
  const callbacks = {
    onSelectBundle: vi.fn(),
    onSelectMission: vi.fn(),
    onAddMission: vi.fn(),
    onAddFromTemplate: vi.fn(),
    onCloseBundle: vi.fn(),
    onDeleteMission: vi.fn(),
    onMoveMission: vi.fn(),
    onCopyMission: vi.fn(),
    onDuplicateMission: vi.fn(),
  };
  render(
    <Sidebar
      bundles={bundles}
      selectedBundle={0}
      selectedMission={0}
      duplicateIds={new Set()}
      dirtyBundles={[false]}
      {...callbacks}
      {...props}
    />,
  );
  return { bundles, ...callbacks, user: userEvent.setup() };
}

describe("Sidebar bundle list", () => {
  it("renders one row per bundle with name and mission count", () => {
    setup({
      bundles: [
        makeBundle({ name: "First" }, [createEmptyMission(0)]),
        makeBundle({ name: "Second" }, [createEmptyMission(0), createEmptyMission(1)]),
      ],
      dirtyBundles: [false, false],
    });
    // Bundle names also appear inside copy-select options when 2+ bundles are open,
    // so scope the assertions to the bundles section's list.
    const sections = document.querySelectorAll(".sidebar-section .sidebar-list");
    const bundleList = sections[0] as HTMLElement;
    expect(within(bundleList).getByText("First")).toBeInTheDocument();
    expect(within(bundleList).getByText("Second")).toBeInTheDocument();
    expect(within(bundleList).getByText("1")).toBeInTheDocument();
    expect(within(bundleList).getByText("2")).toBeInTheDocument();
  });

  it("falls back to 'Untitled' when a bundle has no name", () => {
    setup({
      bundles: [makeBundle({ name: "" }, [])],
      dirtyBundles: [false],
    });
    expect(screen.getByText(/untitled/i)).toBeInTheDocument();
  });

  it("renders the empty state when no bundles are open", () => {
    setup({ bundles: [], dirtyBundles: [] });
    expect(screen.getByText(/Open a JSON file or create a new bundle/i)).toBeInTheDocument();
  });

  it("shows a dirty dot for unsaved bundles", () => {
    const { container } = render(
      <Sidebar
        bundles={[makeBundle({ name: "Dirty" }, [])]}
        selectedBundle={0}
        selectedMission={0}
        duplicateIds={new Set()}
        dirtyBundles={[true]}
        onSelectBundle={() => {}}
        onSelectMission={() => {}}
        onAddMission={() => {}}
        onAddFromTemplate={() => {}}
        onCloseBundle={() => {}}
        onDeleteMission={() => {}}
        onMoveMission={() => {}}
        onCopyMission={() => {}}
        onDuplicateMission={() => {}}
      />,
    );
    expect(container.querySelector(".dirty-dot")).toBeInTheDocument();
  });

  it("clicking a non-selected bundle row calls onSelectBundle", async () => {
    const onSelectBundle = vi.fn();
    setup({
      bundles: [
        makeBundle({ name: "A" }, []),
        makeBundle({ name: "B" }, []),
      ],
      dirtyBundles: [false, false],
      onSelectBundle,
    });
    await userEvent.setup().click(screen.getByText("B"));
    expect(onSelectBundle).toHaveBeenCalledWith(1);
  });

  it("clicking the bundle close button stops propagation and calls onCloseBundle", async () => {
    const onCloseBundle = vi.fn();
    const onSelectBundle = vi.fn();
    setup({
      bundles: [makeBundle({ name: "Pack" }, [])],
      dirtyBundles: [false],
      onCloseBundle,
      onSelectBundle,
    });
    const closeBtn = screen.getByTitle(/close bundle/i);
    await userEvent.setup().click(closeBtn);
    expect(onCloseBundle).toHaveBeenCalledWith(0);
    expect(onSelectBundle).not.toHaveBeenCalled();
  });
});

describe("Sidebar mission list", () => {
  it("renders one row per mission", () => {
    setup();
    expect(screen.getByText("Defeat Boss")).toBeInTheDocument();
    expect(screen.getByText("Find Loot")).toBeInTheDocument();
  });

  it("falls back to 'Mission <id>' when a mission has no title", () => {
    setup({
      bundles: [
        makeBundle({ name: "P" }, [
          { ...createEmptyMission(7), title: [""] },
        ]),
      ],
      dirtyBundles: [false],
    });
    expect(screen.getByText(/Mission 7/i)).toBeInTheDocument();
  });

  it("shows the mission ID prefix when showMissionIds is on", () => {
    setup({ showMissionIds: true });
    expect(screen.getByText("#1")).toBeInTheDocument();
  });

  it("hides the mission ID prefix when showMissionIds is off", () => {
    setup({ showMissionIds: false });
    expect(screen.queryByText("#1")).not.toBeInTheDocument();
  });

  it("renders the empty state when there are missions but the bundle has none", () => {
    setup({ bundles: [makeBundle({ name: "P" }, [])], dirtyBundles: [false] });
    expect(screen.getByText(/no missions yet/i)).toBeInTheDocument();
  });

  it("clicking a non-selected mission row calls onSelectMission with its index", async () => {
    const onSelectMission = vi.fn();
    setup({ onSelectMission });
    await userEvent.setup().click(screen.getByText("Defeat Boss"));
    expect(onSelectMission).toHaveBeenCalledWith(1);
  });

  it("delete button calls onDeleteMission with the row index and stops propagation", async () => {
    const onDeleteMission = vi.fn();
    const onSelectMission = vi.fn();
    setup({ onDeleteMission, onSelectMission });
    // Delete buttons are titled "Delete" via i18n; pick the one inside the second mission.
    const items = document.querySelectorAll(".sidebar-item.selected, .sidebar-item:not(.selected)");
    // Filter to mission rows (skip the bundle row at the top).
    const missionRows = Array.from(items).filter((el) => el.querySelector(".sidebar-item-id"));
    const deleteBtn = within(missionRows[1] as HTMLElement).getByTitle(/^delete$/i);
    await userEvent.setup().click(deleteBtn);
    expect(onDeleteMission).toHaveBeenCalledWith(1);
    expect(onSelectMission).not.toHaveBeenCalled();
  });

  it("duplicate button calls onDuplicateMission with the row index", async () => {
    const onDuplicateMission = vi.fn();
    setup({ onDuplicateMission });
    const missionRows = document.querySelectorAll(".sidebar-item .sidebar-item-id");
    const row = (missionRows[2].closest(".sidebar-item")) as HTMLElement;
    await userEvent.setup().click(within(row).getByTitle(/duplicate/i));
    expect(onDuplicateMission).toHaveBeenCalledWith(2);
  });

  it("highlights duplicate IDs", () => {
    setup({ duplicateIds: new Set([1]) });
    const dupBadge = document.querySelector(".sidebar-item-id.duplicate");
    expect(dupBadge?.textContent).toBe("#1");
  });

  it("Add and Template buttons fire their callbacks", async () => {
    const onAddMission = vi.fn();
    const onAddFromTemplate = vi.fn();
    setup({ onAddMission, onAddFromTemplate });
    await userEvent.setup().click(screen.getByRole("button", { name: "+" }));
    expect(onAddMission).toHaveBeenCalled();
    await userEvent.setup().click(screen.getByRole("button", { name: "T" }));
    expect(onAddFromTemplate).toHaveBeenCalled();
  });
});

describe("Sidebar search", () => {
  function withSixMissions() {
    return [
      makeBundle({ name: "P" }, [
        createEmptyMission(0),
        { ...createEmptyMission(1), title: ["Alpha"] },
        { ...createEmptyMission(2), title: ["Beta"] },
        { ...createEmptyMission(3), title: ["Gamma"] },
        { ...createEmptyMission(4), title: ["Delta"] },
        { ...createEmptyMission(5), title: ["Epsilon"] },
      ]),
    ];
  }

  it("does not render the search input below the threshold", () => {
    setup(); // 3 missions
    expect(screen.queryByPlaceholderText(/search missions/i)).not.toBeInTheDocument();
  });

  it("renders the search input once mission count exceeds the threshold", () => {
    setup({ bundles: withSixMissions(), dirtyBundles: [false] });
    expect(screen.getByPlaceholderText(/search missions/i)).toBeInTheDocument();
  });

  it("filters missions by title substring", async () => {
    setup({ bundles: withSixMissions(), dirtyBundles: [false] });
    const search = screen.getByPlaceholderText(/search missions/i);
    await userEvent.setup().type(search, "delta");
    expect(screen.getByText("Delta")).toBeInTheDocument();
    expect(screen.queryByText("Alpha")).not.toBeInTheDocument();
  });

  it("filters by mission ID", async () => {
    setup({ bundles: withSixMissions(), dirtyBundles: [false] });
    const search = screen.getByPlaceholderText(/search missions/i);
    await userEvent.setup().type(search, "3");
    expect(screen.getByText("Gamma")).toBeInTheDocument();
    expect(screen.queryByText("Alpha")).not.toBeInTheDocument();
  });

  it("shows a no-results message when nothing matches", async () => {
    setup({ bundles: withSixMissions(), dirtyBundles: [false] });
    const search = screen.getByPlaceholderText(/search missions/i);
    await userEvent.setup().type(search, "zzz");
    expect(screen.getByText(/no missions matching/i)).toBeInTheDocument();
  });
});

describe("Sidebar copy-to-bundle", () => {
  it("does not render the copy select when only one bundle is open", () => {
    setup();
    expect(document.querySelector(".copy-select")).not.toBeInTheDocument();
  });

  it("renders the copy select when there are at least two bundles, listing the others", () => {
    setup({
      bundles: [
        makeBundle({ name: "Source" }, [createEmptyMission(0)]),
        makeBundle({ name: "Target A" }, []),
        makeBundle({ name: "Target B" }, []),
      ],
      dirtyBundles: [false, false, false],
    });
    const copy = document.querySelector(".copy-select") as HTMLSelectElement;
    expect(copy).toBeInTheDocument();
    const optionLabels = Array.from(copy.options).map((o) => o.textContent);
    // First option is the disabled placeholder; remaining options should be the OTHER bundles only.
    expect(optionLabels.slice(1)).toEqual(["Target A", "Target B"]);
  });

  it("copying to a target bundle calls onCopyMission with the mission and target index", async () => {
    const onCopyMission = vi.fn();
    setup({
      bundles: [
        makeBundle({ name: "Source" }, [createEmptyMission(7)]),
        makeBundle({ name: "Target A" }, []),
        makeBundle({ name: "Target B" }, []),
      ],
      dirtyBundles: [false, false, false],
      onCopyMission,
    });
    const copy = document.querySelector(".copy-select") as HTMLSelectElement;
    await userEvent.setup().selectOptions(copy, "2");
    expect(onCopyMission).toHaveBeenCalledTimes(1);
    expect(onCopyMission.mock.calls[0][1]).toBe(2);
    expect(onCopyMission.mock.calls[0][0].id).toBe(7);
  });
});
