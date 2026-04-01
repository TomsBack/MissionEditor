import type { ValidationWarning } from "../utils/validation";

interface ValidationPanelProps {
  warnings: ValidationWarning[];
  onNavigate: (missionIndex: number) => void;
}

export function ValidationPanel({ warnings, onNavigate }: ValidationPanelProps) {
  if (warnings.length === 0) {
    return (
      <div className="validation-panel">
        <span className="validation-ok">No issues found</span>
      </div>
    );
  }

  return (
    <div className="validation-panel">
      <div className="validation-header">
        {warnings.length} issue{warnings.length !== 1 ? "s" : ""}
      </div>
      <div className="validation-list">
        {warnings.map((w, i) => (
          <div
            key={i}
            className={`validation-item validation-${w.level}`}
            onClick={() => onNavigate(w.missionIndex)}
          >
            <span className="validation-badge">{w.level === "error" ? "ERR" : "WARN"}</span>
            <span className="validation-id">#{w.missionId}</span>
            <span className="validation-msg">{w.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
