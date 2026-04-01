import type { ValidationWarning } from "../utils/validation";

interface ValidationPanelProps {
  warnings: ValidationWarning[];
  onNavigate: (missionIndex: number) => void;
}

export function ValidationPanel({ warnings, onNavigate }: ValidationPanelProps) {
  if (warnings.length === 0) {
    return (
      <div className="validation-panel">
        <div className="validation-empty">No issues found</div>
      </div>
    );
  }

  const errors = warnings.filter((w) => w.level === "error");
  const warns = warnings.filter((w) => w.level === "warning");

  return (
    <div className="validation-panel">
      <div className="validation-summary">
        {errors.length > 0 && <span className="validation-count error">{errors.length} error{errors.length !== 1 ? "s" : ""}</span>}
        {warns.length > 0 && <span className="validation-count warning">{warns.length} warning{warns.length !== 1 ? "s" : ""}</span>}
      </div>
      {warnings.map((w, i) => (
        <div
          key={i}
          className="validation-item"
          onClick={() => onNavigate(w.missionIndex)}
        >
          <span className={`validation-icon ${w.level}`}>
            {w.level === "error" ? "\u2716" : "\u26A0"}
          </span>
          <span className="validation-location">#{w.missionId}</span>
          <span className="validation-message">{w.message}</span>
        </div>
      ))}
    </div>
  );
}
