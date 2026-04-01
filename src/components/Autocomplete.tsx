import { useState, useRef, useEffect, useMemo } from "react";

interface AutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
  /** If set, only autocomplete the portion before this separator (e.g. "," for "item,count") */
  valueSeparator?: string;
}

export function Autocomplete({ value, onChange, suggestions, placeholder, valueSeparator }: AutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Extract the portion of value to match against
  const searchText = valueSeparator
    ? value.split(valueSeparator)[0]
    : value;

  const filtered = useMemo(() => {
    const lower = searchText.toLowerCase();
    if (!lower) return suggestions.slice(0, 20);
    return suggestions
      .filter((s) => s.toLowerCase().includes(lower))
      .sort((a, b) => {
        const aStarts = a.toLowerCase().startsWith(lower) ? 0 : 1;
        const bStarts = b.toLowerCase().startsWith(lower) ? 0 : 1;
        return aStarts - bStarts || a.localeCompare(b);
      })
      .slice(0, 20);
  }, [searchText, suggestions]);

  // Reset highlight when filtered list changes
  useEffect(() => {
    setHighlightIndex(0);
  }, [filtered]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (!listRef.current) return;
    const item = listRef.current.children[highlightIndex] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [highlightIndex]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function selectSuggestion(suggestion: string) {
    if (valueSeparator) {
      const parts = value.split(valueSeparator);
      parts[0] = suggestion;
      onChange(parts.join(valueSeparator));
    } else {
      onChange(suggestion);
    }
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open || filtered.length === 0) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        setOpen(true);
        e.preventDefault();
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" || e.key === "Tab") {
      if (filtered[highlightIndex]) {
        e.preventDefault();
        selectSuggestion(filtered[highlightIndex]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={wrapperRef} className="autocomplete-wrapper">
      <input
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
      />
      {open && filtered.length > 0 && (
        <div ref={listRef} className="autocomplete-dropdown">
          {filtered.map((item, i) => (
            <div
              key={item}
              className={`autocomplete-item ${i === highlightIndex ? "highlighted" : ""}`}
              onMouseDown={() => selectSuggestion(item)}
              onMouseEnter={() => setHighlightIndex(i)}
            >
              <HighlightMatch text={item} query={searchText} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const lower = text.toLowerCase();
  const idx = lower.indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <strong>{text.slice(idx, idx + query.length)}</strong>
      {text.slice(idx + query.length)}
    </>
  );
}
