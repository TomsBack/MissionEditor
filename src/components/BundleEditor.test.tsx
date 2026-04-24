import { describe, expect, it } from "vitest";
import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BundleEditor } from "./BundleEditor";
import { createEmptyBundle } from "../utils/files";
import type { MissionBundle } from "../types/mission";

/** Stateful wrapper: BundleEditor is controlled, so tests need real two-way binding. */
function Wrapper({ initial, onUpdate }: { initial?: Partial<MissionBundle>; onUpdate?: (b: MissionBundle) => void }) {
  const [b, setB] = useState<MissionBundle>({ ...createEmptyBundle(), ...initial });
  return (
    <BundleEditor
      bundle={b}
      onChange={(next) => { setB(next); onUpdate?.(next); }}
    />
  );
}

describe("BundleEditor", () => {
  it("renders all top-level bundle fields with current values", () => {
    render(
      <Wrapper initial={{ name: "My Pack", version: "2.5", authors: "Alice, Bob", mods: "dbc", desc: "desc" }} />,
    );
    expect(screen.getByDisplayValue("My Pack")).toBeInTheDocument();
    expect(screen.getByDisplayValue("2.5")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Alice, Bob")).toBeInTheDocument();
    expect(screen.getByDisplayValue("dbc")).toBeInTheDocument();
    expect(screen.getByDisplayValue("desc")).toBeInTheDocument();
  });

  it("propagates name edits", async () => {
    let latest: MissionBundle | undefined;
    render(<Wrapper initial={{ name: "Old" }} onUpdate={(b) => { latest = b; }} />);
    const input = screen.getByDisplayValue("Old");
    await userEvent.setup().clear(input);
    await userEvent.setup().type(input, "New");
    expect(latest!.name).toBe("New");
  });

  it("merges settings edits without disturbing top-level fields", async () => {
    let latest: MissionBundle | undefined;
    render(<Wrapper onUpdate={(b) => { latest = b; }} />);
    const repeat = screen.getByDisplayValue("-1");
    await userEvent.setup().clear(repeat);
    await userEvent.setup().type(repeat, "7");
    expect(latest!.settings.repeat).toBe("7");
    expect(latest!.name).toBe("New Bundle"); // default from createEmptyBundle
    expect(latest!.settings.unlock).toBe(""); // other settings preserved
  });

  it("updates the description textarea", async () => {
    let latest: MissionBundle | undefined;
    render(<Wrapper initial={{ desc: "" }} onUpdate={(b) => { latest = b; }} />);
    // Description is a <textarea>; rows=2 lets us identify it among textboxes.
    const textarea = document.querySelector("textarea") as HTMLTextAreaElement;
    expect(textarea).not.toBeNull();
    await userEvent.setup().type(textarea, "Hi");
    expect(latest!.desc).toBe("Hi");
  });

  it("never mutates the input bundle prop", async () => {
    const original = createEmptyBundle();
    const snapshot = JSON.parse(JSON.stringify(original));
    render(<BundleEditor bundle={original} onChange={() => {}} />);
    const input = screen.getByDisplayValue("New Bundle");
    await userEvent.setup().type(input, "!");
    expect(original).toEqual(snapshot);
  });
});
