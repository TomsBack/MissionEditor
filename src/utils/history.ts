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
 *
 * Implementation note: state is mirrored in `historyRef` so callbacks can
 * read the latest value synchronously. We only ever pass the new value to
 * `setHistory` (never a functional updater), which keeps things compatible
 * with React Strict Mode's double-invocation of pure updaters.
 */
export function useHistory<T>(initialState: T) {
  const [history, setHistory] = useState<HistoryState<T>>({
    past: [],
    present: initialState,
    future: [],
    pendingCommit: false,
  });

  const historyRef = useRef(history);
  historyRef.current = history;

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const preEditRef = useRef<T | null>(null);

  const commit = useCallback((next: HistoryState<T>) => {
    historyRef.current = next;
    setHistory(next);
  }, []);

  const set = useCallback((newState: T, immediate = false) => {
    const h = historyRef.current;

    if (immediate) {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      const base = preEditRef.current ?? h.present;
      preEditRef.current = null;
      commit({
        past: [...h.past, base].slice(-MAX_HISTORY),
        present: newState,
        future: [],
        pendingCommit: false,
      });
      return;
    }

    if (preEditRef.current === null) {
      preEditRef.current = h.present;
    }
    commit({ ...h, present: newState, future: [], pendingCommit: true });

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      const captured = preEditRef.current;
      if (captured === null) return;
      preEditRef.current = null;
      const cur = historyRef.current;
      commit({
        ...cur,
        past: [...cur.past, captured].slice(-MAX_HISTORY),
        pendingCommit: false,
      });
    }, DEBOUNCE_MS);
  }, [commit]);

  const undo = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    const h = historyRef.current;

    if (preEditRef.current !== null) {
      // Mid-burst: pre-edit snapshot is the real "before" state.
      const captured = preEditRef.current;
      preEditRef.current = null;
      commit({
        past: h.past,
        present: captured,
        future: [h.present, ...h.future],
        pendingCommit: false,
      });
      return;
    }

    if (h.past.length === 0) return;
    const previous = h.past[h.past.length - 1];
    commit({
      past: h.past.slice(0, -1),
      present: previous,
      future: [h.present, ...h.future],
      pendingCommit: false,
    });
  }, [commit]);

  const redo = useCallback(() => {
    const h = historyRef.current;
    if (h.future.length === 0) return;
    const next = h.future[0];
    commit({
      past: [...h.past, h.present],
      present: next,
      future: h.future.slice(1),
      pendingCommit: false,
    });
  }, [commit]);

  const reset = useCallback((newState: T) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    preEditRef.current = null;
    commit({ past: [], present: newState, future: [], pendingCommit: false });
  }, [commit]);

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
