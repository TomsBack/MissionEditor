import { useEffect, useState } from "react";

interface Props {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  float?: boolean;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function NumberInput({ value, onChange, min, max, step, float, disabled, className, style }: Props) {
  const safeValue = Number.isFinite(value) ? value : 0;
  const [draft, setDraft] = useState<string>(String(safeValue));

  useEffect(() => {
    if (Number(draft) !== safeValue) setDraft(String(safeValue));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeValue]);

  return (
    <input
      type="number"
      className={className}
      style={style}
      disabled={disabled}
      step={step}
      value={draft}
      onChange={(e) => {
        const v = e.target.value;
        setDraft(v);
        if (v === "" || v === "-" || v === "." || v === "-.") return;
        // Number() handles "1e5" correctly; parseInt would return 1.
        const raw = Number(v);
        if (!Number.isFinite(raw)) return;
        let n = float ? raw : Math.trunc(raw);
        if (min !== undefined) n = Math.max(min, n);
        if (max !== undefined) n = Math.min(max, n);
        onChange(n);
      }}
      onBlur={() => {
        if (draft === "" || draft === "-" || draft === "." || draft === "-.") setDraft(String(safeValue));
      }}
    />
  );
}
