import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TemplateDialog, RewardPresetDialog } from "./TemplateDialog";
import { MISSION_TEMPLATES } from "../utils/templates";
import { parseReward } from "../utils/rewards";

describe("TemplateDialog", () => {
  it("renders a card for every registered template", () => {
    render(<TemplateDialog nextId={0} onSelect={() => {}} onClose={() => {}} />);
    for (const tpl of MISSION_TEMPLATES) {
      expect(screen.getByText(tpl.name)).toBeInTheDocument();
      expect(screen.getByText(tpl.description)).toBeInTheDocument();
    }
  });

  it("emits the chosen template's mission with the supplied next id and closes", async () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();
    render(<TemplateDialog nextId={42} onSelect={onSelect} onClose={onClose} />);

    await userEvent.setup().click(screen.getByText("Empty"));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect.mock.calls[0][0].id).toBe(42);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("clicking the overlay closes without selecting", async () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();
    const { container } = render(<TemplateDialog nextId={0} onSelect={onSelect} onClose={onClose} />);
    await userEvent.setup().click(container.querySelector(".modal-overlay")!);
    expect(onClose).toHaveBeenCalled();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("clicking inside the modal does not bubble up to close", async () => {
    const onClose = vi.fn();
    render(<TemplateDialog nextId={0} onSelect={() => {}} onClose={onClose} />);
    await userEvent.setup().click(screen.getByText(MISSION_TEMPLATES[0].description));
    // Selecting a card triggers exactly one onClose; the click on the modal body itself shouldn't add a second.
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("RewardPresetDialog", () => {
  it("renders three presets and applies the chosen one's rewards with the given nextMissionId", async () => {
    const onApply = vi.fn();
    const onClose = vi.fn();
    render(<RewardPresetDialog nextMissionId={5} onApply={onApply} onClose={onClose} />);

    // Three preset cards
    const cards = document.querySelectorAll(".template-card");
    expect(cards.length).toBe(3);

    // Click the first preset (3-Align TP Fixed)
    await userEvent.setup().click(cards[0]);
    expect(onApply).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);

    const rewards = onApply.mock.calls[0][0] as string[];
    expect(rewards).toHaveLength(3);
    for (const raw of rewards) {
      expect(parseReward(raw).nextMissionId).toBe(5);
    }
  });

  it("emits a single 'nothing' reward when the transition preset is picked", async () => {
    const onApply = vi.fn();
    const onClose = vi.fn();
    render(<RewardPresetDialog nextMissionId={9} onApply={onApply} onClose={onClose} />);

    const cards = document.querySelectorAll(".template-card");
    // Last preset is the "nothing" transition.
    await userEvent.setup().click(cards[cards.length - 1]);
    const rewards = onApply.mock.calls[0][0] as string[];
    expect(rewards).toHaveLength(1);
    expect(parseReward(rewards[0]).components[0].type).toBe("nothing");
    expect(parseReward(rewards[0]).nextMissionId).toBe(9);
  });
});
