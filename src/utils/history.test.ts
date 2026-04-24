import { describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useHistory } from "./history";

describe("useHistory", () => {
  it("starts with no undo/redo available", () => {
    const { result } = renderHook(() => useHistory("a"));
    expect(result.current.state).toBe("a");
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it("commits immediate sets to past", () => {
    const { result } = renderHook(() => useHistory("a"));
    act(() => result.current.set("b", true));
    expect(result.current.state).toBe("b");
    expect(result.current.canUndo).toBe(true);

    act(() => result.current.undo());
    expect(result.current.state).toBe("a");
    expect(result.current.canRedo).toBe(true);
  });

  it("debounces rapid burst writes into a single undo step", async () => {
    vi.useFakeTimers();
    try {
      const { result } = renderHook(() => useHistory("a"));
      act(() => result.current.set("ab"));
      act(() => result.current.set("abc"));
      act(() => result.current.set("abcd"));

      // Mid-burst, canUndo is on (pending commit) but state is the latest.
      expect(result.current.state).toBe("abcd");
      expect(result.current.canUndo).toBe(true);

      act(() => vi.advanceTimersByTime(600));

      // Single undo restores the pre-burst snapshot.
      act(() => result.current.undo());
      expect(result.current.state).toBe("a");
    } finally {
      vi.useRealTimers();
    }
  });

  it("undo mid-burst restores the pre-burst snapshot without waiting", () => {
    vi.useFakeTimers();
    try {
      const { result } = renderHook(() => useHistory("a"));
      act(() => result.current.set("ab"));
      act(() => result.current.set("abc"));

      // No timer flush here; undo straight away.
      act(() => result.current.undo());
      expect(result.current.state).toBe("a");
      expect(result.current.canRedo).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it("redo replays an undone state", () => {
    const { result } = renderHook(() => useHistory("a"));
    act(() => result.current.set("b", true));
    act(() => result.current.undo());
    act(() => result.current.redo());
    expect(result.current.state).toBe("b");
    expect(result.current.canRedo).toBe(false);
  });

  it("clears redo stack on a new edit", () => {
    const { result } = renderHook(() => useHistory("a"));
    act(() => result.current.set("b", true));
    act(() => result.current.undo());
    expect(result.current.canRedo).toBe(true);

    act(() => result.current.set("c", true));
    expect(result.current.canRedo).toBe(false);
    expect(result.current.state).toBe("c");
  });

  it("reset wipes history and pending burst", () => {
    vi.useFakeTimers();
    try {
      const { result } = renderHook(() => useHistory("a"));
      act(() => result.current.set("b"));
      act(() => result.current.reset("z"));
      expect(result.current.state).toBe("z");
      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);

      // Timer firing after reset must not push anything to past.
      act(() => vi.advanceTimersByTime(600));
      expect(result.current.canUndo).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });
});
