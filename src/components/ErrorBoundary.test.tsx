import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ErrorBoundary } from "./ErrorBoundary";

function Boom({ message = "kaboom" }: { message?: string }): never {
  throw new Error(message);
}

describe("ErrorBoundary", () => {
  it("renders children when nothing throws", () => {
    render(
      <ErrorBoundary>
        <div>safe content</div>
      </ErrorBoundary>,
    );
    expect(screen.getByText("safe content")).toBeInTheDocument();
  });

  it("renders the fallback when a child throws and reports the error", () => {
    // React logs the boundary catch; silence it here.
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <Boom message="render failure" />
      </ErrorBoundary>,
    );
    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    expect(screen.getByText(/render failure/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /clear data and reload/i })).toBeInTheDocument();
    errorSpy.mockRestore();
  });

});
