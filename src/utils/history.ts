import { useCallback, useRef, useState } from "react";

interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
  /** True when a debounced edit burst is in progress (pre-edit snapshot exists). */
  pendingCommit: boolean;
}

const MAX_HISTORY = 100;
const DEBOUNCE_MS = 500;

/**
 * Undo/redo hook with debounced batching for rapid changes (e.g. typing).
 *
 * This hook is the single source of truth for the managed state.
 * `set(value)` debounces by default; `set(value, true)` commits immediately.
 */
export function useHistory<T>(initialState: T) {
  const [history, setHistory] = useState<HistoryState<T>>({
    past: [],
    present: initialState,
    future: [],
    pendingCommit: false,
  });

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const preEditRef = useRef<T | null>(null);

  const set = useCallback((newState: T, immediate = false) => {
    if (immediate) {
      // Clear any pending debounce timer
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }

      setHistory((h) => {
        // If there was a pending debounced burst, push the pre-edit snapshot to past
        const base = preEditRef.current ?? h.present;
        preEditRef.current = null;
        return {
          past: [...h.past, base].slice(-MAX_HISTORY),
          present: newState,
          future: [],
          pendingCommit: false,
        };
      });
      return;
    }

    // Debounced path: first change in a burst captures the "before" snapshot
    setHistory((h) => {
      if (preEditRef.current === null) {
        preEditRef.current = h.present;
      }
      return { ...h, present: newState, future: [], pendingCommit: true };
    });

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      setHistory((h) => {
        if (preEditRef.current === null) return h;
        const past = [...h.past, preEditRef.current].slice(-MAX_HISTORY);
        preEditRef.current = null;
        return { ...h, past, pendingCommit: false };
      });
    }, DEBOUNCE_MS);
  }, []);

  const undo = useCallback(() => {
    // Cancel any pending debounce so we get a clean undo
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    setHistory((h) => {
      // If mid-burst, the pre-edit snapshot is the real "before" state.
      // Push it onto past, then pop the top as our new present.
      if (preEditRef.current !== null) {
        const past = [...h.past, preEditRef.current];
        preEditRef.current = null;
        const previous = past[past.length - 1];
        return {
          past: past.slice(0, -1),
          present: previous,
          future: [h.present, ...h.future],
          pendingCommit: false,
        };
      }

      if (h.past.length === 0) return h;
      const previous = h.past[h.past.length - 1];
      return {
        past: h.past.slice(0, -1),
        present: previous,
        future: [h.present, ...h.future],
        pendingCommit: false,
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
        pendingCommit: false,
      };
    });
  }, []);

  const reset = useCallback((newState: T) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    preEditRef.current = null;
    setHistory({ past: [], present: newState, future: [], pendingCommit: false });
  }, []);

  return {
    state: history.present,
    set,
    undo,
    redo,
    reset,
    canUndo: history.past.length > 0 || history.pendingCommit,
    canRedo: history.future.length > 0,
  };
}
