import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MissionEditor } from "./MissionEditor";
import { createEmptyMission } from "../utils/files";
import type { Mission } from "../types/mission";

function Harness({ initial, onUpdate }: { initial?: Mission; onUpdate?: (m: Mission) => void }) {
  const [m, setM] = useState<Mission>(initial ?? createEmptyMission(0));
  return (
    <MissionEditor
      mission={m}
      onChange={(next) => { setM(next); onUpdate?.(next); }}
    />
  );
}

describe("MissionEditor", () => {
  it("shows the mission id in the header", () => {
    render(<Harness initial={{ ...createEmptyMission(0), id: 42 }} />);
    expect(screen.getByText(/Mission #42/i)).toBeInTheDocument();
  });

  it("editing the id input propagates a number", async () => {
    const onUpdate = vi.fn();
    render(<Harness onUpdate={onUpdate} />);
    // "Mission ID" also appears as "Next Mission ID" in RewardEditor; match exactly.
    const idLabel = screen.getByText("Mission ID");
    const idInput = idLabel.parentElement!.querySelector('input[type="number"]') as HTMLInputElement;
    await userEvent.setup().clear(idInput);
    await userEvent.setup().type(idInput, "9");
    const last = onUpdate.mock.calls.at(-1)![0] as Mission;
    expect(last.id).toBe(9);
  });

  it("toggling 'translated' flips the boolean", async () => {
    const onUpdate = vi.fn();
    render(<Harness onUpdate={onUpdate} />);
    const checkbox = screen.getByRole("checkbox") as HTMLInputElement;
    expect(checkbox.checked).toBe(false);
    await userEvent.setup().click(checkbox);
    const last = onUpdate.mock.calls.at(-1)![0] as Mission;
    expect(last.translated).toBe(true);
  });

  it("editing the title field updates the active variant's title", async () => {
    const onUpdate = vi.fn();
    render(<Harness onUpdate={onUpdate} />);
    // The default mission's title is "New Mission"; locate it.
    const title = screen.getByDisplayValue("New Mission") as HTMLInputElement;
    await userEvent.setup().clear(title);
    await userEvent.setup().type(title, "Boss Fight");
    const last = onUpdate.mock.calls.at(-1)![0] as Mission;
    expect(last.title[0]).toBe("Boss Fight");
  });

  it("Add Variant grows every parallel array in lockstep", async () => {
    const onUpdate = vi.fn();
    render(<Harness onUpdate={onUpdate} />);
    await userEvent.setup().click(screen.getByRole("button", { name: /\+ variant/i }));
    const last = onUpdate.mock.calls.at(-1)![0] as Mission;
    expect(last.props).toHaveLength(2);
    expect(last.title).toHaveLength(2);
    expect(last.subtitle).toHaveLength(2);
    expect(last.description).toHaveLength(2);
    expect(last.align).toHaveLength(2);
    expect(last.objectives).toHaveLength(2);
    expect(last.rewards).toHaveLength(2);
  });

  it("Add Variant seeds the new variant with sane defaults", async () => {
    const onUpdate = vi.fn();
    render(<Harness onUpdate={onUpdate} />);
    await userEvent.setup().click(screen.getByRole("button", { name: /\+ variant/i }));
    const last = onUpdate.mock.calls.at(-1)![0] as Mission;
    // New variants start with an empty prop name so the user is forced to
    // choose a real race/class via the inline tab editor; defaults for the
    // rest of the parallel arrays should still be sane.
    expect(last.props[1]).toBe("");
    expect(last.align[1]).toBe("neutral");
    expect(last.objectives[1]).toEqual(["start"]);
    expect(last.rewards[1]).toEqual(["nothing;;0"]);
  });

  it("Duplicate Variant clones the active variant's content", async () => {
    const onUpdate = vi.fn();
    const initial: Mission = {
      ...createEmptyMission(0),
      props: ["Saiyan"],
      align: ["good"],
      title: ["Reach SSJ"],
      subtitle: [""],
      description: [""],
      objectives: [["start", "kill;NSaiyan02;H400"]],
      rewards: [["nothing;;5"]],
    };
    render(<Harness initial={initial} onUpdate={onUpdate} />);
    await userEvent.setup().click(screen.getByRole("button", { name: /duplicate variant/i }));
    const last = onUpdate.mock.calls.at(-1)![0] as Mission;
    expect(last.props).toHaveLength(2);
    expect(last.props[1]).toMatch(/Saiyan.*\(copy\)/);
    expect(last.align[1]).toBe("good");
    expect(last.title[1]).toBe("Reach SSJ");
    expect(last.objectives[1]).toEqual(["start", "kill;NSaiyan02;H400"]);
    expect(last.rewards[1]).toEqual(["nothing;;5"]);
  });

  it("clicking a variant tab switches the active variant", async () => {
    const initial: Mission = {
      ...createEmptyMission(0),
      props: ["base", "hard"],
      align: ["neutral", "evil"],
      title: ["Easy mode", "Brutal mode"],
      subtitle: ["", ""],
      description: ["", ""],
      objectives: [["start"], ["start"]],
      rewards: [["nothing;;0"], ["nothing;;0"]],
    };
    render(<Harness initial={initial} />);

    // Initially the title input shows the first variant.
    expect(screen.getByDisplayValue("Easy mode")).toBeInTheDocument();

    // Click the second tab.
    await userEvent.setup().click(screen.getByText("hard"));
    expect(screen.getByDisplayValue("Brutal mode")).toBeInTheDocument();
  });

  it("removes a variant when its tab close button is clicked, keeping the others intact", async () => {
    const onUpdate = vi.fn();
    const initial: Mission = {
      ...createEmptyMission(0),
      props: ["a", "b", "c"],
      align: ["neutral", "neutral", "neutral"],
      title: ["A", "B", "C"],
      subtitle: ["", "", ""],
      description: ["", "", ""],
      objectives: [["start"], ["start"], ["start"]],
      rewards: [["nothing;;0"], ["nothing;;0"], ["nothing;;0"]],
    };
    render(<Harness initial={initial} onUpdate={onUpdate} />);

    // Find the tab containing "b" and click its close x.
    const bTab = screen.getByText("b").closest(".prop-tab") as HTMLElement;
    await userEvent.setup().click(within(bTab).getByText("x"));

    const last = onUpdate.mock.calls.at(-1)![0] as Mission;
    expect(last.props).toEqual(["a", "c"]);
    expect(last.title).toEqual(["A", "C"]);
  });

  it("does not show variant close buttons when there is only one variant", () => {
    render(<Harness />);
    const tabs = document.querySelectorAll(".prop-tab");
    expect(tabs).toHaveLength(1);
    expect(tabs[0].querySelector(".prop-tab-close")).toBeNull();
  });

  it("changing alignment emits a lowercased value", async () => {
    const onUpdate = vi.fn();
    render(<Harness onUpdate={onUpdate} />);
    // The alignment select is the only one with good/neutral/evil options.
    const selects = Array.from(document.querySelectorAll("select")) as HTMLSelectElement[];
    const alignSelect = selects.find((s) => Array.from(s.options).some((o) => o.value === "evil"))!;
    await userEvent.setup().selectOptions(alignSelect, "evil");
    const last = onUpdate.mock.calls.at(-1)![0] as Mission;
    expect(last.align[0]).toBe("evil");
  });

  it("the variant rename field updates the active variant's prop name", async () => {
    const onUpdate = vi.fn();
    const user = userEvent.setup();
    render(<Harness onUpdate={onUpdate} />);

    // The rename field is the only input that initially shows "default"
    // (the empty-mission's first variant is named "default").
    const renameInput = screen.getByDisplayValue("default") as HTMLInputElement;
    await user.clear(renameInput);
    await user.type(renameInput, "Saiyan");

    const last = onUpdate.mock.calls.at(-1)![0] as Mission;
    expect(last.props[0]).toBe("Saiyan");
  });

  it("editing the description textarea updates description[]", async () => {
    const onUpdate = vi.fn();
    render(<Harness onUpdate={onUpdate} />);
    const textarea = document.querySelector("textarea") as HTMLTextAreaElement;
    await userEvent.setup().type(textarea, "Hi");
    const last = onUpdate.mock.calls.at(-1)![0] as Mission;
    expect(last.description[0]).toBe("Hi");
  });

  it("renders the embedded ObjectiveEditor and RewardEditor (smoke check)", () => {
    render(<Harness />);
    // ObjectiveEditor surfaces an "Add Objective" button; RewardEditor surfaces "Add Choice".
    expect(screen.getByRole("button", { name: /add objective/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add choice/i })).toBeInTheDocument();
  });
});
