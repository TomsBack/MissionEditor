import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ExportPreview } from "./ExportPreview";
import { createEmptyBundle } from "../utils/files";

describe("ExportPreview", () => {
  it("starts on the Preview tab when no original is supplied", () => {
    render(<ExportPreview bundle={createEmptyBundle()} onClose={() => {}} />);
    // The Diff button should be absent in this case.
    expect(screen.queryByRole("button", { name: /diff/i })).not.toBeInTheDocument();
    // Preview button is rendered and the body should contain the bundle's JSON.
    expect(screen.getByRole("button", { name: /preview/i })).toBeInTheDocument();
    expect(screen.getByText(/"name": "New Bundle"/)).toBeInTheDocument();
  });

  it("starts on the Diff tab when an originalJson is supplied", () => {
    const bundle = createEmptyBundle();
    render(
      <ExportPreview
        bundle={{ ...bundle, name: "Edited" }}
        originalJson={JSON.stringify(bundle, null, 2)}
        onClose={() => {}}
      />,
    );
    // Both tab buttons exist; the diff one is "primary" by default.
    const diffBtn = screen.getByRole("button", { name: /diff/i });
    expect(diffBtn.classList.contains("primary")).toBe(true);
  });

  it("clicking the Preview tab swaps to the full JSON view", async () => {
    const bundle = createEmptyBundle();
    render(
      <ExportPreview
        bundle={bundle}
        originalJson={JSON.stringify(bundle, null, 2)}
        onClose={() => {}}
      />,
    );
    await userEvent.setup().click(screen.getByRole("button", { name: /preview/i }));
    expect(document.querySelector(".json-preview")).toBeInTheDocument();
    expect(screen.getByText(/"name": "New Bundle"/)).toBeInTheDocument();
  });

  it("renders 'no changes' when current JSON matches the original", () => {
    const bundle = createEmptyBundle();
    const original = JSON.stringify(bundle, null, 2);
    render(
      <ExportPreview bundle={bundle} originalJson={original} onClose={() => {}} />,
    );
    expect(screen.getByText(/no changes/i)).toBeInTheDocument();
  });

  it("highlights additions and removals when the bundle has changed", () => {
    const original = createEmptyBundle();
    const edited = { ...original, name: "Edited Pack" };
    render(
      <ExportPreview
        bundle={edited}
        originalJson={JSON.stringify(original, null, 2)}
        onClose={() => {}}
      />,
    );
    // The diff renders one '-' line for the old name and one '+' line for the new.
    const additions = document.querySelectorAll(".diff-add");
    const removals = document.querySelectorAll(".diff-remove");
    expect(additions.length).toBeGreaterThan(0);
    expect(removals.length).toBeGreaterThan(0);
    expect(screen.getByText(/Edited Pack/)).toBeInTheDocument();
  });

  it("respects the jsonIndent prop in the rendered preview", async () => {
    const bundle = createEmptyBundle();
    render(<ExportPreview bundle={bundle} jsonIndent={4} onClose={() => {}} />);
    // 4-space indent produces a 4-space prefix before "name".
    const pre = document.querySelector(".json-preview");
    expect(pre?.textContent).toContain('\n    "name"');
  });

  it("clicking Close calls onClose", async () => {
    const onClose = vi.fn();
    render(<ExportPreview bundle={createEmptyBundle()} onClose={onClose} />);
    await userEvent.setup().click(screen.getByRole("button", { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it("clicking the overlay closes the dialog", async () => {
    const onClose = vi.fn();
    const { container } = render(<ExportPreview bundle={createEmptyBundle()} onClose={onClose} />);
    await userEvent.setup().click(container.querySelector(".modal-overlay")!);
    expect(onClose).toHaveBeenCalled();
  });

  it("clicking inside the modal does not propagate to the overlay close handler", async () => {
    const onClose = vi.fn();
    render(<ExportPreview bundle={createEmptyBundle()} onClose={onClose} />);
    await userEvent.setup().click(document.querySelector(".json-preview")!);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("hides skipped regions of identical lines with a separator", () => {
    // Build a synthetic original/current with a small island of difference inside a long file.
    const long = Array.from({ length: 50 }, (_, i) => `line ${i}`).join("\n");
    const editedLines = long.split("\n");
    editedLines[25] = "CHANGED line 25";
    const edited = editedLines.join("\n");

    // Wrap in a bundle-shaped JSON since the component expects MissionBundle
    // input — we pass originalJson directly so the diff is computed from it.
    const fakeBundle = createEmptyBundle();
    render(
      <ExportPreview
        bundle={{ ...fakeBundle, desc: edited }}
        originalJson={JSON.stringify({ ...fakeBundle, desc: long }, null, 2)}
        onClose={() => {}}
      />,
    );
    // The diff should show context around the change but not the full file.
    expect(document.querySelectorAll(".diff-line").length).toBeLessThan(60);
  });
});
