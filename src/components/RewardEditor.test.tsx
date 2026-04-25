import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RewardEditor } from "./RewardEditor";
import { parseReward } from "../utils/rewards";

function Harness({ initial, missionId = 0, onUpdate }: {
  initial: string[];
  missionId?: number;
  onUpdate?: (rewards: string[]) => void;
}) {
  const [r, setR] = useState<string[]>(initial);
  return (
    <RewardEditor
      rewards={r}
      missionId={missionId}
      onChange={(next) => { setR(next); onUpdate?.(next); }}
    />
  );
}

describe("RewardEditor", () => {
  it("renders one card per reward choice", () => {
    render(<Harness initial={["tp!fix!100;Btn1;1", "nothing;Btn2;2"]} />);
    expect(document.querySelectorAll(".card")).toHaveLength(2);
  });

  it("Add Choice appends a new 'nothing' reward", async () => {
    const onUpdate = vi.fn();
    render(<Harness initial={["nothing;;0"]} onUpdate={onUpdate} />);
    await userEvent.setup().click(screen.getByRole("button", { name: /add choice/i }));
    const last = onUpdate.mock.calls.at(-1)![0] as string[];
    expect(last).toHaveLength(2);
    expect(last[1]).toBe("nothing;;0");
  });

  it("hides the remove button when only one reward remains", () => {
    render(<Harness initial={["nothing;;0"]} />);
    const card = document.querySelector(".card") as HTMLElement;
    expect(within(card).queryByRole("button", { name: "x" })).not.toBeInTheDocument();
  });

  it("shows the remove button when there are at least two rewards and removes the chosen one", async () => {
    const onUpdate = vi.fn();
    render(<Harness initial={["tp!fix!10;A;1", "tp!fix!20;B;1"]} onUpdate={onUpdate} />);
    const cards = document.querySelectorAll(".card");
    // The card-level remove button is the first .danger button inside .card-actions.
    const removeBtn = (cards[1] as HTMLElement).querySelector(".card-actions .danger") as HTMLButtonElement;
    await userEvent.setup().click(removeBtn);
    const last = onUpdate.mock.calls.at(-1)![0] as string[];
    expect(last).toHaveLength(1);
    expect(parseReward(last[0]).buttonName).toBe("A");
  });

  it("editing the next-mission-id input round-trips through parse/serialize", async () => {
    const onUpdate = vi.fn();
    render(<Harness initial={["tp!fix!100;Btn;1"]} onUpdate={onUpdate} />);
    const idInput = screen.getByDisplayValue("1") as HTMLInputElement;
    await userEvent.setup().clear(idInput);
    await userEvent.setup().type(idInput, "5");
    const last = onUpdate.mock.calls.at(-1)![0] as string[];
    expect(parseReward(last[0]).nextMissionId).toBe(5);
  });

  it("changing a TP component's amount updates the serialized reward", async () => {
    const onUpdate = vi.fn();
    render(<Harness initial={["tp!fix!100;Btn;1"]} onUpdate={onUpdate} />);
    const tpAmount = screen.getByDisplayValue("100");
    await userEvent.setup().clear(tpAmount);
    await userEvent.setup().type(tpAmount, "250");
    const last = onUpdate.mock.calls.at(-1)![0] as string[];
    const parsed = parseReward(last[0]);
    expect(parsed.components[0]).toMatchObject({ type: "tp", tpMode: "fix", value: "250" });
  });

  it("changing a TP component's mode updates tpMode without losing the value", async () => {
    const onUpdate = vi.fn();
    render(<Harness initial={["tp!fix!100;Btn;1"]} onUpdate={onUpdate} />);
    // The first <select> is the component type dropdown; the second is the TP mode picker.
    const selects = document.querySelectorAll("select");
    const tpModeSelect = selects[1] as HTMLSelectElement;
    await userEvent.setup().selectOptions(tpModeSelect, "lvlalign");
    const last = onUpdate.mock.calls.at(-1)![0] as string[];
    expect(parseReward(last[0]).components[0]).toMatchObject({
      type: "tp",
      tpMode: "lvlalign",
      value: "100",
    });
  });

  it("switching component type to 'item' loads the item-specific defaults", async () => {
    const onUpdate = vi.fn();
    render(<Harness initial={["nothing;;0"]} onUpdate={onUpdate} />);
    const typeSelect = document.querySelector("select") as HTMLSelectElement;
    await userEvent.setup().selectOptions(typeSelect, "item");
    const last = onUpdate.mock.calls.at(-1)![0] as string[];
    expect(parseReward(last[0]).components[0]).toMatchObject({
      type: "item",
      value: "minecraft:diamond,1",
    });
  });

  it("switching component type to 'align' resets to the +10 default", async () => {
    const onUpdate = vi.fn();
    render(<Harness initial={["nothing;;0"]} onUpdate={onUpdate} />);
    const typeSelect = document.querySelector("select") as HTMLSelectElement;
    await userEvent.setup().selectOptions(typeSelect, "align");
    const last = onUpdate.mock.calls.at(-1)![0] as string[];
    expect(parseReward(last[0]).components[0]).toMatchObject({ type: "align", value: "+10" });
  });

  it("Add component appends an extra component to the chosen reward", async () => {
    const onUpdate = vi.fn();
    render(<Harness initial={["tp!fix!100;Btn;1"]} onUpdate={onUpdate} />);
    // "+ Add Choice" and "+ Add" both match /add/i; the component-level
    // button has the exact "+ Add" label.
    await userEvent.setup().click(screen.getByRole("button", { name: "+ Add" }));
    const last = onUpdate.mock.calls.at(-1)![0] as string[];
    expect(parseReward(last[0]).components).toHaveLength(2);
  });

  it("removing a component preserves the others", async () => {
    const onUpdate = vi.fn();
    render(<Harness initial={["tp!fix!100||align!+10;Btn;1"]} onUpdate={onUpdate} />);
    // Component-row remove buttons live inside .reward-component containers.
    const componentRow = document.querySelectorAll(".reward-component")[1] as HTMLElement;
    const removeBtn = within(componentRow).getByRole("button", { name: /remove/i });
    await userEvent.setup().click(removeBtn);
    const last = onUpdate.mock.calls.at(-1)![0] as string[];
    const parsed = parseReward(last[0]);
    expect(parsed.components).toHaveLength(1);
    expect(parsed.components[0].type).toBe("tp");
  });

  it("opens the reward preset dialog when Presets is clicked and applies its result", async () => {
    const onUpdate = vi.fn();
    render(<Harness initial={["nothing;;0"]} missionId={3} onUpdate={onUpdate} />);
    await userEvent.setup().click(screen.getByRole("button", { name: /presets/i }));

    // Preset dialog renders three template cards in a separate modal.
    const presetCards = document.querySelectorAll(".template-card");
    expect(presetCards.length).toBeGreaterThan(0);

    await userEvent.setup().click(presetCards[0]);
    const last = onUpdate.mock.calls.at(-1)![0] as string[];
    // 3-alignment preset emits exactly three rewards.
    expect(last).toHaveLength(3);
    // Next-mission-id should be missionId + 1 = 4.
    expect(parseReward(last[0]).nextMissionId).toBe(4);
  });
});
