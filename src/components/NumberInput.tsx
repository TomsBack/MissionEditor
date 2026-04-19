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
  const [draft, setDraft] = useState<string>(String(value));

  useEffect(() => {
    if (Number(draft) !== value) setDraft(String(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

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
        const n = float ? parseFloat(v) : parseInt(v, 10);
        if (!Number.isFinite(n)) return;
        let clamped = n;
        if (min !== undefined) clamped = Math.max(min, clamped);
        if (max !== undefined) clamped = Math.min(max, clamped);
        onChange(clamped);
      }}
      onBlur={() => {
        if (draft === "" || draft === "-" || draft === "." || draft === "-.") setDraft(String(value));
      }}
    />
  );
}
