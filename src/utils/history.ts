import { useCallback, useRef, useState } from "react";

interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

const MAX_HISTORY = 100;

/**
 * Undo/redo hook with debounced batching for rapid changes (e.g. typing).
 * `set(value)` debounces by default. `set(value, true)` commits immediately.
 */
export function useHistory<T>(initialState: T) {
  const [history, setHistory] = useState<HistoryState<T>>({
    past: [],
    present: initialState,
    future: [],
  });

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Tracks the state before debounced edits started, so we can push it to past
  const preEditRef = useRef<T | null>(null);

  const set = useCallback((newState: T, immediate = false) => {
    if (immediate) {
      // Flush any pending debounce
      if (debounceRef.current) clearTimeout(debounceRef.current);
      preEditRef.current = null;

      setHistory((h) => ({
        past: [...h.past, h.present].slice(-MAX_HISTORY),
        present: newState,
        future: [],
      }));
      return;
    }

    // Debounced: first change in a burst saves the "before" state
    setHistory((h) => {
      if (preEditRef.current === null) {
        preEditRef.current = h.present;
      }
      return { ...h, present: newState, future: [] };
    });

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      // Commit: push the pre-edit state to past
      setHistory((h) => {
        if (preEditRef.current === null) return h;
        const past = [...h.past, preEditRef.current].slice(-MAX_HISTORY);
        preEditRef.current = null;
        return { ...h, past };
      });
    }, 500);
  }, []);

  const undo = useCallback(() => {
    // Flush pending debounce before undoing
    if (debounceRef.current) clearTimeout(debounceRef.current);

    setHistory((h) => {
      // If we have a pre-edit snapshot, use it as the "before" entry
      if (preEditRef.current !== null) {
        const past = [...h.past, preEditRef.current];
        preEditRef.current = null;
        const previous = past[past.length - 1];
        return {
          past: past.slice(0, -1),
          present: previous,
          future: [h.present, ...h.future],
        };
      }

      if (h.past.length === 0) return h;
      const previous = h.past[h.past.length - 1];
      return {
        past: h.past.slice(0, -1),
        present: previous,
        future: [h.present, ...h.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory((h) => {
      if (h.future.length === 0) return h;
      const next = h.future[0];
      return {
        past: [...h.past, h.present],
        present: next,
        future: h.future.slice(1),
      };
    });
  }, []);

  const reset = useCallback((newState: T) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    preEditRef.current = null;
    setHistory({ past: [], present: newState, future: [] });
  }, []);

  return {
    state: history.present,
    set,
    undo,
    redo,
    reset,
    canUndo: history.past.length > 0 || preEditRef.current !== null,
    canRedo: history.future.length > 0,
  };
}
