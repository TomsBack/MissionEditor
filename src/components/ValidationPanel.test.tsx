import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ValidationPanel } from "./ValidationPanel";
import type { ValidationWarning } from "../utils/validation";

const warning = (overrides: Partial<ValidationWarning> = {}): ValidationWarning => ({
  level: "warning",
  missionIndex: 0,
  missionId: 0,
  message: "Something to fix",
  ...overrides,
});

describe("ValidationPanel", () => {
  it("renders the empty state when there are no warnings", () => {
    render(<ValidationPanel warnings={[]} onNavigate={() => {}} />);
    // i18n key for the empty state, falls back to English text.
    expect(screen.getByText(/no issues/i)).toBeInTheDocument();
  });

  it("renders each warning with mission id and message", () => {
    render(
      <ValidationPanel
        warnings={[warning({ missionId: 3, message: "Bad reward" })]}
        onNavigate={() => {}}
      />,
    );
    expect(screen.getByText("#3")).toBeInTheDocument();
    expect(screen.getByText("Bad reward")).toBeInTheDocument();
  });

  it("uses singular vs plural counts based on level totals", () => {
    render(
      <ValidationPanel
        warnings={[
          warning({ level: "error", message: "e1" }),
          warning({ level: "error", message: "e2" }),
          warning({ level: "warning", message: "w1" }),
        ]}
        onNavigate={() => {}}
      />,
    );
    expect(screen.getByText(/2 errors/i)).toBeInTheDocument();
    expect(screen.getByText(/1 warning(?!s)/i)).toBeInTheDocument();
  });

  it("uses the singular label when there is exactly one error", () => {
    render(
      <ValidationPanel
        warnings={[warning({ level: "error", message: "e" })]}
        onNavigate={() => {}}
      />,
    );
    expect(screen.getByText(/1 error(?!s)/i)).toBeInTheDocument();
  });

  it("calls onNavigate with the mission index when a clickable item is clicked", async () => {
    const onNavigate = vi.fn();
    render(
      <ValidationPanel
        warnings={[warning({ missionIndex: 2, missionId: 7, message: "Click me" })]}
        onNavigate={onNavigate}
      />,
    );
    await userEvent.setup().click(screen.getByText("Click me"));
    expect(onNavigate).toHaveBeenCalledWith(2);
  });

  it("does not navigate for bundle-level warnings (missionIndex < 0)", async () => {
    const onNavigate = vi.fn();
    render(
      <ValidationPanel
        warnings={[warning({ missionIndex: -1, missionId: -1, message: "Bundle has no name" })]}
        onNavigate={onNavigate}
      />,
    );
    await userEvent.setup().click(screen.getByText("Bundle has no name"));
    expect(onNavigate).not.toHaveBeenCalled();
  });

  it("renders error and warning icons distinctly", () => {
    const { container } = render(
      <ValidationPanel
        warnings={[
          warning({ level: "error", message: "boom" }),
          warning({ level: "warning", message: "meh" }),
        ]}
        onNavigate={() => {}}
      />,
    );
    expect(container.querySelector(".validation-icon.error")).toBeInTheDocument();
    expect(container.querySelector(".validation-icon.warning")).toBeInTheDocument();
  });
});
