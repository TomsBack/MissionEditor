import type { ValidationWarning } from "../utils/validation";
import { useTranslation } from "react-i18next";

interface ValidationPanelProps {
  warnings: ValidationWarning[];
  onNavigate: (missionIndex: number) => void;
}

export function ValidationPanel({ warnings, onNavigate }: ValidationPanelProps) {
  const { t } = useTranslation();

  if (warnings.length === 0) {
    return (
      <div className="validation-panel">
        <div className="validation-empty">{t("validation.noIssues")}</div>
      </div>
    );
  }

  const errors = warnings.filter((w) => w.level === "error");
  const warns = warnings.filter((w) => w.level === "warning");

  return (
    <div className="validation-panel">
      <div className="validation-summary">
        {errors.length > 0 && <span className="validation-count error">{errors.length} {errors.length !== 1 ? t("validation.errors") : t("validation.error")}</span>}
        {warns.length > 0 && <span className="validation-count warning">{warns.length} {warns.length !== 1 ? t("validation.warnings") : t("validation.warning")}</span>}
      </div>
      {warnings.map((w, i) => (
        <div
          key={i}
          className={`validation-item${w.missionIndex >= 0 ? " clickable" : ""}`}
          onClick={() => w.missionIndex >= 0 && onNavigate(w.missionIndex)}
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
