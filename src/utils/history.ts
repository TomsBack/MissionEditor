import { useCallback, useRef, useState } from "react";

interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

const MAX_HISTORY = 100;

/**
 * Undo/redo hook. Returns [state, setState, undo, redo, canUndo, canRedo].
 * setState pushes to history. undo/redo navigate the history stack.
 */
export function useHistory<T>(initialState: T) {
  const [history, setHistory] = useState<HistoryState<T>>({
    past: [],
    present: initialState,
    future: [],
  });

  // Use a ref to debounce rapid changes (typing) into single undo entries
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<T | null>(null);

  const set = useCallback((newState: T, immediate = false) => {
    if (immediate) {
      setHistory((h) => ({
        past: [...h.past, h.present].slice(-MAX_HISTORY),
        present: newState,
        future: [],
      }));
      pendingRef.current = null;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      return;
    }

    // Debounced: batch rapid changes into one undo entry
    pendingRef.current = newState;
    setHistory((h) => ({ ...h, present: newState }));

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setHistory((h) => {
        if (pendingRef.current === null) return h;
        // Find the last committed state (the one before debouncing started)
        const lastCommitted = h.past[h.past.length - 1];
        if (lastCommitted === h.present) return h;
        return {
          past: [...h.past, h.present].slice(-MAX_HISTORY),
          present: h.present,
          future: [],
        };
      });
      pendingRef.current = null;
    }, 500);
  }, []);

  const undo = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    pendingRef.current = null;

    setHistory((h) => {
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
    pendingRef.current = null;
    setHistory({ past: [], present: newState, future: [] });
  }, []);

  return {
    state: history.present,
    set,
    undo,
    redo,
    reset,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
  };
}
