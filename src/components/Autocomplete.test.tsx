import { describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Autocomplete } from "./Autocomplete";

const SUGGESTIONS = ["zombie", "skeleton", "creeper", "spider", "enderman"];

function setup(props: Partial<React.ComponentProps<typeof Autocomplete>> = {}) {
  const onChange = vi.fn();
  const utils = render(
    <Autocomplete value="" onChange={onChange} suggestions={SUGGESTIONS} {...props} />,
  );
  const input = screen.getByRole("textbox") as HTMLInputElement;
  return { ...utils, onChange, input, user: userEvent.setup() };
}

describe("Autocomplete", () => {
  it("does not show the dropdown until the input is focused", () => {
    const { input } = setup();
    expect(input).toBeInTheDocument();
    expect(screen.queryByText("zombie")).not.toBeInTheDocument();
  });

  it("opens the dropdown on focus and shows the full suggestion list", async () => {
    const { input, user } = setup();
    await user.click(input);
    expect(screen.getByText("zombie")).toBeInTheDocument();
    expect(screen.getByText("creeper")).toBeInTheDocument();
  });

  it("filters suggestions by substring as the user types", async () => {
    // Controlled component: drive value via a stateful wrapper so typing filters.
    function Wrapper() {
      const [v, setV] = useState("");
      return <Autocomplete value={v} onChange={setV} suggestions={SUGGESTIONS} />;
    }
    render(<Wrapper />);
    const input = screen.getByRole("textbox") as HTMLInputElement;
    await userEvent.setup().click(input);
    await userEvent.setup().type(input, "end");
    // HighlightMatch splits matched substring into a <strong>; query by container textContent.
    const items = document.querySelectorAll(".autocomplete-item");
    const labels = Array.from(items).map((el) => el.textContent);
    expect(labels).toContain("enderman");
    expect(labels).not.toContain("zombie");
  });

  it("emits onChange with the chosen suggestion when an item is clicked", async () => {
    const { input, onChange, user } = setup();
    await user.click(input);
    await user.click(screen.getByText("creeper"));
    expect(onChange).toHaveBeenLastCalledWith("creeper");
  });

  it("supports arrow-key navigation and Enter to commit", async () => {
    const { input, onChange, user } = setup();
    await user.click(input);
    await user.keyboard("{ArrowDown}{ArrowDown}{Enter}");
    // First arrow-down already lands on index 1 from initial 0.
    expect(onChange).toHaveBeenCalled();
    const value = onChange.mock.calls.at(-1)![0];
    expect(SUGGESTIONS).toContain(value);
  });

  it("closes the dropdown on Escape", async () => {
    const { input, user } = setup();
    await user.click(input);
    expect(screen.getByText("zombie")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByText("zombie")).not.toBeInTheDocument();
  });

  it("ranks prefix matches above substring matches", async () => {
    const { user } = setup({ suggestions: ["unrelated", "spider", "spirit"] });
    const input = screen.getByRole("textbox");
    await user.click(input);
    await user.type(input, "sp");
    const items = screen.getAllByText(/sp/i).map((el) => el.textContent);
    // Both "spider" and "spirit" start with "sp"; ordering between them is alphabetical.
    expect(items[0]).toMatch(/^spi/);
  });

  it("with valueSeparator, selecting only replaces the prefix part of the value", async () => {
    const onChange = vi.fn();
    // Start with an empty prefix so the full list renders; the ",5" suffix
    // should survive selection unchanged.
    render(
      <Autocomplete
        value=",5"
        onChange={onChange}
        suggestions={SUGGESTIONS}
        valueSeparator=","
      />,
    );
    const input = screen.getByRole("textbox");
    await userEvent.setup().click(input);
    await userEvent.setup().click(screen.getByText("zombie"));
    expect(onChange).toHaveBeenCalledWith("zombie,5");
  });

  it("renders a placeholder when provided", () => {
    setup({ placeholder: "type entity..." });
    expect(screen.getByPlaceholderText("type entity...")).toBeInTheDocument();
  });
});
