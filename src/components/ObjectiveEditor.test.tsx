import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ObjectiveEditor } from "./ObjectiveEditor";

/** Stateful wrapper since ObjectiveEditor is fully controlled. */
function Harness({ initial, onUpdate, ...rest }: {
  initial: string[];
  onUpdate?: (objs: string[]) => void;
  translated?: boolean;
  showHints?: boolean;
  showAdvancedFields?: boolean;
  plConfig?: { conStatInc: number; bpModeSquared: boolean } | null;
}) {
  const [objs, setObjs] = useState<string[]>(initial);
  return (
    <ObjectiveEditor
      objectives={objs}
      onChange={(next) => { setObjs(next); onUpdate?.(next); }}
      {...rest}
    />
  );
}

describe("ObjectiveEditor", () => {
  it("renders one card per objective", () => {
    render(<Harness initial={["start", "kill;NZombie;H100;A10"]} />);
    const cards = document.querySelectorAll(".card");
    expect(cards.length).toBe(2);
  });

  it("the first card is the action header (no remove button)", () => {
    render(<Harness initial={["start", "kill;NZombie;H100;A10"]} />);
    const cards = document.querySelectorAll(".card");
    const firstCard = cards[0] as HTMLElement;
    // Remove button is rendered for non-first objectives only.
    expect(within(firstCard).queryByTitle(/remove/i)).not.toBeInTheDocument();
    // Action label is rendered for the first card.
    expect(within(firstCard).getByText(/action/i)).toBeInTheDocument();
  });

  it("the first card's type select is restricted to the four button types", () => {
    render(<Harness initial={["start"]} />);
    const select = document.querySelector(".card select") as HTMLSelectElement;
    const values = Array.from(select.options).map((o) => o.value);
    expect(values).toEqual(["next", "start", "skip", "restart"]);
  });

  it("Add Objective appends a new kill template", async () => {
    const onUpdate = vi.fn();
    render(<Harness initial={["start"]} onUpdate={onUpdate} />);
    await userEvent.setup().click(screen.getByRole("button", { name: /add objective/i }));
    const last = onUpdate.mock.calls.at(-1)![0] as string[];
    expect(last).toHaveLength(2);
    expect(last[1]).toBe("kill;N;H100;A50");
  });

  it("removes a non-first objective when its delete button is clicked", async () => {
    const onUpdate = vi.fn();
    render(<Harness initial={["start", "kill;NZombie;H100", "kill;NSkeleton;H50"]} onUpdate={onUpdate} />);
    const cards = document.querySelectorAll(".card");
    const removeBtn = within(cards[1] as HTMLElement).getByTitle(/remove/i);
    await userEvent.setup().click(removeBtn);
    const last = onUpdate.mock.calls.at(-1)![0] as string[];
    expect(last).toHaveLength(2);
    expect(last[1]).toContain("Skeleton");
  });

  it("ignores remove on the first (action) card", async () => {
    const onUpdate = vi.fn();
    // First card has no remove button, so this test confirms the missing-button is the protection.
    render(<Harness initial={["start"]} onUpdate={onUpdate} />);
    const firstCard = document.querySelector(".card") as HTMLElement;
    expect(within(firstCard).queryByTitle(/remove/i)).not.toBeInTheDocument();
  });

  it("moves a non-first objective up when ^ is clicked", async () => {
    const onUpdate = vi.fn();
    render(<Harness initial={["start", "kill;NA", "kill;NB", "kill;NC"]} onUpdate={onUpdate} />);
    const cards = document.querySelectorAll(".card");
    const upBtn = within(cards[2] as HTMLElement).getByTitle(/move up/i);
    await userEvent.setup().click(upBtn);
    const last = onUpdate.mock.calls.at(-1)![0] as string[];
    expect(last[1]).toContain("NB");
    expect(last[2]).toContain("NA");
  });

  it("moves a non-first objective down when v is clicked", async () => {
    const onUpdate = vi.fn();
    render(<Harness initial={["start", "kill;NA", "kill;NB", "kill;NC"]} onUpdate={onUpdate} />);
    const cards = document.querySelectorAll(".card");
    const downBtn = within(cards[1] as HTMLElement).getByTitle(/move down/i);
    await userEvent.setup().click(downBtn);
    const last = onUpdate.mock.calls.at(-1)![0] as string[];
    expect(last[1]).toContain("NB");
    expect(last[2]).toContain("NA");
  });

  it("won't move below the action card or past the end", async () => {
    const onUpdate = vi.fn();
    render(<Harness initial={["start", "kill;NA", "kill;NB"]} onUpdate={onUpdate} />);
    const cards = document.querySelectorAll(".card");
    // Moving the first non-action card up would land it on the action slot — must be a no-op.
    await userEvent.setup().click(within(cards[1] as HTMLElement).getByTitle(/move up/i));
    // Moving the last card down has no further index — must be a no-op.
    await userEvent.setup().click(within(cards[2] as HTMLElement).getByTitle(/move down/i));
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it("editing a kill objective's health field re-serialises through the parser", async () => {
    const onUpdate = vi.fn();
    render(<Harness initial={["start", "kill;NZombie;H100;A10"]} onUpdate={onUpdate} />);
    const healthInput = screen.getByDisplayValue("100");
    await userEvent.setup().clear(healthInput);
    await userEvent.setup().type(healthInput, "250");
    const last = onUpdate.mock.calls.at(-1)![0] as string[];
    // Round-trip through the parser must preserve the entity name and surface the new health.
    expect(last[1]).toContain("NZombie");
    expect(last[1]).toContain("H250");
  });

  it("changing the objective type rewrites the row to the new type", async () => {
    const onUpdate = vi.fn();
    render(<Harness initial={["start", "kill;NZombie;H100"]} onUpdate={onUpdate} />);
    // The header's type select is the first <select> inside the card; advanced
    // kill fields add a second one (protect mode), so we can't use getByRole.
    const cards = document.querySelectorAll(".card");
    const typeSelect = (cards[1] as HTMLElement).querySelector(".card-header select") as HTMLSelectElement;
    await userEvent.setup().selectOptions(typeSelect, "biome");
    const last = onUpdate.mock.calls.at(-1)![0] as string[];
    expect(last[1].startsWith("biome")).toBe(true);
  });

  it("hides advanced fields by default and shows them when the prop is on", () => {
    const { rerender } = render(<Harness initial={["start", "kill;NZombie;H100"]} showAdvancedFields={false} />);
    expect(screen.queryByText(/spawn message/i)).not.toBeInTheDocument();

    rerender(
      <ObjectiveEditor
        objectives={["start", "kill;NZombie;H100"]}
        onChange={() => {}}
        showAdvancedFields={true}
      />,
    );
    expect(screen.getByText(/spawn message/i)).toBeInTheDocument();
  });

  it("renders the power-level badge for kill objectives when plConfig is provided", () => {
    render(
      <Harness
        initial={["start", "kill;NZombie;H100;A10"]}
        plConfig={{ conStatInc: 0.5, bpModeSquared: false }}
      />,
    );
    expect(document.querySelector(".pl-badge")).toBeInTheDocument();
  });

  it("hides the power-level badge for non-kill objectives", () => {
    render(
      <Harness
        initial={["start", "biome;NPlains"]}
        plConfig={{ conStatInc: 0.5, bpModeSquared: false }}
      />,
    );
    expect(document.querySelector(".pl-badge")).not.toBeInTheDocument();
  });

  it("hides the power-level badge when plConfig is null", () => {
    render(
      <Harness initial={["start", "kill;NZombie;H100;A10"]} plConfig={null} />,
    );
    expect(document.querySelector(".pl-badge")).not.toBeInTheDocument();
  });
});
