import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SettingsDialog } from "./SettingsDialog";
import { loadSettings, type EditorSettings } from "../utils/settings";
import { THEMES, type ThemeName } from "../utils/theme";

/** Stateful wrapper since SettingsDialog is fully controlled. */
function Harness({ onChange }: { onChange?: (s: EditorSettings) => void }) {
  const [s, setS] = useState<EditorSettings>(loadSettings());
  return (
    <SettingsDialog
      settings={s}
      onChange={(next) => { setS(next); onChange?.(next); }}
      onClose={() => {}}
    />
  );
}

describe("SettingsDialog navigation", () => {
  it("starts on the Appearance tab and shows the theme picker", () => {
    render(<Harness />);
    // Theme cards render their swatch grid; querying by class is the most robust.
    const cards = document.querySelectorAll(".theme-card");
    expect(cards.length).toBe(Object.keys(THEMES).length);
  });

  it("switches to General when its nav button is clicked", async () => {
    render(<Harness />);
    const nav = screen.getByRole("button", { name: /general/i });
    await userEvent.setup().click(nav);
    expect(screen.getByText(/display language/i)).toBeInTheDocument();
  });

  it("switches to Editor when its nav button is clicked", async () => {
    render(<Harness />);
    await userEvent.setup().click(screen.getByRole("button", { name: /^editor$/i }));
    // Power-level hint label is unique to the Editor tab.
    expect(screen.getByText(/HP per attribute point/i)).toBeInTheDocument();
  });
});

describe("Theme picker", () => {
  it("marks the currently-selected theme card with aria-checked and a 'selected' class", () => {
    render(<Harness />);
    const cards = Array.from(document.querySelectorAll(".theme-card"));
    const selected = cards.filter((c) => c.classList.contains("selected"));
    expect(selected).toHaveLength(1);
    expect(selected[0].getAttribute("aria-checked")).toBe("true");
  });

  it("clicking a card switches the theme", async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    const cards = Array.from(document.querySelectorAll(".theme-card"));
    // Find a card that is NOT currently selected.
    const target = cards.find((c) => !c.classList.contains("selected"))!;
    await userEvent.setup().click(target);

    const last = onChange.mock.calls.at(-1)![0] as EditorSettings;
    // The new theme must be one of the registered names.
    expect(Object.keys(THEMES) as ThemeName[]).toContain(last.theme);
    // And it must differ from the dark default.
    expect(last.theme).not.toBe("dark");
  });

  it("renders one swatch span per palette key (4 swatches per card)", () => {
    render(<Harness />);
    const card = document.querySelector(".theme-card")!;
    const swatchSpans = card.querySelectorAll(".theme-card-swatch span");
    expect(swatchSpans.length).toBe(4);
  });
});

describe("Toggle controls", () => {
  it("toggling 'Compact mode' propagates the new value", async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    const checkbox = screen.getByLabelText(/compact mode/i) as HTMLInputElement;
    expect(checkbox.checked).toBe(false);
    await userEvent.setup().click(checkbox);
    const last = onChange.mock.calls.at(-1)![0] as EditorSettings;
    expect(last.compactMode).toBe(true);
  });

  it("toggling 'Enable auto-save' updates the setting and disables the interval input", async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    await userEvent.setup().click(screen.getByRole("button", { name: /general/i }));

    const enable = screen.getByLabelText(/enable auto-save/i) as HTMLInputElement;
    expect(enable.checked).toBe(true);
    await userEvent.setup().click(enable);

    const last = onChange.mock.calls.at(-1)![0] as EditorSettings;
    expect(last.autoSaveEnabled).toBe(false);

    // The interval NumberInput should reflect the disabled state.
    const intervalSection = enable.closest(".settings-section")!;
    const interval = within(intervalSection as HTMLElement).getByRole("spinbutton") as HTMLInputElement;
    expect(interval.disabled).toBe(true);
  });

  it("changing the JSON indent input propagates a new number", async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    await userEvent.setup().click(screen.getByRole("button", { name: /^editor$/i }));

    // jsonIndent defaults to 2; locate the input within the Export section.
    const exportLabel = screen.getByText(/json indent spaces/i);
    const indent = exportLabel.parentElement!.querySelector('input[type="number"]') as HTMLInputElement;
    await userEvent.setup().clear(indent);
    await userEvent.setup().type(indent, "4");
    const last = onChange.mock.calls.at(-1)![0] as EditorSettings;
    expect(last.jsonIndent).toBe(4);
  });

  it("changing default alignment to 'evil' propagates", async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    await userEvent.setup().click(screen.getByRole("button", { name: /general/i }));

    // The alignment select is the one whose options are good/neutral/evil.
    const selects = Array.from(document.querySelectorAll("select")) as HTMLSelectElement[];
    const alignSelect = selects.find((s) => Array.from(s.options).some((o) => o.value === "evil"))!;
    await userEvent.setup().selectOptions(alignSelect, "evil");

    const last = onChange.mock.calls.at(-1)![0] as EditorSettings;
    expect(last.defaultAlignment).toBe("evil");
  });
});

describe("Power-level controls", () => {
  it("disables the conStatInc input when the feature is off", async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    await userEvent.setup().click(screen.getByRole("button", { name: /^editor$/i }));

    const showCheckbox = screen.getByLabelText(/show estimated power level/i) as HTMLInputElement;
    expect(showCheckbox.checked).toBe(true);
    await userEvent.setup().click(showCheckbox);

    const last = onChange.mock.calls.at(-1)![0] as EditorSettings;
    expect(last.showPowerLevelHint).toBe(false);

    // The CON/HP input should now be disabled.
    const conInput = screen.getByDisplayValue("0.5") as HTMLInputElement;
    expect(conInput.disabled).toBe(true);
  });
});
